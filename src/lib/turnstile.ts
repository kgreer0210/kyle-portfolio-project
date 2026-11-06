import { z } from "zod";

export const TURNSTILE_ACTION = "chat";
export const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";
export const TURNSTILE_TIMEOUT_MS = 5000;
// Cloudflare rejects tokens longer than this, so never forward more.
export const TURNSTILE_MAX_TOKEN_LENGTH = 2048;

export type TurnstileConfig =
  | {
      enabled: false;
      reason: "missing-site-key" | "missing-secret" | "missing-hostnames";
    }
  | { enabled: true; secret: string; allowedHostnames: string[] };

/**
 * Parses TURNSTILE_ALLOWED_HOSTNAMES. Entries must be exact hostnames: no
 * wildcards, schemes, ports, or paths. Invalid entries are dropped rather than
 * widening the allowlist.
 */
export function parseAllowedHostnames(raw: string | undefined): string[] {
  if (!raw) return [];
  const hostnames = raw
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => /^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/.test(entry));
  return [...new Set(hostnames)];
}

/**
 * Turnstile only runs when the public site key, the server secret, and an
 * explicit hostname allowlist are all present. Anything missing is a
 * bypass, not an error: visitors must never be locked out by configuration.
 */
export function getTurnstileConfig(
  env: Record<string, string | undefined> = process.env,
): TurnstileConfig {
  if (!env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
    return { enabled: false, reason: "missing-site-key" };
  }
  if (!env.TURNSTILE_SECRET_KEY) {
    return { enabled: false, reason: "missing-secret" };
  }
  const allowedHostnames = parseAllowedHostnames(
    env.TURNSTILE_ALLOWED_HOSTNAMES,
  );
  if (allowedHostnames.length === 0) {
    return { enabled: false, reason: "missing-hostnames" };
  }
  return {
    enabled: true,
    secret: env.TURNSTILE_SECRET_KEY,
    allowedHostnames,
  };
}

export type TurnstileOutcome =
  | { status: "verified" }
  | {
      status: "rejected";
      reason: "missing-token" | "invalid-token" | "wrong-action" | "wrong-hostname";
    }
  | {
      status: "unavailable";
      reason: "network" | "timeout" | "bad-response" | "misconfigured";
    };

const siteverifySchema = z.object({
  success: z.boolean(),
  "error-codes": z.array(z.string()).optional(),
  hostname: z.string().optional(),
  action: z.string().optional(),
});

// Cloudflare reports these when OUR secret is wrong, so every visitor would
// fail. Treat as unavailable, not as a rejected visitor.
const MISCONFIGURED_CODES = new Set([
  "missing-input-secret",
  "invalid-input-secret",
]);

export interface VerifyTurnstileInput {
  token: string | null | undefined;
  secret: string;
  allowedHostnames: string[];
  remoteIp?: string | null;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

/**
 * Verifies one Turnstile token with Cloudflare siteverify. Tokens are single
 * use: Cloudflare itself answers `timeout-or-duplicate` for a replay, which
 * surfaces here as `rejected`. Never throws.
 */
export async function verifyTurnstileToken(
  input: VerifyTurnstileInput,
): Promise<TurnstileOutcome> {
  const token = input.token?.trim();
  if (!token) return { status: "rejected", reason: "missing-token" };
  if (token.length > TURNSTILE_MAX_TOKEN_LENGTH) {
    return { status: "rejected", reason: "invalid-token" };
  }

  const body = new URLSearchParams({ secret: input.secret, response: token });
  if (input.remoteIp) body.set("remoteip", input.remoteIp);

  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    input.timeoutMs ?? TURNSTILE_TIMEOUT_MS,
  );

  let response: Response;
  try {
    response = await (input.fetchImpl ?? fetch)(TURNSTILE_VERIFY_URL, {
      method: "POST",
      body,
      signal: controller.signal,
    });
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";
    return { status: "unavailable", reason: aborted ? "timeout" : "network" };
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) return { status: "unavailable", reason: "bad-response" };

  const parsed = siteverifySchema.safeParse(
    await response.json().catch(() => null),
  );
  if (!parsed.success) return { status: "unavailable", reason: "bad-response" };

  const result = parsed.data;
  const errorCodes = result["error-codes"] ?? [];

  if (!result.success) {
    if (errorCodes.some((code) => MISCONFIGURED_CODES.has(code))) {
      return { status: "unavailable", reason: "misconfigured" };
    }
    if (errorCodes.includes("internal-error")) {
      return { status: "unavailable", reason: "bad-response" };
    }
    return { status: "rejected", reason: "invalid-token" };
  }

  if (result.action !== TURNSTILE_ACTION) {
    return { status: "rejected", reason: "wrong-action" };
  }
  const hostname = result.hostname?.toLowerCase();
  if (!hostname || !input.allowedHostnames.includes(hostname)) {
    return { status: "rejected", reason: "wrong-hostname" };
  }
  return { status: "verified" };
}
