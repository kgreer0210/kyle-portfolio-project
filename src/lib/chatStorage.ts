import { createAdminSupabaseClient } from "@/lib/supabase";

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
  const insertPayload: Record<string, unknown> = {
    id: input.conversationId,
  };
  if (input.visitorName) insertPayload.visitor_name = input.visitorName;
  if (input.visitorEmail) insertPayload.visitor_email = input.visitorEmail;

  const { error: insertErr } = await supabase
    .from("chat_conversations")
    .upsert(insertPayload, {
      onConflict: "id",
      ignoreDuplicates: true,
    });
  if (insertErr) {
    console.error("Failed to insert chat conversation:", insertErr);
  }

  // Step 2: if the caller supplied non-null name/email, update those columns.
  // Skip the update entirely when there's nothing new — that's the path that
  // used to clobber existing values with null.
  const updates: Record<string, unknown> = {};
  if (input.visitorName) updates.visitor_name = input.visitorName;
  if (input.visitorEmail) updates.visitor_email = input.visitorEmail;
  if (Object.keys(updates).length > 0) {
    const { error: updateErr } = await supabase
      .from("chat_conversations")
      .update(updates)
      .eq("id", input.conversationId);
    if (updateErr) {
      console.error("Failed to update chat conversation metadata:", updateErr);
    }
  }
}

/**
 * Append a single message to a conversation. Used per-turn during the chat.
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
  if (error) {
    console.error("Failed to append chat message:", error);
  }
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
    console.error("Failed to claim chat conversation for finalize:", error);
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
  if (fields.visitorName) updates.visitor_name = fields.visitorName;
  if (fields.visitorEmail) updates.visitor_email = fields.visitorEmail;

  if (Object.keys(updates).length === 0) return;

  const { error } = await supabase
    .from("chat_conversations")
    .update(updates)
    .eq("id", conversationId);
  if (error) {
    console.error("Failed to write chat conversation analytics:", error);
  }
}

/**
 * Fetch all messages for a conversation, ordered chronologically. Used by
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

  if (convoErr) {
    console.error("Failed to fetch chat conversation:", convoErr);
  }

  const { data: msgRows, error: msgErr } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (msgErr) {
    console.error("Failed to fetch chat messages:", msgErr);
  }

  const conversation: ChatConversationRecord | null = convoRow
    ? {
        id: convoRow.id,
        visitorName: convoRow.visitor_name,
        visitorEmail: convoRow.visitor_email,
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
