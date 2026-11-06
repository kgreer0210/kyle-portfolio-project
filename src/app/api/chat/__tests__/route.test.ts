import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ConversationState } from "@/lib/chatGuard";

const streamText = vi.hoisted(() =>
  vi.fn<(options: { system: string }) => { toTextStreamResponse: () => Response }>(
    () => ({
      toTextStreamResponse: () => new Response("Hello from the assistant"),
    }),
  ),
);
const storage = vi.hoisted(() => ({
  getConversationState: vi.fn<(id: string) => Promise<ConversationState>>(),
  upsertConversation: vi.fn(async () => undefined),
  appendMessage: vi.fn(async () => undefined),
}));

vi.mock("ai", () => ({ streamText }));
vi.mock("@openrouter/ai-sdk-provider", () => ({
  createOpenRouter: () => ({ chat: () => "mock-model" }),
}));
vi.mock("@/lib/chatStorage", () => storage);
vi.mock("@/lib/supabase", () => ({ createAdminSupabaseClient: vi.fn() }));

import { POST } from "@/app/api/chat/route";

let ipCounter = 0;
function uuid(n: number) {
  return `3f2b8c1e-9d4a-4c7b-8e21-${String(n).padStart(12, "0")}`;
}

function chatRequest(body: unknown, ip = `203.0.113.${(ipCounter += 1)}`) {
  return new NextRequest("http://localhost/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json", "x-real-ip": ip },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function firstMessage(content: string, extra: Record<string, unknown> = {}) {
  return {
    conversationId: uuid(1000 + ipCounter),
    messages: [{ role: "user", content }],
    ...extra,
  };
}

const newConversation: ConversationState = {
  exists: false,
  turnstileState: null,
  contact: { email: null, phone: null },
};

beforeEach(() => {
  vi.stubEnv("OPENROUTER_API_KEY", "test-key");
  vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "");
  vi.stubEnv("TURNSTILE_SECRET_KEY", "");
  vi.stubEnv("TURNSTILE_ALLOWED_HOSTNAMES", "");
  vi.stubEnv("RATE_LIMIT_SECRET", "");
  storage.getConversationState.mockResolvedValue(newConversation);
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

function enableTurnstile() {
  vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "site-key");
  vi.stubEnv("TURNSTILE_SECRET_KEY", "secret-key");
  vi.stubEnv("TURNSTILE_ALLOWED_HOSTNAMES", "kygrsolutions.com");
}

function stubSiteverify(response: Response | Error) {
  const fetchMock = vi.fn(async () => {
    if (response instanceof Error) throw response;
    return response;
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("POST /api/chat input handling", () => {
  it("rejects malformed JSON and invalid conversation ids without storing anything", async () => {
    expect((await POST(chatRequest("{nope"))).status).toBe(400);

    const response = await POST(chatRequest({ ...firstMessage("hi"), conversationId: "not-a-uuid" }));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ code: "invalid_request" });
    expect(storage.upsertConversation).not.toHaveBeenCalled();
    expect(streamText).not.toHaveBeenCalled();
  });

  it("rejects oversized message arrays before doing any work", async () => {
    const messages = Array.from({ length: 101 }, () => ({ role: "user", content: "hi" }));
    const response = await POST(chatRequest({ conversationId: uuid(5), messages }));
    expect(response.status).toBe(400);
    expect(storage.getConversationState).not.toHaveBeenCalled();
  });

  it("requires the last message to be a non-empty user message", async () => {
    const response = await POST(
      chatRequest({
        conversationId: uuid(1),
        messages: [{ role: "assistant", content: "hello" }],
      }),
    );
    expect(response.status).toBe(400);
  });
});

describe("POST /api/chat with Turnstile configured", () => {
  it("answers 403 as JSON, and stores nothing, when the first message has no token", async () => {
    enableTurnstile();

    const response = await POST(chatRequest(firstMessage("Hello there")));

    expect(response.status).toBe(403);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(await response.json()).toMatchObject({ code: "turnstile_required" });
    expect(storage.upsertConversation).not.toHaveBeenCalled();
    expect(storage.appendMessage).not.toHaveBeenCalled();
    expect(streamText).not.toHaveBeenCalled();
  });

  it("verifies the token with Cloudflare, then streams and records the pass", async () => {
    enableTurnstile();
    const siteverify = stubSiteverify(
      Response.json({ success: true, action: "chat", hostname: "kygrsolutions.com" }),
    );

    const response = await POST(chatRequest(firstMessage("Hello there", { turnstileToken: "good" })));

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("Hello from the assistant");
    expect(siteverify).toHaveBeenCalledTimes(1);
    expect(storage.upsertConversation).toHaveBeenCalledWith(
      expect.objectContaining({ turnstileState: "verified" }),
    );
    expect(storage.appendMessage).toHaveBeenCalledWith(expect.any(String), "user", "Hello there");
  });

  it("rejects a token Cloudflare says was already used", async () => {
    enableTurnstile();
    stubSiteverify(Response.json({ success: false, "error-codes": ["timeout-or-duplicate"] }));

    const response = await POST(chatRequest(firstMessage("Hello there", { turnstileToken: "replayed" })));

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ code: "turnstile_failed" });
    expect(storage.appendMessage).not.toHaveBeenCalled();
  });

  it("does not ask again once the conversation is verified server-side", async () => {
    enableTurnstile();
    const siteverify = stubSiteverify(new Error("must not be called"));
    storage.getConversationState.mockResolvedValue({
      exists: true,
      turnstileState: "verified",
      contact: { email: null, phone: null },
    });

    const response = await POST(chatRequest(firstMessage("Second message")));

    expect(response.status).toBe(200);
    expect(siteverify).not.toHaveBeenCalled();
    expect(storage.upsertConversation).toHaveBeenCalledWith(
      expect.objectContaining({ turnstileState: null }),
    );
  });

  it("refuses with 503 JSON, and stores nothing, when Cloudflare is down", async () => {
    enableTurnstile();
    stubSiteverify(new TypeError("fetch failed"));

    const response = await POST(chatRequest(firstMessage("Hello there", { turnstileToken: "tok" })));

    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ code: "turnstile_unavailable" });
    expect(storage.upsertConversation).not.toHaveBeenCalled();
    expect(storage.appendMessage).not.toHaveBeenCalled();
    expect(streamText).not.toHaveBeenCalled();
  });

  it("does not let a client skip verification by claiming the script is unavailable", async () => {
    enableTurnstile();

    const response = await POST(
      chatRequest(firstMessage("Hello there", { turnstileUnavailable: true })),
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ code: "turnstile_required" });
    expect(storage.appendMessage).not.toHaveBeenCalled();
  });
});

describe("POST /api/chat without Turnstile keys", () => {
  it("serves the visitor and logs a diagnostic instead of an error", async () => {
    const response = await POST(chatRequest(firstMessage("Hello there")));

    expect(response.status).toBe(200);
    expect(storage.appendMessage).toHaveBeenCalled();
  });
});

describe("POST /api/chat rate limiting", () => {
  it("answers 429 as JSON with Retry-After, and stores nothing for the refused turn", async () => {
    // Fixed windows align to the epoch minute; pin the clock mid-window.
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-06T12:00:10.000Z"));
    const ip = "198.51.100.77";
    const conversationId = uuid(4242);
    storage.getConversationState.mockResolvedValue({ ...newConversation, exists: true });
    const send = () =>
      POST(chatRequest({ conversationId, messages: [{ role: "user", content: "Hello there" }] }, ip));

    const statuses: number[] = [];
    let last: Response | undefined;
    for (let i = 0; i < 7; i++) {
      last = await send();
      statuses.push(last.status);
    }

    expect(statuses).toEqual([200, 200, 200, 200, 200, 200, 429]);
    expect(last?.headers.get("content-type")).toContain("application/json");
    expect(Number(last?.headers.get("retry-after"))).toBeGreaterThan(0);
    expect(await last?.json()).toMatchObject({ code: "rate_limited" });
    expect(streamText).toHaveBeenCalledTimes(6);
    expect(storage.appendMessage).toHaveBeenCalledTimes(6);
  });
});

describe("POST /api/chat contact capture", () => {
  function promptOfLastCall() {
    return streamText.mock.calls[streamText.mock.calls.length - 1][0].system;
  }

  it("stores a phone number on the very message that contains it", async () => {
    await POST(chatRequest(firstMessage("You can call me at (404) 555-0199")));

    expect(storage.upsertConversation).toHaveBeenCalledWith(
      expect.objectContaining({ visitorPhone: "+14045550199", visitorEmail: null }),
    );
  });

  it("stores an email from the message and keeps it out of the prompt", async () => {
    await POST(chatRequest(firstMessage("It's jane@example.com, thanks")));

    expect(storage.upsertConversation).toHaveBeenCalledWith(
      expect.objectContaining({ visitorEmail: "jane@example.com" }),
    );
    expect(promptOfLastCall()).not.toContain("jane@example.com");
    expect(promptOfLastCall()).toMatch(/Contact details on file: email\./);
  });

  it("does not replace a captured number with a later unrelated one", async () => {
    storage.getConversationState.mockResolvedValue({
      exists: true,
      turnstileState: "verified",
      contact: { email: null, phone: "+14787771266" },
    });

    await POST(chatRequest(firstMessage("my cousin's cell is 404-555-0199")));

    expect(storage.upsertConversation).toHaveBeenCalledWith(
      expect.objectContaining({ visitorPhone: "+14787771266" }),
    );
  });

  it("keeps an email captured earlier when a later turn carries none", async () => {
    storage.getConversationState.mockResolvedValue({
      exists: true,
      turnstileState: "verified",
      contact: { email: "jane@example.com", phone: null },
    });

    await POST(chatRequest(firstMessage("What does the process look like?")));

    expect(storage.upsertConversation).toHaveBeenCalledWith(
      expect.objectContaining({ visitorEmail: "jane@example.com" }),
    );
  });

  it("only permits the ask after a substantive exchange", async () => {
    await POST(chatRequest(firstMessage("hi")));
    expect(promptOfLastCall()).not.toContain("ASK NOW");

    await POST(
      chatRequest({
        conversationId: uuid(77),
        messages: [
          { role: "user", content: "I run a small bakery and our online ordering is a mess" },
          { role: "assistant", content: "That sounds frustrating. Tell me more." },
          { role: "user", content: "Customers email orders and I copy them into a spreadsheet" },
        ],
      }),
    );
    expect(promptOfLastCall()).toContain("ASK NOW");
  });

  it("does not ask a second time", async () => {
    await POST(
      chatRequest({
        conversationId: uuid(78),
        messages: [
          { role: "user", content: "I run a small bakery and our online ordering is a mess" },
          {
            role: "assistant",
            content: "Tell me more. What's the best email or phone number to reach you?",
          },
          { role: "user", content: "Customers email orders and I copy them into a spreadsheet" },
        ],
      }),
    );
    expect(promptOfLastCall()).not.toContain("ASK NOW");
  });
});
