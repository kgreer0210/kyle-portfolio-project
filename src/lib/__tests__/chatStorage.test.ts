import { beforeEach, describe, expect, it, vi } from "vitest";

interface Call {
  table: string;
  op: "upsert" | "update";
  payload: Record<string, unknown>;
}

const calls: Call[] = [];
let stateRow: Record<string, unknown> | null = null;
let stateError: { message: string } | null = null;

function table(name: string) {
  return {
    upsert: (payload: Record<string, unknown>) => {
      calls.push({ table: name, op: "upsert", payload });
      return Promise.resolve({ error: null });
    },
    update: (payload: Record<string, unknown>) => {
      calls.push({ table: name, op: "update", payload });
      return { eq: () => Promise.resolve({ error: null }) };
    },
    select: () => ({
      eq: () => ({
        maybeSingle: () => Promise.resolve({ data: stateRow, error: stateError }),
      }),
    }),
  };
}

vi.mock("@/lib/supabase", () => ({
  createAdminSupabaseClient: () => ({ from: table }),
}));

import {
  buildConversationWrites,
  getConversationState,
  upsertConversation,
  writeConversationAnalytics,
} from "@/lib/chatStorage";

const ID = "3f2b8c1e-9d4a-4c7b-8e21-5a6f7b8c9d0e";

beforeEach(() => {
  calls.length = 0;
  stateRow = null;
  stateError = null;
});

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

  it("does not make a read failure look like a brand-new conversation", async () => {
    stateError = { message: "connection reset" };
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const state = await getConversationState(ID);

    expect(state.exists).toBe(true);
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
