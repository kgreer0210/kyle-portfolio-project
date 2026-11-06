import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  guardChatRequest,
  resetBypassLogForTests,
  type ConversationState,
  type GuardDeps,
} from "@/lib/chatGuard";
import { createMemoryRateLimiter, type RateLimiter } from "@/lib/rateLimit";
import type { TurnstileConfig, TurnstileOutcome } from "@/lib/turnstile";

const ID = "3f2b8c1e-9d4a-4c7b-8e21-5a6f7b8c9d0e";
const IP = "203.0.113.9";

const NEW_CONVERSATION: ConversationState = {
  exists: false,
  turnstileState: null,
  contact: { email: null, phone: null },
};

const enabledConfig: TurnstileConfig = {
  enabled: true,
  secret: "secret",
  allowedHostnames: ["kygrsolutions.com"],
};

function setup(overrides: Partial<GuardDeps> = {}, state: ConversationState = NEW_CONVERSATION) {
  const verifyToken = vi.fn<GuardDeps["verifyToken"]>(async () => ({ status: "verified" }));
  const log = vi.fn<GuardDeps["log"]>();
  const deps: GuardDeps = {
    config: enabledConfig,
    limiter: createMemoryRateLimiter(() => 1_000_000),
    hashSecret: "hash-secret",
    getConversationState: async () => state,
    verifyToken,
    log,
    ...overrides,
  };
  return { deps, verifyToken, log };
}

beforeEach(() => resetBypassLogForTests());

describe("Turnstile on the first message", () => {
  it("verifies a token and asks the caller to remember the pass", async () => {
    const { deps, verifyToken } = setup();

    const decision = await guardChatRequest(
      { conversationId: ID, ip: IP, turnstileToken: "tok" },
      deps,
    );

    expect(decision).toMatchObject({ ok: true, turnstileState: "verified" });
    expect(verifyToken).toHaveBeenCalledWith("tok", IP);
  });

  it("asks for a token when none was sent", async () => {
    const { deps, verifyToken } = setup();

    const decision = await guardChatRequest({ conversationId: ID, ip: IP }, deps);

    expect(decision).toMatchObject({ ok: false, status: 403, code: "turnstile_required" });
    expect(verifyToken).not.toHaveBeenCalled();
  });

  it("rejects a bad, replayed, or wrong-host token with a recoverable message", async () => {
    for (const reason of ["invalid-token", "wrong-action", "wrong-hostname"] as const) {
      const { deps } = setup({
        verifyToken: async (): Promise<TurnstileOutcome> => ({ status: "rejected", reason }),
      });
      const decision = await guardChatRequest(
        { conversationId: ID, ip: IP, turnstileToken: "tok" },
        deps,
      );
      expect(decision).toMatchObject({ ok: false, status: 403, code: "turnstile_failed" });
      if (!decision.ok) expect(decision.message).toMatch(/send your message again/i);
    }
  });

  it("does not ask again once the conversation has passed, and ignores any token", async () => {
    const { deps, verifyToken } = setup(
      {},
      { exists: true, turnstileState: "verified", contact: { email: null, phone: null } },
    );

    const decision = await guardChatRequest({ conversationId: ID, ip: IP }, deps);

    expect(decision).toMatchObject({ ok: true, turnstileState: null });
    expect(verifyToken).not.toHaveBeenCalled();
  });

  it("does not trust a client that claims to be verified", async () => {
    const { deps } = setup();
    const decision = await guardChatRequest(
      // Unknown extra fields from a request body have no effect.
      { conversationId: ID, ip: IP, turnstileVerified: true } as never,
      deps,
    );
    expect(decision).toMatchObject({ ok: false, code: "turnstile_required" });
  });
});

describe("missing configuration", () => {
  it.each(["missing-site-key", "missing-secret", "missing-hostnames"] as const)(
    "bypasses Turnstile, logs a diagnostic once, and still rate limits (%s)",
    async (reason) => {
      const { deps, verifyToken, log } = setup({ config: { enabled: false, reason } });

      const first = await guardChatRequest({ conversationId: ID, ip: IP }, deps);
      const second = await guardChatRequest({ conversationId: ID, ip: IP }, deps);

      expect(first).toMatchObject({ ok: true, turnstileState: null });
      expect(second).toMatchObject({ ok: true });
      expect(verifyToken).not.toHaveBeenCalled();
      expect(log).toHaveBeenCalledTimes(1);
      expect(log.mock.calls[0][0]).toBe("warn");
      expect(log.mock.calls[0][1]).toMatch(/NOT PRODUCTION SAFE/);
      expect(log.mock.calls[0][1]).toContain(reason);
    },
  );

  it("keeps rate limiting while Turnstile is bypassed", async () => {
    const { deps } = setup({ config: { enabled: false, reason: "missing-secret" } });
    let last;
    for (let i = 0; i < 7; i++) {
      last = await guardChatRequest({ conversationId: ID, ip: IP }, deps);
    }
    expect(last).toMatchObject({ ok: false, status: 429, code: "rate_limited" });
  });
});

describe("when verification cannot complete (fail closed)", () => {
  it("refuses a first message that arrives without a token, whatever the client claims", async () => {
    const { deps, verifyToken } = setup();

    const decision = await guardChatRequest(
      // A bot blocking the script cannot talk its way past the gate.
      { conversationId: ID, ip: IP, turnstileUnavailable: true } as never,
      deps,
    );

    expect(decision).toMatchObject({ ok: false, status: 403, code: "turnstile_required" });
    expect(verifyToken).not.toHaveBeenCalled();
  });

  it.each(["network", "timeout", "bad-response"] as const)(
    "refuses with a retryable 503 when Cloudflare is unreachable (%s)",
    async (reason) => {
      const { deps, log } = setup({
        verifyToken: async (): Promise<TurnstileOutcome> => ({ status: "unavailable", reason }),
      });

      const decision = await guardChatRequest(
        { conversationId: ID, ip: IP, turnstileToken: "tok" },
        deps,
      );

      expect(decision).toMatchObject({ ok: false, status: 503, code: "turnstile_unavailable" });
      if (!decision.ok) expect(decision.message).toMatch(/reach me directly/i);
      expect(log).toHaveBeenCalledWith("warn", expect.stringContaining(reason));
    },
  );

  it("refuses, and logs an error, when Cloudflare rejects our secret", async () => {
    const { deps, log } = setup({
      verifyToken: async (): Promise<TurnstileOutcome> => ({ status: "unavailable", reason: "misconfigured" }),
    });

    const decision = await guardChatRequest(
      { conversationId: ID, ip: IP, turnstileToken: "tok" },
      deps,
    );

    expect(decision).toMatchObject({ ok: false, code: "turnstile_unavailable" });
    expect(log).toHaveBeenCalledWith("error", expect.stringContaining("TURNSTILE_SECRET_KEY"));
  });

  it("never records a pass for a refused message", async () => {
    const { deps } = setup({
      verifyToken: async (): Promise<TurnstileOutcome> => ({ status: "unavailable", reason: "network" }),
    });
    const decision = await guardChatRequest(
      { conversationId: ID, ip: IP, turnstileToken: "tok" },
      deps,
    );
    expect(decision.ok).toBe(false);
  });
});

describe("rate limits", () => {
  it("limits one conversation per minute and reports how long to wait", async () => {
    const { deps } = setup(
      { config: { enabled: false, reason: "missing-secret" } },
      { exists: true, turnstileState: null, contact: { email: null, phone: null } },
    );

    let last;
    for (let i = 0; i < 7; i++) {
      last = await guardChatRequest({ conversationId: ID, ip: IP }, deps);
    }

    expect(last).toMatchObject({ ok: false, status: 429, code: "rate_limited" });
    if (last && !last.ok) {
      expect(last.retryAfterSeconds).toBeGreaterThan(0);
      expect(last.message).toMatch(/wait about \d+ seconds/);
    }
  });

  it("limits one IP across many conversations", async () => {
    const { deps } = setup({ config: { enabled: false, reason: "missing-secret" } });
    const results = [];
    for (let i = 0; i < 11; i++) {
      const id = `3f2b8c1e-9d4a-4c7b-8e21-${String(i).padStart(12, "0")}`;
      results.push(await guardChatRequest({ conversationId: id, ip: IP }, deps));
    }
    // New conversations per IP per hour: 10.
    expect(results.slice(0, 10).every((r) => r.ok)).toBe(true);
    expect(results[10]).toMatchObject({ ok: false, status: 429 });
  });

  it("does not let different IPs share a budget", async () => {
    const { deps } = setup(
      { config: { enabled: false, reason: "missing-secret" } },
      { exists: true, turnstileState: null, contact: { email: null, phone: null } },
    );
    for (let i = 0; i < 7; i++) {
      await guardChatRequest({ conversationId: ID, ip: IP }, deps);
    }
    const other = await guardChatRequest(
      { conversationId: "00000000-0000-4000-8000-000000000001", ip: "198.51.100.7" },
      deps,
    );
    expect(other.ok).toBe(true);
  });

  it("treats UUIDs that differ only by letter case as the same conversation", async () => {
    const { deps } = setup(
      { config: { enabled: false, reason: "missing-secret" } },
      { exists: true, turnstileState: null, contact: { email: null, phone: null } },
    );
    let last;
    for (let i = 0; i < 7; i++) {
      last = await guardChatRequest(
        { conversationId: i % 2 ? ID.toUpperCase() : ID, ip: IP },
        deps,
      );
    }
    expect(last).toMatchObject({ ok: false, code: "rate_limited" });
  });

  it("checks limits before verifying a token, so floods never reach Cloudflare", async () => {
    const { deps, verifyToken } = setup(
      {},
      { exists: true, turnstileState: null, contact: { email: null, phone: null } },
    );
    for (let i = 0; i < 20; i++) {
      await guardChatRequest({ conversationId: ID, ip: IP, turnstileToken: "tok" }, deps);
    }
    expect(verifyToken.mock.calls.length).toBeLessThan(10);
  });

  it("hashes bucket keys: no raw IP or conversation id reaches the limiter", async () => {
    const hit = vi.fn<RateLimiter["hit"]>(async (checks) =>
      checks.map(() => ({ allowed: true, retryAfterSeconds: 1 })),
    );
    const { deps } = setup({ limiter: { hit }, config: { enabled: false, reason: "missing-secret" } });

    await guardChatRequest({ conversationId: ID, ip: IP }, deps);

    const keys = hit.mock.calls[0][0].map((c) => c.key).join(" ");
    expect(keys).not.toContain(IP);
    expect(keys).not.toContain(ID);
    expect(hit.mock.calls[0][0].every((c) => c.key.length <= 128)).toBe(true);
  });

  it("counts a brand-new conversation separately from an existing one", async () => {
    const hit = vi.fn<RateLimiter["hit"]>(async (checks) =>
      checks.map(() => ({ allowed: true, retryAfterSeconds: 1 })),
    );
    const config = { enabled: false, reason: "missing-secret" } as const;

    await guardChatRequest({ conversationId: ID, ip: IP }, setup({ limiter: { hit }, config }).deps);
    await guardChatRequest(
      { conversationId: ID, ip: IP },
      setup(
        { limiter: { hit }, config },
        { exists: true, turnstileState: null, contact: { email: null, phone: null } },
      ).deps,
    );

    expect(hit.mock.calls[0][0]).toHaveLength(5);
    expect(hit.mock.calls[1][0]).toHaveLength(4);
  });
});
