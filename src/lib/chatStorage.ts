import type { ConversationState, TurnstileState } from "@/lib/chatGuard";
import { createAdminSupabaseClient } from "@/lib/supabase";

export type ChatStorageOperation = "read" | "write" | "append";

/**
 * A storage read or write the chat flow depends on failed. Deliberately
 * content-free: the message names only the operation, never a payload, so it
 * is safe to log and cannot carry a visitor's contact details or transcript.
 */
export class ChatStorageError extends Error {
  constructor(
    readonly operation: ChatStorageOperation,
    readonly code?: string,
  ) {
    super(`Chat storage ${operation} failed`);
    this.name = "ChatStorageError";
  }
}

function storageFailure(
  operation: ChatStorageOperation,
  error: { code?: string } | null,
): ChatStorageError {
  // Log the operation and Postgres/PostgREST code only: error messages and
  // details can echo row values such as an email or phone number.
  console.error(`[chat-storage] ${operation} failed`, { code: error?.code });
  return new ChatStorageError(operation, error?.code);
}

export type ChatRole = "user" | "assistant" | "system";

export interface ChatMessageRecord {
  id?: string;
  role: ChatRole;
  content: string;
  createdAt?: string;
}

export interface ChatConversationRecord {
  id: string;
  visitorName: string | null;
  visitorEmail: string | null;
  visitorPhone: string | null;
  startedAt: string;
  endedAt: string | null;
  status: "active" | "completed" | "abandoned";
  summary: string | null;
  intent: string | null;
  leadScore: number | null;
  scoreTier: "high" | "medium" | "low" | null;
  followUpStatus: "pending" | "in_progress" | "completed" | "no_action";
}

interface UpsertConversationInput {
  conversationId: string;
  visitorName?: string | null;
  visitorEmail?: string | null;
  /** E.164, e.g. +14787771266. */
  visitorPhone?: string | null;
  turnstileState?: TurnstileState | null;
}

/**
 * The columns this helper may write for a conversation, with null/undefined
 * left out so a stale caller can never erase captured lead data.
 */
export function buildConversationWrites(
  input: Omit<UpsertConversationInput, "conversationId">,
): Record<string, string> {
  const writes: Record<string, string> = {};
  if (input.visitorName) writes.visitor_name = input.visitorName;
  if (input.visitorEmail) writes.visitor_email = input.visitorEmail;
  if (input.visitorPhone) writes.visitor_phone = input.visitorPhone;
  if (input.turnstileState) writes.turnstile_state = input.turnstileState;
  return writes;
}

/**
 * Reads what the guard and contact capture need to know about a conversation.
 * Throws ChatStorageError on a read failure. Treating a failed read as "no
 * contact on file" would let the next write skip a stored email or phone, so
 * the caller must stop and let the visitor retry instead.
 */
export async function getConversationState(
  conversationId: string,
): Promise<ConversationState> {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("chat_conversations")
    .select("*")
    .eq("id", conversationId)
    .maybeSingle();

  if (error) throw storageFailure("read", error);
  return {
    exists: Boolean(data),
    turnstileState:
      data?.turnstile_state === "verified" ? "verified" : null,
    contact: {
      email: data?.visitor_email ?? null,
      phone: data?.visitor_phone ?? null,
    },
  };
}

/**
 * Inserts a new conversation row if one doesn't exist, or updates the
 * visitor name/email when new values are supplied. Idempotent: safe to
 * call on every chat turn.
 *
 * Importantly, callers that omit visitorName/visitorEmail (or pass null)
 * will NOT overwrite previously-captured values. Only non-null inputs are
 * written, so a stale client passing nothing can't erase lead data we've
 * already collected on a prior turn.
 */
export async function upsertConversation(
  input: UpsertConversationInput,
): Promise<void> {
  const supabase = createAdminSupabaseClient();

  // Step 1: ensure the row exists with the supplied values (insert-only on
  // conflict). This populates name/email if they're given on the very first
  // turn but takes no action if the row already exists.
  const writes = buildConversationWrites(input);
  const insertPayload: Record<string, unknown> = {
    id: input.conversationId,
    ...writes,
  };

  const { error: insertErr } = await supabase
    .from("chat_conversations")
    .upsert(insertPayload, {
      onConflict: "id",
      ignoreDuplicates: true,
    });
  if (insertErr) throw storageFailure("write", insertErr);

  // Step 2: if the caller supplied non-null metadata, update those columns.
  // Skip the update entirely when there's nothing new — that's the path that
  // used to clobber existing values with null.
  if (Object.keys(writes).length > 0) {
    const { error: updateErr } = await supabase
      .from("chat_conversations")
      .update(writes)
      .eq("id", input.conversationId);
    if (updateErr) throw storageFailure("write", updateErr);
  }
}

/**
 * Append a single message to a conversation. Used per-turn during the chat.
 * Throws ChatStorageError if the insert fails.
 */
export async function appendMessage(
  conversationId: string,
  role: ChatRole,
  content: string,
): Promise<void> {
  const supabase = createAdminSupabaseClient();
  const { error } = await supabase.from("chat_messages").insert({
    conversation_id: conversationId,
    role,
    content,
  });
  if (error) throw storageFailure("append", error);
}

/**
 * Atomically claim a conversation for finalization. Transitions the row
 * from `status='active'` AND `ended_at IS NULL` to the supplied terminal
 * status (`completed` or `abandoned`) with `ended_at` set to now.
 *
 * Returns true ONLY when this call actually transitioned the row. If
 * another concurrent /api/chat/end request already won the race, returns
 * false and the caller MUST skip scoring + emailing the digest.
 *
 * This is the canonical idempotency mechanism for end-of-conversation
 * side effects (digest emails). A read-then-act guard is racy; this
 * single conditional UPDATE is not.
 */
export async function claimConversationForFinalize(
  conversationId: string,
  terminalStatus: "completed" | "abandoned" = "completed",
): Promise<boolean> {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("chat_conversations")
    .update({
      status: terminalStatus,
      ended_at: new Date().toISOString(),
    })
    .eq("id", conversationId)
    .eq("status", "active")
    .is("ended_at", null)
    .select("id");

  if (error) {
    console.error("[chat-storage] claim failed", { code: error.code });
    return false;
  }
  return Array.isArray(data) && data.length === 1;
}

/**
 * Write analytical fields and any newly-captured visitor metadata to a
 * conversation that has already been claimed via
 * claimConversationForFinalize. Skips columns whose values are undefined
 * so callers can update only what they have.
 */
export async function writeConversationAnalytics(
  conversationId: string,
  fields: {
    summary?: string | null;
    intent?: string | null;
    leadScore?: number | null;
    scoreTier?: "high" | "medium" | "low" | null;
    visitorName?: string | null;
    visitorEmail?: string | null;
    visitorPhone?: string | null;
  },
): Promise<void> {
  const supabase = createAdminSupabaseClient();

  const updates: Record<string, unknown> = {};
  if (fields.summary !== undefined) updates.summary = fields.summary;
  if (fields.intent !== undefined) updates.intent = fields.intent;
  if (fields.leadScore !== undefined) updates.lead_score = fields.leadScore;
  if (fields.scoreTier !== undefined) updates.score_tier = fields.scoreTier;
  // Only persist visitor metadata when non-null — same rule as the upsert
  // helper, so we never overwrite captured leads with null.
  Object.assign(
    updates,
    buildConversationWrites({
      visitorName: fields.visitorName,
      visitorEmail: fields.visitorEmail,
      visitorPhone: fields.visitorPhone,
    }),
  );

  if (Object.keys(updates).length === 0) return;

  const { error } = await supabase
    .from("chat_conversations")
    .update(updates)
    .eq("id", conversationId);
  if (error) {
    console.error("[chat-storage] analytics write failed", { code: error.code });
  }
}

/**
 * Fetch all messages for a conversation, ordered chronologically. Throws
 * ChatStorageError if either read fails, so a transient error can never look
 * like an empty (abandoned) conversation. Used by
 * the conversation-end handler to assemble the transcript for summarization
 * and the email digest.
 */
export async function getConversationTranscript(
  conversationId: string,
): Promise<{
  conversation: ChatConversationRecord | null;
  messages: ChatMessageRecord[];
}> {
  const supabase = createAdminSupabaseClient();

  const { data: convoRow, error: convoErr } = await supabase
    .from("chat_conversations")
    .select("*")
    .eq("id", conversationId)
    .maybeSingle();

  if (convoErr) throw storageFailure("read", convoErr);

  const { data: msgRows, error: msgErr } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (msgErr) throw storageFailure("read", msgErr);

  const conversation: ChatConversationRecord | null = convoRow
    ? {
        id: convoRow.id,
        visitorName: convoRow.visitor_name,
        visitorEmail: convoRow.visitor_email,
        visitorPhone: convoRow.visitor_phone ?? null,
        startedAt: convoRow.started_at,
        endedAt: convoRow.ended_at,
        status: convoRow.status,
        summary: convoRow.summary,
        intent: convoRow.intent,
        leadScore: convoRow.lead_score,
        scoreTier: convoRow.score_tier,
        followUpStatus: convoRow.follow_up_status,
      }
    : null;

  const messages: ChatMessageRecord[] = (msgRows ?? []).map((row) => ({
    id: row.id,
    role: row.role,
    content: row.content,
    createdAt: row.created_at,
  }));

  return { conversation, messages };
}
