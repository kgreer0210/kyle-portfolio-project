import { createHmac, randomBytes } from "node:crypto";
import { isIP } from "node:net";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface RateCheck {
  key: string;
  limit: number;
  windowSeconds: number;
}

export interface RateResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

/** `hit` counts one request against every check and reports each result in order. */
export interface RateLimiter {
  hit(checks: RateCheck[]): Promise<RateResult[]>;
}

/**
 * Chat limits. Fixed windows, so a client can burst up to twice a limit across
 * a window boundary; the per-minute and per-hour pairs keep that bounded.
 * Per-IP numbers are generous enough for a shared office or school NAT while
 * still stopping a script.
 */
export const CHAT_RATE_LIMITS = {
  ipPerMinute: { limit: 15, windowSeconds: 60 },
  ipPerHour: { limit: 100, windowSeconds: 3600 },
  conversationPerMinute: { limit: 6, windowSeconds: 60 },
  conversationPerHour: { limit: 40, windowSeconds: 3600 },
  newConversationPerIpHour: { limit: 10, windowSeconds: 3600 },
} as const;

/* ------------------------------------------------------------------ */
/*  Client IP and keyed hashing                                        */
/* ------------------------------------------------------------------ */

function expandIpv6(address: string): string[] | null {
  let text = address;
  const embeddedV4 = /(\d+\.\d+\.\d+\.\d+)$/.exec(text);
  if (embeddedV4) {
    const octets = embeddedV4[1].split(".").map(Number);
    if (octets.some((o) => o > 255)) return null;
    const high = ((octets[0] << 8) | octets[1]).toString(16);
    const low = ((octets[2] << 8) | octets[3]).toString(16);
    text = text.slice(0, -embeddedV4[1].length) + `${high}:${low}`;
  }
  const halves = text.split("::");
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(":") : [];
  if (halves.length === 1) {
    return head.length === 8 ? head.map((g) => g.padStart(4, "0")) : null;
  }
  const tail = halves[1] ? halves[1].split(":") : [];
  const missing = 8 - head.length - tail.length;
  if (missing < 1) return null;
  return [...head, ...Array<string>(missing).fill("0"), ...tail].map((g) =>
    g.padStart(4, "0"),
  );
}

/**
 * Canonical form of one client address. IPv4 stays as is, IPv4-mapped IPv6
 * becomes IPv4, and other IPv6 is lower-cased and written as eight groups
 * without leading zeros. This is a real address (safe to hand to Cloudflare's
 * `remoteip`); use `ipBucketKey` for the rate-limit bucket.
 */
export function normalizeIp(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const candidate = raw.trim().replace(/^\[|\]$/g, "").split("%")[0].toLowerCase();
  const family = isIP(candidate);
  if (family === 4) return candidate;
  if (family !== 6) return null;

  const groups = expandIpv6(candidate);
  if (!groups) return null;
  const mapped = /^0000:0000:0000:0000:0000:ffff:([0-9a-f]{4}):([0-9a-f]{4})$/.exec(
    groups.join(":"),
  );
  if (mapped) {
    const high = parseInt(mapped[1], 16);
    const low = parseInt(mapped[2], 16);
    return [high >> 8, high & 255, low >> 8, low & 255].join(".");
  }
  return groups.map((group) => group.replace(/^0+(?=.)/, "")).join(":");
}

/**
 * The unit we rate limit by: IPv4 as is, IPv6 collapsed to its /64 so a client
 * cannot dodge limits by rotating through the addresses of one subnet. The
 * result may be a CIDR string, so it is for bucketing only, never `remoteip`.
 */
export function ipBucketKey(ip: string): string {
  if (!ip.includes(":")) return ip;
  const groups = expandIpv6(ip);
  return groups ? `${groups.slice(0, 4).join(":")}::/64` : ip;
}

/**
 * The client address as seen by Vercel's edge, which sets these headers itself
 * and overwrites any client-supplied values. Off Vercel, the final fallback
 * trusts the first X-Forwarded-For entry, so self-hosting needs a proxy that
 * does the same.
 */
export function getClientIp(headers: Pick<Headers, "get">): string | null {
  const forwardedFor = headers.get("x-forwarded-for")?.split(",")[0];
  return (
    normalizeIp(headers.get("x-vercel-forwarded-for")?.split(",")[0]) ??
    normalizeIp(headers.get("x-real-ip")) ??
    normalizeIp(forwardedFor)
  );
}

/** Keyed, namespaced HMAC-SHA256, truncated to 128 bits. Safe to persist. */
export function hashForBucket(
  secret: string,
  namespace: string,
  value: string,
): string {
  return createHmac("sha256", secret)
    .update(`${namespace}\0${value}`)
    .digest("hex")
    .slice(0, 32);
}

/** Process-lifetime secret for the in-memory fallback when RATE_LIMIT_SECRET is unset. */
export const ephemeralRateLimitSecret = randomBytes(32).toString("hex");

/* ------------------------------------------------------------------ */
/*  Limiters                                                           */
/* ------------------------------------------------------------------ */

function windowStartSeconds(nowSeconds: number, windowSeconds: number): number {
  return Math.floor(nowSeconds / windowSeconds) * windowSeconds;
}

/**
 * Per-instance limiter with the same fixed-window semantics as the database
 * function. Used when the database limiter is unavailable or unconfigured, so
 * it only bounds what a single serverless instance sees.
 */
export function createMemoryRateLimiter(
  now: () => number = () => Date.now(),
  maxEntries = 5000,
): RateLimiter {
  const entries = new Map<string, { windowStart: number; count: number; windowSeconds: number }>();

  function prune(nowSeconds: number) {
    if (entries.size <= maxEntries) return;
    for (const [key, entry] of entries) {
      if (entry.windowStart + entry.windowSeconds <= nowSeconds) entries.delete(key);
    }
    // Still over budget: drop the oldest insertions.
    for (const key of entries.keys()) {
      if (entries.size <= maxEntries) break;
      entries.delete(key);
    }
  }

  return {
    async hit(checks) {
      const nowSeconds = now() / 1000;
      prune(nowSeconds);
      return checks.map((check) => {
        const windowStart = windowStartSeconds(nowSeconds, check.windowSeconds);
        const entry = entries.get(check.key);
        const count =
          entry && entry.windowStart === windowStart ? entry.count + 1 : 1;
        // Re-insert so an active key moves to the end of the Map and
        // eviction (oldest first) drops idle counters before busy ones.
        entries.delete(check.key);
        entries.set(check.key, {
          windowStart,
          count,
          windowSeconds: check.windowSeconds,
        });
        return {
          allowed: count <= check.limit,
          retryAfterSeconds: Math.max(
            1,
            Math.ceil(windowStart + check.windowSeconds - nowSeconds),
          ),
        };
      });
    },
  };
}

interface RateLimitRow {
  ord: number;
  allowed: boolean;
  retry_after_seconds: number;
}

/** Limiter backed by the atomic `chat_rate_limit_hit` Postgres function. */
export function createSupabaseRateLimiter(client: SupabaseClient): RateLimiter {
  return {
    async hit(checks) {
      const { data, error } = await client.rpc("chat_rate_limit_hit", {
        p_checks: checks.map((check) => ({
          key: check.key,
          limit: check.limit,
          window_seconds: check.windowSeconds,
        })),
      });
      if (error) throw new Error(`chat_rate_limit_hit failed: ${error.message}`);

      const rows = (data ?? []) as RateLimitRow[];
      if (rows.length !== checks.length) {
        throw new Error("chat_rate_limit_hit returned an unexpected row count");
      }
      return [...rows]
        .sort((a, b) => a.ord - b.ord)
        .map((row) => ({
          allowed: row.allowed,
          retryAfterSeconds: row.retry_after_seconds,
        }));
    },
  };
}

/**
 * If the primary limiter errors (database down, migration not applied), fall
 * back to the per-instance limiter instead of failing open with no limit at
 * all or failing closed and taking chat down.
 */
export function withFallback(
  primary: RateLimiter,
  fallback: RateLimiter,
  onError: (error: unknown) => void,
): RateLimiter {
  return {
    async hit(checks) {
      try {
        return await primary.hit(checks);
      } catch (error) {
        onError(error);
        return fallback.hit(checks);
      }
    },
  };
}

/** The most restrictive wait among denied results, or null when all passed. */
export function longestDenial(results: RateResult[]): number | null {
  const denied = results.filter((result) => !result.allowed);
  if (denied.length === 0) return null;
  return Math.max(...denied.map((result) => result.retryAfterSeconds));
}
