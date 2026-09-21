import { describe, expect, it } from "vitest";
import {
  computeProgress,
  groupMilestones,
  isClientRequestAction,
  isRequestOverdue,
  materialsTicketTitle,
  nextRequestStatus,
  sortRequests,
} from "@/lib/projects";
import type { ProjectMilestone, ProjectRequest, ProjectTask } from "@/types/crm";

function task(overrides: Partial<ProjectTask>): ProjectTask {
  return {
    id: crypto.randomUUID(),
    project_id: "p",
    organization_id: "o",
    milestone_id: null,
    title: "Task",
    position: 0,
    client_visible: true,
    done_at: null,
    ...overrides,
  };
}

function milestone(overrides: Partial<ProjectMilestone>): ProjectMilestone {
  return {
    id: crypto.randomUUID(),
    project_id: "p",
    organization_id: "o",
    title: "Milestone",
    description: null,
    position: 0,
    due_date: null,
    ...overrides,
  };
}

function request(overrides: Partial<ProjectRequest>): ProjectRequest {
  return {
    id: crypto.randomUUID(),
    project_id: "p",
    organization_id: "o",
    kind: "material",
    title: "Logo",
    instructions: null,
    status: "open",
    client_note: null,
    due_date: null,
    last_reminded_at: null,
    ticket_id: null,
    position: 0,
    updated_at: "2026-09-01T00:00:00Z",
    ...overrides,
  };
}

describe("computeProgress", () => {
  it("returns null when there are no visible tasks", () => {
    expect(computeProgress([])).toBeNull();
    expect(computeProgress([task({ client_visible: false })])).toBeNull();
  });

  it("ignores hidden tasks in both numerator and denominator", () => {
    const progress = computeProgress([
      task({ done_at: "2026-09-01T00:00:00Z" }),
      task({}),
      task({ client_visible: false, done_at: null }),
      task({ client_visible: false, done_at: "2026-09-01T00:00:00Z" }),
    ]);
    expect(progress).toEqual({ done: 1, total: 2, percent: 50 });
  });

  it("rounds to whole percent", () => {
    const progress = computeProgress([
      task({ done_at: "x" }),
      task({}),
      task({}),
    ]);
    expect(progress?.percent).toBe(33);
  });
});

describe("groupMilestones", () => {
  it("orders by position and marks done / current / upcoming", () => {
    const design = milestone({ title: "Design", position: 0 });
    const build = milestone({ title: "Build", position: 1 });
    const launch = milestone({ title: "Launch", position: 2 });
    const tasks = [
      task({ milestone_id: design.id, done_at: "x" }),
      task({ milestone_id: build.id, done_at: "x", position: 0 }),
      task({ milestone_id: build.id, position: 1 }),
      task({ title: "Loose" }),
    ];

    const { milestones, unassigned } = groupMilestones(
      [launch, design, build],
      tasks,
    );

    expect(milestones.map((m) => [m.title, m.state])).toEqual([
      ["Design", "done"],
      ["Build", "current"],
      ["Launch", "upcoming"],
    ]);
    expect(milestones[1].tasks).toHaveLength(2);
    expect(unassigned.map((t) => t.title)).toEqual(["Loose"]);
  });

  it("never treats an empty milestone as done", () => {
    const { milestones } = groupMilestones([milestone({})], []);
    expect(milestones[0].state).toBe("current");
  });
});

describe("requests", () => {
  const today = "2026-09-14";

  it("detects overdue only for unfinished items with a past due date", () => {
    expect(isRequestOverdue({ status: "open", due_date: "2026-09-13" }, today)).toBe(true);
    expect(isRequestOverdue({ status: "later", due_date: "2026-09-13" }, today)).toBe(true);
    expect(isRequestOverdue({ status: "done", due_date: "2026-09-13" }, today)).toBe(false);
    expect(isRequestOverdue({ status: "open", due_date: today }, today)).toBe(false);
    expect(isRequestOverdue({ status: "open", due_date: null }, today)).toBe(false);
  });

  it("sorts open (overdue first) before later before done", () => {
    const sorted = sortRequests(
      [
        request({ title: "done", status: "done" }),
        request({ title: "later", status: "later", position: 0 }),
        request({ title: "open", position: 0 }),
        request({ title: "overdue", position: 5, due_date: "2026-09-01" }),
      ],
      today,
    );
    expect(sorted.map((r) => r.title)).toEqual(["overdue", "open", "later", "done"]);
  });

  it("whitelists client actions", () => {
    expect(isClientRequestAction("upload")).toBe(true);
    expect(isClientRequestAction("delete")).toBe(false);
    expect(isClientRequestAction(undefined)).toBe(false);
  });

  it("maps client actions to statuses", () => {
    expect(nextRequestStatus("open", "later")).toBe("later");
    expect(nextRequestStatus("later", "upload")).toBe("done");
    expect(nextRequestStatus("open", "done")).toBe("done");
    expect(nextRequestStatus("done", "reopen")).toBe("open");
    expect(nextRequestStatus("later", "help")).toBe("later");
    expect(nextRequestStatus("done", "help")).toBe("open");
  });

  it("caps materials ticket titles at 200 characters", () => {
    expect(materialsTicketTitle("Logo")).toBe("Materials: Logo");
    expect(materialsTicketTitle("x".repeat(300))).toHaveLength(200);
  });
});
