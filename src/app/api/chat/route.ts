import { NextRequest } from "next/server";
import { streamText, type ModelMessage } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { buildSystemPrompt } from "@/lib/chatKnowledge";
import {
  appendMessage,
  upsertConversation,
} from "@/lib/chatStorage";

export const runtime = "nodejs";
// Up to 5 minutes per request to allow longer streaming completions on
// Vercel Fluid Compute. Default would cut off mid-stream.
export const maxDuration = 300;

interface ChatRequestBody {
  conversationId: string;
  visitorName?: string | null;
  visitorEmail?: string | null;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  let body: ChatRequestBody;
  try {
    body = (await req.json()) as ChatRequestBody;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: "Chat is not configured. Please reach out via the contact form.",
      }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }

  if (!body.conversationId || !UUID_REGEX.test(body.conversationId)) {
    return new Response(
      JSON.stringify({ error: "Invalid conversationId" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return new Response(
      JSON.stringify({ error: "messages must be a non-empty array" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const trimmedMessages = body.messages
    .filter(
      (m) =>
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0,
    )
    .slice(-40)
    .map((m) => ({
      role: m.role,
      content: m.content.slice(0, 4000),
    }));

  // After sanitization the array can be empty even when body.messages had
  // entries (all blank, wrong roles, etc.). Reject with 400 instead of
  // crashing on the lastUserMessage indexing below. Also require the most
  // recent retained message to be a user turn — replying to our own assistant
  // message would be incoherent.
  const lastUserMessage = trimmedMessages[trimmedMessages.length - 1];
  if (!lastUserMessage || lastUserMessage.role !== "user") {
    return new Response(
      JSON.stringify({
        error: "messages must end with a non-empty user message",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const visitorName = body.visitorName?.trim().slice(0, 100) || null;
  const visitorEmail = body.visitorEmail?.trim().slice(0, 255) || null;

  // Persist conversation row + the incoming user message before kicking off
  // the stream. We don't await persistence in parallel with the model call
  // because if the row isn't there the cascade would fail when we try to
  // append the assistant response later.
  await upsertConversation({
    conversationId: body.conversationId,
    visitorName,
    visitorEmail,
  });

  await appendMessage(body.conversationId, "user", lastUserMessage.content);

  const systemPrompt = buildSystemPrompt({
    visitorName,
    visitorEmail,
    messageCount: trimmedMessages.filter((m) => m.role === "user").length,
  });

  try {
    const openrouter = createOpenRouter({ apiKey });

    const modelMessages: ModelMessage[] = trimmedMessages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const result = streamText({
      model: openrouter.chat("anthropic/claude-haiku-4.5"),
      system: systemPrompt,
      messages: modelMessages,
      temperature: 0.6,
      // Persist the assistant's final response once streaming completes.
      // This runs after the stream has been fully consumed by the client.
      onFinish: async ({ text }) => {
        if (text && text.trim().length > 0) {
          await appendMessage(body.conversationId, "assistant", text);
        }
      },
    });

    return result.toTextStreamResponse({
      headers: {
        "X-Conversation-Id": body.conversationId,
      },
    });
  } catch (error) {
    console.error("Chat streaming failed:", error);
    return new Response(
      JSON.stringify({
        error: "Sorry, the chat service is temporarily unavailable.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
