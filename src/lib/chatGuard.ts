import type { VisitorContact } from "@/lib/chatContact";
import {
  CHAT_RATE_LIMITS,
  hashForBucket,
  ipBucketKey,
  longestDenial,
  type RateCheck,
  type RateLimiter,
} from "@/lib/rateLimit";
import type { TurnstileConfig, TurnstileOutcome } from "@/lib/turnstile";

export type TurnstileState = "verified";

export interface ConversationState {
  exists: boolean;
  /** Set server-side only. null means the conversation has not passed the gate. */
  turnstileState: TurnstileState | null;
  contact: VisitorContact;
}

export type ChatRejectionCode =
  | "turnstile_required"
  | "turnstile_failed"
  | "turnstile_unavailable"
  | "rate_limited";

export type GuardDecision =
  | {
      ok: true;
      conversation: ConversationState;
      /** Value to persist on the conversation, or null to leave it unchanged. */
      turnstileState: TurnstileState | null;
    }
  | {
      ok: false;
      status: 403 | 429 | 503;
      code: ChatRejectionCode;
      message: string;
      retryAfterSeconds?: number;
    };

export interface GuardDeps {
  config: TurnstileConfig;
  limiter: RateLimiter;
  /** Secret for the bucket HMAC. */
  hashSecret: string;
  getConversationState(conversationId: string): Promise<ConversationState>;
  verifyToken(token: string, ip: string | null): Promise<TurnstileOutcome>;
  /** Diagnostic logging; must never receive visitor content or raw IPs. */
  log(level: "warn" | "error", message: string): void;
}

export interface GuardInput {
  /** A validated UUID. Lower-cased here so case variants share a bucket. */
  conversationId: string;
  /**
   * Exact normalized client address (never a CIDR), or null when the platform
   * did not provide one. Bucketed internally; passed as-is to Cloudflare.
   */
  ip: string | null;
  turnstileToken?: string | null;
}

function waitPhrase(seconds: number): string {
  if (seconds < 90) return `about ${seconds} seconds`;
  return `about ${Math.ceil(seconds / 60)} minutes`;
}

function rateLimited(retryAfterSeconds: number): GuardDecision {
  return {
    ok: false,
    status: 429,
    code: "rate_limited",
    message: `You're sending messages faster than I can keep up. Please wait ${waitPhrase(retryAfterSeconds)} and try again.`,
    retryAfterSeconds,
  };
}

const TURNSTILE_REQUIRED: GuardDecision = {
  ok: false,
  status: 403,
  code: "turnstile_required",
  message:
    "I need a quick security check before we start. Give it a second, then send your message again.",
};

const TURNSTILE_UNAVAILABLE: GuardDecision = {
  ok: false,
  status: 503,
  code: "turnstile_unavailable",
  message:
    "I couldn't finish the security check just now. Please try again in a moment, or reach me directly.",
};

const TURNSTILE_FAILED: GuardDecision = {
  ok: false,
  status: 403,
  code: "turnstile_failed",
  message:
    "The security check didn't go through. Please send your message again and it should clear.",
};

// Logged at most once per process per reason so a misconfiguration is visible
// without flooding the logs on every first message.
const loggedBypasses = new Set<string>();

export function resetBypassLogForTests(): void {
  loggedBypasses.clear();
}

function logBypassOnce(deps: GuardDeps, reason: string) {
  if (loggedBypasses.has(reason)) return;
  loggedBypasses.add(reason);
  deps.log(
    "warn",
    `[chat-abuse][DIAGNOSTIC][NOT PRODUCTION SAFE] Turnstile verification is bypassed (${reason}). Rate limits still apply.`,
  );
}

/**
 * Decides whether a chat request may proceed, before any content is stored or
 * the model is called.
 *
 * 1. Rate limits (per IP, per conversation, per new conversation) always run.
 * 2. Turnstile is required once per conversation, on the first message. The
 *    pass is remembered in the database, never taken from the client.
 *
 * Fail closed: when keys are configured, a first message without a verified
 * token is never accepted. A blocked script, a Cloudflare outage, or a
 * rejected secret all end in a retryable refusal (the widget keeps the normal
 * contact options visible) so a bot cannot skip verification by blocking the
 * script.
 */
export async function guardChatRequest(
  input: GuardInput,
  deps: GuardDeps,
): Promise<GuardDecision> {
  const conversationId = input.conversationId.toLowerCase();
  const conversation = await deps.getConversationState(conversationId);

  const ipHash = hashForBucket(
    deps.hashSecret,
    "ip",
    input.ip ? ipBucketKey(input.ip) : "unknown",
  );
  const conversationHash = hashForBucket(deps.hashSecret, "conversation", conversationId);
  const { ipPerMinute, ipPerHour, conversationPerMinute, conversationPerHour } =
    CHAT_RATE_LIMITS;

  const checks: RateCheck[] = [
    { key: `ip-m:${ipHash}`, ...ipPerMinute },
    { key: `ip-h:${ipHash}`, ...ipPerHour },
    { key: `conv-m:${conversationHash}`, ...conversationPerMinute },
    { key: `conv-h:${conversationHash}`, ...conversationPerHour },
  ];
  if (!conversation.exists) {
    checks.push({
      key: `ip-new:${ipHash}`,
      ...CHAT_RATE_LIMITS.newConversationPerIpHour,
    });
  }

  const wait = longestDenial(await deps.limiter.hit(checks));
  if (wait !== null) return rateLimited(wait);

  const pass = (turnstileState: TurnstileState | null): GuardDecision => ({
    ok: true,
    conversation,
    turnstileState,
  });

  if (conversation.turnstileState !== null) return pass(null);

  if (!deps.config.enabled) {
    logBypassOnce(deps, deps.config.reason);
    return pass(null);
  }

  const token = input.turnstileToken?.trim();
  if (!token) return TURNSTILE_REQUIRED;

  const outcome = await deps.verifyToken(token, input.ip);
  switch (outcome.status) {
    case "verified":
      return pass("verified");
    case "rejected":
      return TURNSTILE_FAILED;
    case "unavailable":
      deps.log(
        outcome.reason === "misconfigured" ? "error" : "warn",
        outcome.reason === "misconfigured"
          ? "[chat-abuse] Turnstile secret was rejected by Cloudflare. Check TURNSTILE_SECRET_KEY; first messages are blocked until fixed."
          : `[chat-abuse] Turnstile verification unavailable (${outcome.reason}); first message refused.`,
      );
      return TURNSTILE_UNAVAILABLE;
  }
}
