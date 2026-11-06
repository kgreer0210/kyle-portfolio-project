import { beforeEach, describe, expect, it, vi } from "vitest";

interface Call {
  table: string;
  op: "upsert" | "update";
  payload: Record<string, unknown>;
}

const calls: Call[] = [];
let stateRow: Record<string, unknown> | null = null;
type DbError = { code: string; message: string; details: string } | null;
let stateError: DbError = null;
let upsertError: DbError = null;
let updateError: DbError = null;
let insertError: DbError = null;
let messagesError: DbError = null;

function table(name: string) {
  return {
    upsert: (payload: Record<string, unknown>) => {
      calls.push({ table: name, op: "upsert", payload });
      return Promise.resolve({ error: upsertError });
    },
    update: (payload: Record<string, unknown>) => {
      calls.push({ table: name, op: "update", payload });
      return { eq: () => Promise.resolve({ error: updateError }) };
    },
    insert: () => Promise.resolve({ error: insertError }),
    select: () => ({
      eq: () => ({
        maybeSingle: () => Promise.resolve({ data: stateRow, error: stateError }),
        order: () => Promise.resolve({ data: [], error: messagesError }),
      }),
    }),
  };
}

vi.mock("@/lib/supabase", () => ({
  createAdminSupabaseClient: () => ({ from: table }),
}));

import {
  appendMessage,
  buildConversationWrites,
  ChatStorageError,
  getConversationState,
  getConversationTranscript,
  upsertConversation,
  writeConversationAnalytics,
} from "@/lib/chatStorage";

const ID = "3f2b8c1e-9d4a-4c7b-8e21-5a6f7b8c9d0e";

beforeEach(() => {
  calls.length = 0;
  stateRow = null;
  stateError = null;
  upsertError = null;
  updateError = null;
  insertError = null;
  messagesError = null;
});

// An error shaped like PostgREST's, whose message and details echo the row.
function leakyError(): NonNullable<DbError> {
  return {
    code: "XX000",
    message: "failed for visitor jane@example.com +14787771266",
    details: "Failing row contains (jane@example.com, +14787771266)",
  };
}

describe("buildConversationWrites", () => {
  it("includes only values that are present", () => {
    expect(
      buildConversationWrites({
        visitorName: "Jane",
        visitorEmail: null,
        visitorPhone: "+14787771266",
        turnstileState: undefined,
      }),
    ).toEqual({ visitor_name: "Jane", visitor_phone: "+14787771266" });
  });
});

describe("upsertConversation", () => {
  it("persists email, phone, and the Turnstile pass on the conversation", async () => {
    await upsertConversation({
      conversationId: ID,
      visitorName: "Jane",
      visitorEmail: "jane@example.com",
      visitorPhone: "+14787771266",
      turnstileState: "verified",
    });

    const expected = {
      visitor_name: "Jane",
      visitor_email: "jane@example.com",
      visitor_phone: "+14787771266",
      turnstile_state: "verified",
    };
    expect(calls[0]).toMatchObject({ op: "upsert", payload: { id: ID, ...expected } });
    expect(calls[1]).toMatchObject({ op: "update", payload: expected });
  });

  it("never writes nulls over captured contact details", async () => {
    await upsertConversation({
      conversationId: ID,
      visitorEmail: null,
      visitorPhone: null,
    });

    expect(calls).toHaveLength(1);
    expect(calls[0].op).toBe("upsert");
    expect(calls[0].payload).toEqual({ id: ID });
  });
});

describe("writeConversationAnalytics", () => {
  it("writes the phone alongside the score fields", async () => {
    await writeConversationAnalytics(ID, {
      leadScore: 80,
      visitorPhone: "+14787771266",
    });

    expect(calls[0].payload).toEqual({
      lead_score: 80,
      visitor_phone: "+14787771266",
    });
  });
});

describe("getConversationState", () => {
  it("reports a missing conversation as new", async () => {
    stateRow = null;
    expect(await getConversationState(ID)).toEqual({
      exists: false,
      turnstileState: null,
      contact: { email: null, phone: null },
    });
  });

  it("reads the server-side gate pass and captured contact", async () => {
    stateRow = {
      turnstile_state: "verified",
      visitor_email: "jane@example.com",
      visitor_phone: "+14787771266",
    };
    expect(await getConversationState(ID)).toEqual({
      exists: true,
      turnstileState: "verified",
      contact: { email: "jane@example.com", phone: "+14787771266" },
    });
  });

  it("ignores an unexpected turnstile_state value", async () => {
    stateRow = { turnstile_state: "yes please" };
    expect((await getConversationState(ID)).turnstileState).toBeNull();
  });

  it("throws on a read failure instead of reporting empty contact", async () => {
    stateError = leakyError();
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(getConversationState(ID)).rejects.toBeInstanceOf(ChatStorageError);

    // Logged by operation and code only, never the message or row details.
    const logged = JSON.stringify(errorSpy.mock.calls);
    expect(errorSpy).toHaveBeenCalled();
    expect(logged).toContain("XX000");
    expect(logged).not.toContain("jane@example.com");
    expect(logged).not.toContain("777-1266");
    expect(logged).not.toContain("14787771266");
    errorSpy.mockRestore();
  });
});

describe("write failures are surfaced, not swallowed", () => {
  const input = {
    conversationId: ID,
    visitorEmail: "jane@example.com",
    visitorPhone: "+14787771266",
    turnstileState: "verified" as const,
  };

  it("throws when the insert fails", async () => {
    upsertError = leakyError();
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const failure = await upsertConversation(input).catch((e) => e);

    expect(failure).toBeInstanceOf(ChatStorageError);
    expect(failure.operation).toBe("write");
    expect(failure.message).not.toMatch(/jane|777|1266/);
    expect(JSON.stringify(errorSpy.mock.calls)).not.toMatch(/jane@|1266/);
    errorSpy.mockRestore();
  });

  it("throws when the metadata update fails", async () => {
    updateError = leakyError();
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(upsertConversation(input)).rejects.toBeInstanceOf(ChatStorageError);
  });

  it("throws when a message cannot be appended", async () => {
    insertError = leakyError();
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(appendMessage(ID, "user", "hello")).rejects.toBeInstanceOf(
      ChatStorageError,
    );
  });

  it("throws when the transcript cannot be read, rather than returning an empty one", async () => {
    messagesError = leakyError();
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(getConversationTranscript(ID)).rejects.toBeInstanceOf(
      ChatStorageError,
    );
  });
});
