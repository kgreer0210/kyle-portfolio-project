import { describe, expect, it } from "vitest";
import { pickAutoProjectId, toProjectScope } from "@/lib/ticketProjects";
import {
  buildReplyDraftPrompt,
  REPLY_DRAFT_SYSTEM_PROMPT,
} from "@/lib/ticketReplyDraft";

describe("pickAutoProjectId", () => {
  it("returns null with no projects", () => {
    expect(pickAutoProjectId([])).toBeNull();
  });

  it("picks the only active project, ignoring paused and done", () => {
    expect(
      pickAutoProjectId([
        { id: "a", status: "done" },
        { id: "b", status: "active" },
        { id: "c", status: "paused" },
      ]),
    ).toBe("b");
  });

  it("leaves it unset when two projects are active", () => {
    expect(
      pickAutoProjectId([
        { id: "a", status: "active" },
        { id: "b", status: "active" },
      ]),
    ).toBeNull();
  });
});

describe("toProjectScope", () => {
  it("reads out-of-scope strings from the extraction and ignores junk", () => {
    expect(
      toProjectScope({
        project: { title: "Site", summary: null },
        milestones: [{ title: "Design" }],
        extraction: { out_of_scope: ["E-commerce", 42, null] },
      }),
    ).toEqual({
      title: "Site",
      summary: null,
      milestones: ["Design"],
      outOfScope: ["E-commerce"],
    });
    expect(
      toProjectScope({ project: { title: "Site", summary: null }, milestones: [], extraction: null })
        .outOfScope,
    ).toEqual([]);
  });
});

describe("buildReplyDraftPrompt", () => {
  const context = {
    organizationName: "Acme",
    clientName: "Jane",
    ticket: {
      title: "Form broken",
      description: "The contact form errors.",
      status: "open",
      outOfScope: false,
      costAmount: null,
    },
    messages: [
      { author: "client" as const, visibility: "public" as const, body: "Any update?", createdAt: "2026-09-10" },
      { author: "system" as const, visibility: "internal" as const, body: "AI TRIAGE ...", createdAt: "2026-09-10" },
      { author: "kyle" as const, visibility: "internal" as const, body: "SMTP creds expired", createdAt: "2026-09-11" },
    ],
    projectScope: null,
    instructions: null,
  };

  it("labels private notes so the model can use but not quote them", () => {
    const prompt = buildReplyDraftPrompt(context);
    expect(prompt).toContain("--- Client (2026-09-10)");
    expect(prompt).toContain("--- PRIVATE system/AI note");
    expect(prompt).toContain("--- PRIVATE note from Kyle");
    expect(prompt).toContain("Draft the next reply from Kyle to the client.");
    expect(REPLY_DRAFT_SYSTEM_PROMPT).toContain(
      "Never quote them, mention them, or reveal that an AI was involved.",
    );
  });

  it("passes Kyle's steer and the out-of-scope flag", () => {
    const prompt = buildReplyDraftPrompt({
      ...context,
      ticket: { ...context.ticket, outOfScope: true },
      instructions: "say I'll quote it this week",
    });
    expect(prompt).toContain("Flagged out of scope: yes");
    expect(prompt).toContain("Kyle's instructions for this reply: say I'll quote it this week");
  });

  it("keeps only the most recent 30 messages", () => {
    const many = Array.from({ length: 40 }, (_, i) => ({
      author: "client" as const,
      visibility: "public" as const,
      body: `message-${i}`,
      createdAt: "2026-09-01",
    }));
    const prompt = buildReplyDraftPrompt({ ...context, messages: many });
    expect(prompt).not.toContain("message-9\n");
    expect(prompt).toContain("message-10");
    expect(prompt).toContain("message-39");
  });
});
