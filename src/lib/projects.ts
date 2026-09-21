import type {
  ProjectMilestone,
  ProjectRequest,
  ProjectRequestKind,
  ProjectRequestStatus,
  ProjectStatus,
  ProjectTask,
} from "@/types/crm";

export const projectStatuses: ProjectStatus[] = ["active", "paused", "done"];

export const projectStatusLabels: Record<ProjectStatus, string> = {
  active: "Active",
  paused: "Paused",
  done: "Done",
};

export const projectRequestKinds: ProjectRequestKind[] = [
  "material",
  "access",
  "decision",
  "info",
];

export const projectRequestKindLabels: Record<ProjectRequestKind, string> = {
  material: "Files or content",
  access: "Account access",
  decision: "Decision",
  info: "Information",
};

export const projectRequestStatusLabels: Record<ProjectRequestStatus, string> = {
  open: "Needed",
  later: "Sending later",
  done: "Done",
};

export function isProjectStatus(value: unknown): value is ProjectStatus {
  return (
    typeof value === "string" && (projectStatuses as string[]).includes(value)
  );
}

export function isProjectRequestKind(
  value: unknown,
): value is ProjectRequestKind {
  return (
    typeof value === "string" &&
    (projectRequestKinds as string[]).includes(value)
  );
}

export const projectSelectColumns =
  "id, organization_id, title, summary, status, start_date, target_date, contract_amount, deposit_percent, created_at, updated_at";
export const milestoneSelectColumns =
  "id, project_id, organization_id, title, description, position, due_date";
export const taskSelectColumns =
  "id, project_id, organization_id, milestone_id, title, position, client_visible, done_at";
export const requestSelectColumns =
  "id, project_id, organization_id, kind, title, instructions, status, client_note, due_date, last_reminded_at, ticket_id, position, updated_at";

export interface ProgressSummary {
  done: number;
  total: number;
  percent: number;
}

/**
 * Progress over client-visible tasks only, so hidden internal chores never
 * make the client's bar look stalled. Returns null when there is nothing to
 * measure.
 */
export function computeProgress(
  tasks: Pick<ProjectTask, "client_visible" | "done_at">[],
): ProgressSummary | null {
  const visible = tasks.filter((task) => task.client_visible);
  if (visible.length === 0) {
    return null;
  }

  const done = visible.filter((task) => task.done_at).length;
  return {
    done,
    total: visible.length,
    percent: Math.round((done / visible.length) * 100),
  };
}

export type MilestoneState = "done" | "current" | "upcoming";

export interface MilestoneWithTasks extends ProjectMilestone {
  tasks: ProjectTask[];
  state: MilestoneState;
}

function byPosition<T extends { position: number }>(a: T, b: T) {
  return a.position - b.position;
}

/**
 * Group tasks under their milestones in display order. A milestone is done
 * when it has tasks and all are done; the first milestone that isn't done is
 * "current". Tasks with no milestone are returned separately.
 */
export function groupMilestones(
  milestones: ProjectMilestone[],
  tasks: ProjectTask[],
): { milestones: MilestoneWithTasks[]; unassigned: ProjectTask[] } {
  const sortedTasks = [...tasks].sort(byPosition);
  const tasksByMilestone = new Map<string, ProjectTask[]>();
  const unassigned: ProjectTask[] = [];

  for (const task of sortedTasks) {
    if (!task.milestone_id) {
      unassigned.push(task);
      continue;
    }
    const list = tasksByMilestone.get(task.milestone_id) ?? [];
    list.push(task);
    tasksByMilestone.set(task.milestone_id, list);
  }

  let foundCurrent = false;
  const grouped = [...milestones].sort(byPosition).map((milestone) => {
    const milestoneTasks = tasksByMilestone.get(milestone.id) ?? [];
    const isDone =
      milestoneTasks.length > 0 && milestoneTasks.every((task) => task.done_at);

    let state: MilestoneState;
    if (isDone) {
      state = "done";
    } else if (!foundCurrent) {
      state = "current";
      foundCurrent = true;
    } else {
      state = "upcoming";
    }

    return { ...milestone, tasks: milestoneTasks, state };
  });

  return { milestones: grouped, unassigned };
}

/** Open requests first (overdue ones on top), then later, then done; ties keep admin order. */
export function sortRequests(
  requests: ProjectRequest[],
  today: string,
): ProjectRequest[] {
  const statusRank: Record<ProjectRequestStatus, number> = {
    open: 0,
    later: 1,
    done: 2,
  };

  return [...requests].sort((a, b) => {
    if (a.status !== b.status) {
      return statusRank[a.status] - statusRank[b.status];
    }
    const aOverdue = isRequestOverdue(a, today) ? 0 : 1;
    const bOverdue = isRequestOverdue(b, today) ? 0 : 1;
    if (aOverdue !== bOverdue) {
      return aOverdue - bOverdue;
    }
    return a.position - b.position;
  });
}

export function isRequestOverdue(
  request: Pick<ProjectRequest, "status" | "due_date">,
  today: string,
): boolean {
  return request.status !== "done" && !!request.due_date && request.due_date < today;
}

/** YYYY-MM-DD in UTC, matching Postgres `date` columns. */
export function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Client request actions
// ---------------------------------------------------------------------------

export type ClientRequestAction = "later" | "done" | "reopen" | "upload" | "help";

export const clientRequestActions: ClientRequestAction[] = [
  "later",
  "done",
  "reopen",
  "upload",
  "help",
];

export function isClientRequestAction(
  value: unknown,
): value is ClientRequestAction {
  return (
    typeof value === "string" &&
    (clientRequestActions as string[]).includes(value)
  );
}

/**
 * Status a request moves to after a client action. Uploading counts as
 * provided; asking for help leaves it open so it stays on the list until
 * the admin marks it done.
 */
export function nextRequestStatus(
  current: ProjectRequestStatus,
  action: ClientRequestAction,
): ProjectRequestStatus {
  switch (action) {
    case "later":
      return "later";
    case "done":
    case "upload":
      return "done";
    case "reopen":
      return "open";
    case "help":
      return current === "done" ? "open" : current;
  }
}

export function materialsTicketTitle(requestTitle: string): string {
  return `Materials: ${requestTitle}`.slice(0, 200);
}

/**
 * Active projects with no update sent in `days` days. A project younger than
 * that isn't stale yet even if it has never had an update.
 */
export function findStaleProjects<
  T extends { id: string; status: string; created_at: string },
>(
  projects: T[],
  lastUpdateByProject: Map<string, string>,
  now: Date,
  days = 7,
): T[] {
  const cutoff = now.getTime() - days * 24 * 60 * 60 * 1000;
  return projects.filter((project) => {
    if (project.status !== "active") return false;
    const lastTouch = lastUpdateByProject.get(project.id) ?? project.created_at;
    return new Date(lastTouch).getTime() < cutoff;
  });
}
