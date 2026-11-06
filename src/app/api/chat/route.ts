import { NextRequest } from "next/server";
import { streamText, type ModelMessage } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { z } from "zod";
import { buildSystemPrompt } from "@/lib/chatKnowledge";
import {
  extractEmails,
  mergeContactFromMessage,
  shouldAskForContact,
} from "@/lib/chatContact";
import { guardChatRequest, type GuardDeps } from "@/lib/chatGuard";
import {
  appendMessage,
  getConversationState,
  upsertConversation,
} from "@/lib/chatStorage";
import {
  createMemoryRateLimiter,
  createSupabaseRateLimiter,
  ephemeralRateLimitSecret,
  getClientIp,
  withFallback,
} from "@/lib/rateLimit";
import { createAdminSupabaseClient } from "@/lib/supabase";
import {
  getTurnstileConfig,
  TURNSTILE_MAX_TOKEN_LENGTH,
  verifyTurnstileToken,
} from "@/lib/turnstile";

export const runtime = "nodejs";
// Up to 5 minutes per request to allow longer streaming completions on
// Vercel Fluid Compute. Default would cut off mid-stream.
export const maxDuration = 300;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const chatRequestSchema = z.object({
  conversationId: z.string().regex(UUID_REGEX),
  visitorName: z.string().nullish(),
  visitorEmail: z.string().nullish(),
  messages: z.array(z.unknown()).min(1),
  turnstileToken: z.string().max(TURNSTILE_MAX_TOKEN_LENGTH).nullish(),
});

const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().refine((value) => value.trim().length > 0),
});

// Shared by every request on this instance. The memory limiter is the
// fallback when the database limiter errors or RATE_LIMIT_SECRET is unset.
const memoryLimiter = createMemoryRateLimiter();
let warnedMissingRateLimitSecret = false;

function json(
  body: Record<string, unknown>,
  status: number,
  headers: Record<string, string> = {},
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

function buildGuardDeps(ip: string | null): GuardDeps {
  const rateLimitSecret = process.env.RATE_LIMIT_SECRET;
  if (!rateLimitSecret && !warnedMissingRateLimitSecret) {
    warnedMissingRateLimitSecret = true;
    console.warn(
      "[chat-abuse][DIAGNOSTIC][NOT PRODUCTION SAFE] RATE_LIMIT_SECRET is not set; using per-instance rate limits only.",
    );
  }
  const config = getTurnstileConfig();

  return {
    config,
    limiter: rateLimitSecret
      ? withFallback(
          // Built per call so a missing Supabase env var is caught by the
          // fallback instead of failing the request.
          {
            hit: (checks) =>
              createSupabaseRateLimiter(createAdminSupabaseClient()).hit(checks),
          },
          memoryLimiter,
          (error) =>
            console.error(
              "[chat-abuse] Rate limit store failed; using per-instance limits:",
              error instanceof Error ? error.message : "unknown error",
            ),
        )
      : memoryLimiter,
    hashSecret: rateLimitSecret || ephemeralRateLimitSecret,
    getConversationState,
    verifyToken: (token, remoteIp) =>
      config.enabled
        ? verifyTurnstileToken({
            token,
            secret: config.secret,
            allowedHostnames: config.allowedHostnames,
            remoteIp: remoteIp ?? ip,
          })
        : Promise.resolve({ status: "unavailable", reason: "misconfigured" }),
    log: (level, message) => console[level](message),
  };
}

export async function POST(req: NextRequest) {
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return json(
      { error: "Chat is not configured. Please reach out via the contact form." },
      503,
    );
  }

  const parsed = chatRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return json(
      {
        error: "That request wasn't valid. Please refresh the page and try again.",
        code: "invalid_request",
      },
      400,
    );
  }
  const body = parsed.data;
  // One bucket and one row per UUID, regardless of letter case.
  const conversationId = body.conversationId.toLowerCase();

  const trimmedMessages = body.messages
    .flatMap((m) => {
      const message = chatMessageSchema.safeParse(m);
      return message.success ? [message.data] : [];
    })
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
    return json(
      {
        error: "messages must end with a non-empty user message",
        code: "invalid_request",
      },
      400,
    );
  }

  // Abuse checks run before anything is stored or the model is called, so a
  // rejected request leaves no conversation row or message behind.
  const ip = getClientIp(req.headers);
  const decision = await guardChatRequest(
    {
      conversationId,
      ip,
      turnstileToken: body.turnstileToken,
    },
    buildGuardDeps(ip),
  );
  if (!decision.ok) {
    return json(
      {
        error: decision.message,
        code: decision.code,
        ...(decision.retryAfterSeconds
          ? { retryAfterSeconds: decision.retryAfterSeconds }
          : {}),
      },
      decision.status,
      decision.retryAfterSeconds
        ? { "Retry-After": String(decision.retryAfterSeconds) }
        : {},
    );
  }

  const visitorName = body.visitorName?.trim().slice(0, 100) || null;

  // Contact capture runs on every user message, not just at the end, so a
  // tab close can't lose it. The widget's email form value only fills a gap:
  // it is re-sent on every turn, so letting it overwrite would undo an
  // in-chat correction.
  const formEmail = extractEmails(body.visitorEmail ?? "")[0] ?? null;
  const contact = mergeContactFromMessage(
    {
      email: decision.conversation.contact.email ?? formEmail,
      phone: decision.conversation.contact.phone,
    },
    lastUserMessage.content,
  );

  // Persist conversation row + the incoming user message before kicking off
  // the stream. We don't await persistence in parallel with the model call
  // because if the row isn't there the cascade would fail when we try to
  // append the assistant response later.
  await upsertConversation({
    conversationId,
    visitorName,
    visitorEmail: contact.email,
    visitorPhone: contact.phone,
    turnstileState: decision.turnstileState,
  });

  await appendMessage(conversationId, "user", lastUserMessage.content);

  const systemPrompt = buildSystemPrompt({
    visitorName,
    hasEmail: Boolean(contact.email),
    hasPhone: Boolean(contact.phone),
    askForContact: shouldAskForContact(trimmedMessages, contact),
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
          await appendMessage(conversationId, "assistant", text);
        }
      },
    });

    return result.toTextStreamResponse({
      headers: {
        "X-Conversation-Id": conversationId,
      },
    });
  } catch (error) {
    console.error("Chat streaming failed:", error);
    return json(
      { error: "Sorry, the chat service is temporarily unavailable." },
      500,
    );
  }
}
