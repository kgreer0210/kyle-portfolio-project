import { describe, expect, it } from "vitest";
import { findStaleProjects } from "@/lib/projects";
import { buildProjectUpdatePrompt, selectUpdateActivity } from "@/lib/projectUpdateDraft";

describe("selectUpdateActivity", () => {
  const tasks = [
    { id: "1", client_visible: true, done_at: "2026-09-01T00:00:00Z" },
    { id: "2", client_visible: true, done_at: "2026-09-10T00:00:00Z" },
    { id: "3", client_visible: false, done_at: "2026-09-10T00:00:00Z" },
    { id: "4", client_visible: true, done_at: null },
    { id: "5", client_visible: false, done_at: null },
  ];

  it("returns visible tasks done since the last update and visible remaining", () => {
    const { completed, remaining } = selectUpdateActivity(tasks, "2026-09-05T00:00:00Z");
    expect(completed.map((t) => t.id)).toEqual(["2"]);
    expect(remaining.map((t) => t.id)).toEqual(["4"]);
  });

  it("includes everything done when there has been no update", () => {
    expect(selectUpdateActivity(tasks, null).completed.map((t) => t.id)).toEqual(["1", "2"]);
  });
});

describe("buildProjectUpdatePrompt", () => {
  it("covers first updates, empty periods, and client requests", () => {
    const prompt = buildProjectUpdatePrompt({
      clientName: "Jane Doe",
      projectTitle: "Site",
      sinceIso: null,
      progress: null,
      completedTasks: [],
      nextTasks: [{ title: "Pages", milestone: "Build" }],
      openRequests: [{ title: "Logo", dueDate: "2026-09-20", status: "later" }],
      ticketActivity: [],
      notes: "staging is live",
    });
    expect(prompt).toContain("the project so far (first update)");
    expect(prompt).toContain("- (nothing marked done)");
    expect(prompt).toContain("- Pages [Build]");
    expect(prompt).toContain("- Logo (due 2026-09-20) (client said they'll send later)");
    expect(prompt).toContain("Kyle's notes for this update: staging is live");
  });
});

describe("findStaleProjects", () => {
  const now = new Date("2026-09-14T00:00:00Z");
  const projects = [
    { id: "new", status: "active", created_at: "2026-09-10T00:00:00Z" },
    { id: "never", status: "active", created_at: "2026-08-01T00:00:00Z" },
    { id: "recent", status: "active", created_at: "2026-08-01T00:00:00Z" },
    { id: "old", status: "active", created_at: "2026-08-01T00:00:00Z" },
    { id: "paused", status: "paused", created_at: "2026-08-01T00:00:00Z" },
  ];
  const lastUpdates = new Map([
    ["recent", "2026-09-12T00:00:00Z"],
    ["old", "2026-09-01T00:00:00Z"],
  ]);

  it("flags active projects with no update in a week", () => {
    expect(findStaleProjects(projects, lastUpdates, now).map((p) => p.id)).toEqual([
      "never",
      "old",
    ]);
  });
});
