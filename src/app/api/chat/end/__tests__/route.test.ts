import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  updates: [] as unknown[],
  failReads: false,
}));

vi.mock("@/lib/supabase", () => ({
  createAdminSupabaseClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: null,
            error: db.failReads ? { code: "08006", message: "jane@example.com" } : null,
          }),
          order: async () => ({ data: [], error: null }),
        }),
      }),
      update: (payload: unknown) => {
        db.updates.push(payload);
        return { eq: () => ({ eq: () => ({ is: () => ({ select: async () => ({ data: [], error: null }) }) }) }) };
      },
    }),
  }),
}));
vi.mock("@/lib/notifications", () => ({ sendChatDigestEmail: vi.fn() }));
vi.mock("@/lib/chatLeadScoring", () => ({ scoreChatTranscript: vi.fn() }));

import { POST } from "@/app/api/chat/end/route";

afterEach(() => {
  db.updates.length = 0;
  db.failReads = false;
  vi.restoreAllMocks();
});

function endRequest() {
  return new NextRequest("http://localhost/api/chat/end", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      conversationId: "3f2b8c1e-9d4a-4c7b-8e21-5a6f7b8c9d0e",
      visitorEmail: "jane@example.com",
    }),
  });
}

describe("POST /api/chat/end", () => {
  it("answers 503, not 404, and finalizes nothing when the conversation read fails", async () => {
    db.failReads = true;
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await POST(endRequest());

    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ code: "storage_unavailable" });
    // The conversation was not claimed or marked abandoned.
    expect(db.updates).toEqual([]);
    expect(JSON.stringify(errorSpy.mock.calls)).not.toContain("jane@example.com");
  });

  it("still answers 404 for a conversation that genuinely does not exist", async () => {
    const response = await POST(endRequest());
    expect(response.status).toBe(404);
  });
});
