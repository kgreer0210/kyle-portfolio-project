import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createMemoryRateLimiter,
  createSupabaseRateLimiter,
  getClientIp,
  hashForBucket,
  longestDenial,
  normalizeIp,
  withFallback,
  type RateCheck,
  type RateLimiter,
} from "@/lib/rateLimit";

function headers(values: Record<string, string>) {
  return new Headers(values);
}

describe("normalizeIp", () => {
  it("keeps IPv4 and unwraps IPv4-mapped IPv6", () => {
    expect(normalizeIp("203.0.113.9")).toBe("203.0.113.9");
    expect(normalizeIp("::ffff:203.0.113.9")).toBe("203.0.113.9");
  });

  it("collapses IPv6 to its /64 so one subnet is one bucket", () => {
    const a = normalizeIp("2001:db8:abcd:12:1111:2222:3333:4444");
    const b = normalizeIp("2001:DB8:abcd:12::1");
    expect(a).toBe("2001:0db8:abcd:0012::/64");
    expect(b).toBe(a);
    expect(normalizeIp("2001:db8:abcd:13::1")).not.toBe(a);
  });

  it("rejects values that are not IP addresses", () => {
    expect(normalizeIp("not-an-ip")).toBeNull();
    expect(normalizeIp("999.1.1.1")).toBeNull();
    expect(normalizeIp("")).toBeNull();
    expect(normalizeIp(null)).toBeNull();
  });
});

describe("getClientIp", () => {
  it("prefers Vercel's header over forwarded-for", () => {
    expect(
      getClientIp(
        headers({
          "x-vercel-forwarded-for": "203.0.113.9",
          "x-forwarded-for": "198.51.100.1",
        }),
      ),
    ).toBe("203.0.113.9");
  });

  it("falls back to x-real-ip, then the first forwarded-for entry", () => {
    expect(getClientIp(headers({ "x-real-ip": "203.0.113.5" }))).toBe("203.0.113.5");
    expect(
      getClientIp(headers({ "x-forwarded-for": "198.51.100.1, 10.0.0.1" })),
    ).toBe("198.51.100.1");
  });

  it("ignores garbage and returns null when nothing usable is present", () => {
    expect(getClientIp(headers({ "x-vercel-forwarded-for": "garbage" }))).toBeNull();
    expect(getClientIp(headers({}))).toBeNull();
  });
});

describe("hashForBucket", () => {
  it("is stable for the same secret, namespace, and value", () => {
    expect(hashForBucket("s", "ip", "203.0.113.9")).toBe(hashForBucket("s", "ip", "203.0.113.9"));
  });

  it("changes with the secret and with the namespace", () => {
    const base = hashForBucket("s", "ip", "203.0.113.9");
    expect(hashForBucket("other", "ip", "203.0.113.9")).not.toBe(base);
    expect(hashForBucket("s", "conversation", "203.0.113.9")).not.toBe(base);
  });

  it("never contains the raw value", () => {
    const hash = hashForBucket("s", "ip", "203.0.113.9");
    expect(hash).toMatch(/^[0-9a-f]{32}$/);
    expect(hash).not.toContain("203");
  });
});

describe("createMemoryRateLimiter", () => {
  const check: RateCheck = { key: "k", limit: 2, windowSeconds: 60 };

  it("allows up to the limit in a window, then denies with a wait", async () => {
    let now = 120_000;
    const limiter = createMemoryRateLimiter(() => now);

    expect((await limiter.hit([check]))[0].allowed).toBe(true);
    expect((await limiter.hit([check]))[0].allowed).toBe(true);
    now += 10_000;
    const denied = (await limiter.hit([check]))[0];
    expect(denied.allowed).toBe(false);
    expect(denied.retryAfterSeconds).toBe(50);
  });

  it("starts a fresh window on the next boundary", async () => {
    let now = 120_000;
    const limiter = createMemoryRateLimiter(() => now);
    await limiter.hit([check]);
    await limiter.hit([check]);
    await limiter.hit([check]);

    now += 60_000;
    expect((await limiter.hit([check]))[0].allowed).toBe(true);
  });

  it("tracks keys independently and answers each check in order", async () => {
    const limiter = createMemoryRateLimiter(() => 0);
    const results = await limiter.hit([
      { key: "a", limit: 1, windowSeconds: 60 },
      { key: "b", limit: 1, windowSeconds: 60 },
    ]);
    expect(results.map((r) => r.allowed)).toEqual([true, true]);
    const again = await limiter.hit([{ key: "a", limit: 1, windowSeconds: 60 }]);
    expect(again[0].allowed).toBe(false);
  });

  it("stays bounded under many distinct keys", async () => {
    const limiter = createMemoryRateLimiter(() => 0, 100);
    for (let i = 0; i < 500; i++) {
      await limiter.hit([{ key: `k${i}`, limit: 1, windowSeconds: 3600 }]);
    }
    // Oldest keys were evicted, so they get a fresh count.
    const first = await limiter.hit([{ key: "k0", limit: 1, windowSeconds: 3600 }]);
    expect(first[0].allowed).toBe(true);
  });
});

describe("createSupabaseRateLimiter", () => {
  function clientReturning(result: { data: unknown; error: { message: string } | null }) {
    const rpc = vi.fn(async () => result);
    return { client: { rpc } as unknown as SupabaseClient, rpc };
  }

  it("sends the checks to the atomic function and returns results in input order", async () => {
    const { client, rpc } = clientReturning({
      data: [
        { ord: 2, allowed: false, retry_after_seconds: 30 },
        { ord: 1, allowed: true, retry_after_seconds: 5 },
      ],
      error: null,
    });

    const results = await createSupabaseRateLimiter(client).hit([
      { key: "a", limit: 5, windowSeconds: 60 },
      { key: "b", limit: 1, windowSeconds: 3600 },
    ]);

    expect(rpc).toHaveBeenCalledWith("chat_rate_limit_hit", {
      p_checks: [
        { key: "a", limit: 5, window_seconds: 60 },
        { key: "b", limit: 1, window_seconds: 3600 },
      ],
    });
    expect(results).toEqual([
      { allowed: true, retryAfterSeconds: 5 },
      { allowed: false, retryAfterSeconds: 30 },
    ]);
  });

  it("throws on a database error or a malformed response", async () => {
    const failing = clientReturning({ data: null, error: { message: "boom" } });
    await expect(
      createSupabaseRateLimiter(failing.client).hit([{ key: "a", limit: 1, windowSeconds: 1 }]),
    ).rejects.toThrow(/boom/);

    const short = clientReturning({ data: [], error: null });
    await expect(
      createSupabaseRateLimiter(short.client).hit([{ key: "a", limit: 1, windowSeconds: 1 }]),
    ).rejects.toThrow(/row count/);
  });
});

describe("withFallback", () => {
  const checks: RateCheck[] = [{ key: "a", limit: 1, windowSeconds: 60 }];

  it("uses the primary limiter while it works", async () => {
    const primary: RateLimiter = { hit: vi.fn(async () => [{ allowed: false, retryAfterSeconds: 9 }]) };
    const fallback: RateLimiter = { hit: vi.fn(async () => [{ allowed: true, retryAfterSeconds: 1 }]) };

    const results = await withFallback(primary, fallback, vi.fn()).hit(checks);

    expect(results[0].allowed).toBe(false);
    expect(fallback.hit).not.toHaveBeenCalled();
  });

  it("falls back, and reports the error, when the store fails", async () => {
    const primary: RateLimiter = { hit: vi.fn(async () => { throw new Error("db down"); }) };
    const fallback = createMemoryRateLimiter(() => 0);
    const onError = vi.fn();
    const limiter = withFallback(primary, fallback, onError);

    expect((await limiter.hit(checks))[0].allowed).toBe(true);
    expect((await limiter.hit(checks))[0].allowed).toBe(false);
    expect(onError).toHaveBeenCalledTimes(2);
  });
});

describe("longestDenial", () => {
  it("is null when every check passed", () => {
    expect(longestDenial([{ allowed: true, retryAfterSeconds: 3 }])).toBeNull();
  });

  it("returns the longest wait among denied checks only", () => {
    expect(
      longestDenial([
        { allowed: false, retryAfterSeconds: 10 },
        { allowed: true, retryAfterSeconds: 999 },
        { allowed: false, retryAfterSeconds: 40 },
      ]),
    ).toBe(40);
  });
});
