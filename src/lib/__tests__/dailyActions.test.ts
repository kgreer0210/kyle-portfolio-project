import { describe, expect, it } from "vitest";
import {
  isAuthorizedCron,
  planDailyActions,
  type OpenRequest,
  type WaitingTicket,
} from "@/lib/dailyActions";

const now = new Date("2026-09-14T14:00:00Z");
const daysAgo = (days: number) => new Date(now.getTime() - days * 86_400_000).toISOString();

function ticket(overrides: Partial<WaitingTicket>): WaitingTicket {
  return {
    id: crypto.randomUUID(),
    organization_id: "org-1",
    title: "Ticket",
    status: "waiting_on_client",
    waiting_since: daysAgo(0),
    nudged_at: null,
    ...overrides,
  };
}

function request(overrides: Partial<OpenRequest>): OpenRequest {
  return {
    id: crypto.randomUUID(),
    organization_id: "org-1",
    project_id: "p-1",
    title: "Logo",
    status: "open",
    due_date: "2026-09-10",
    last_reminded_at: null,
    ...overrides,
  };
}

function plan(args: Partial<Parameters<typeof planDailyActions>[0]>) {
  return planDailyActions({
    now,
    tickets: [],
    requests: [],
    pendingSowFiles: [],
    referencedSowPaths: new Set(),
    ...args,
  });
}

describe("waiting tickets", () => {
  it("does nothing before three days", () => {
    const result = plan({ tickets: [ticket({ waiting_since: daysAgo(2.9) })] });
    expect(result.nudge).toHaveLength(0);
    expect(result.resolve).toHaveLength(0);
  });

  it("nudges once at three days", () => {
    const due = ticket({ waiting_since: daysAgo(3) });
    expect(plan({ tickets: [due] }).nudge).toEqual([due]);

    const alreadyNudged = ticket({ waiting_since: daysAgo(5), nudged_at: daysAgo(2) });
    expect(plan({ tickets: [alreadyNudged] }).nudge).toHaveLength(0);
  });

  it("nudges again when a nudge belongs to an earlier waiting period", () => {
    const rewaiting = ticket({ waiting_since: daysAgo(4), nudged_at: daysAgo(8) });
    expect(plan({ tickets: [rewaiting] }).nudge).toHaveLength(1);
  });

  it("resolves at ten days instead of nudging", () => {
    const stale = ticket({ waiting_since: daysAgo(10), nudged_at: null });
    const result = plan({ tickets: [stale] });
    expect(result.resolve).toEqual([stale]);
    expect(result.nudge).toHaveLength(0);
  });

  it("ignores tickets that aren't waiting or have no clock", () => {
    const result = plan({
      tickets: [
        ticket({ status: "open", waiting_since: daysAgo(20) }),
        ticket({ waiting_since: null }),
      ],
    });
    expect(result.nudge).toHaveLength(0);
    expect(result.resolve).toHaveLength(0);
  });
});

describe("request reminders", () => {
  it("reminds overdue open and later items, grouped by organization", () => {
    const result = plan({
      requests: [
        request({ id: "a" }),
        request({ id: "b", status: "later" }),
        request({ id: "c", organization_id: "org-2" }),
      ],
    });
    expect(result.remind.get("org-1")?.map((r) => r.id)).toEqual(["a", "b"]);
    expect(result.remind.get("org-2")?.map((r) => r.id)).toEqual(["c"]);
  });

  it("skips done, undated, not-yet-due, and recently reminded items", () => {
    const result = plan({
      requests: [
        request({ status: "done" }),
        request({ due_date: null }),
        request({ due_date: "2026-09-14" }),
        request({ last_reminded_at: daysAgo(2) }),
      ],
    });
    expect(result.remind.size).toBe(0);
  });

  it("reminds again after three days", () => {
    expect(plan({ requests: [request({ last_reminded_at: daysAgo(3) })] }).remind.size).toBe(1);
  });
});

describe("pending SOW cleanup", () => {
  it("deletes old unreferenced pending files only", () => {
    const result = plan({
      pendingSowFiles: [
        { path: "pending/a/old.pdf", created_at: daysAgo(2) },
        { path: "pending/b/fresh.pdf", created_at: daysAgo(0.5) },
        { path: "pending/c/used.pdf", created_at: daysAgo(5) },
        { path: "org/proj/final.pdf", created_at: daysAgo(30) },
        { path: "pending/d/unknown.pdf", created_at: null },
      ],
      referencedSowPaths: new Set(["pending/c/used.pdf"]),
    });
    expect(result.deleteSowFiles).toEqual(["pending/a/old.pdf"]);
  });
});

describe("isAuthorizedCron", () => {
  it("requires an exact bearer match and a configured secret", () => {
    expect(isAuthorizedCron("Bearer s3cret", "s3cret")).toBe(true);
    expect(isAuthorizedCron("Bearer wrong!", "s3cret")).toBe(false);
    expect(isAuthorizedCron("s3cret", "s3cret")).toBe(false);
    expect(isAuthorizedCron(null, "s3cret")).toBe(false);
    expect(isAuthorizedCron("Bearer ", undefined)).toBe(false);
    expect(isAuthorizedCron("Bearer undefined", undefined)).toBe(false);
  });
});
