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
 * visitor name/email if those have been collected since. Idempotent: safe to
 * call on every chat turn.
 */
export async function upsertConversation(
  input: UpsertConversationInput,
): Promise<void> {
  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from("chat_conversations")
    .upsert(
      {
        id: input.conversationId,
        visitor_name: input.visitorName ?? null,
        visitor_email: input.visitorEmail ?? null,
      },
      { onConflict: "id", ignoreDuplicates: false },
    );
  if (error) {
    console.error("Failed to upsert chat conversation:", error);
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
 * Mark a conversation finished and write the summary/lead-score fields.
 */
export async function finalizeConversation(
  conversationId: string,
  fields: {
    status?: "completed" | "abandoned";
    summary?: string | null;
    intent?: string | null;
    leadScore?: number | null;
    scoreTier?: "high" | "medium" | "low" | null;
  },
): Promise<void> {
  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from("chat_conversations")
    .update({
      status: fields.status ?? "completed",
      summary: fields.summary ?? null,
      intent: fields.intent ?? null,
      lead_score: fields.leadScore ?? null,
      score_tier: fields.scoreTier ?? null,
      ended_at: new Date().toISOString(),
    })
    .eq("id", conversationId);
  if (error) {
    console.error("Failed to finalize chat conversation:", error);
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
