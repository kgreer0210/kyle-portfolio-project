/**
 * Decide what the daily job should do. Pure so the timing rules are tested
 * without a database; the cron route executes the returned plan.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

export const dailyRules = {
  /** Nudge a client this many days after a ticket starts waiting on them. */
  nudgeAfterDays: 3,
  /** Auto-resolve a ticket still waiting after this many days. */
  resolveAfterDays: 10,
  /** Minimum days between reminders for the same overdue request. */
  remindEveryDays: 3,
  /** Delete pending SOW uploads that were never used after this long. */
  pendingSowMaxAgeDays: 1,
} as const;

export interface WaitingTicket {
  id: string;
  organization_id: string;
  title: string;
  status: string;
  waiting_since: string | null;
  nudged_at: string | null;
}

export interface OpenRequest {
  id: string;
  organization_id: string;
  project_id: string;
  title: string;
  status: string;
  due_date: string | null;
  last_reminded_at: string | null;
}

export interface PendingSowFile {
  path: string;
  created_at: string | null;
}

export interface DailyPlan {
  nudge: WaitingTicket[];
  resolve: WaitingTicket[];
  /** Overdue requests to remind, grouped by organization for one email each. */
  remind: Map<string, OpenRequest[]>;
  deleteSowFiles: string[];
}

function daysBetween(from: string, now: Date): number {
  return (now.getTime() - new Date(from).getTime()) / DAY_MS;
}

export function planDailyActions(args: {
  now: Date;
  tickets: WaitingTicket[];
  requests: OpenRequest[];
  pendingSowFiles: PendingSowFile[];
  /** SOW paths referenced by project_sow, which must never be deleted. */
  referencedSowPaths: Set<string>;
}): DailyPlan {
  const { now } = args;
  const today = now.toISOString().slice(0, 10);
  const plan: DailyPlan = { nudge: [], resolve: [], remind: new Map(), deleteSowFiles: [] };

  for (const ticket of args.tickets) {
    if (ticket.status !== "waiting_on_client" || !ticket.waiting_since) {
      continue;
    }

    const waitingDays = daysBetween(ticket.waiting_since, now);

    if (waitingDays >= dailyRules.resolveAfterDays) {
      plan.resolve.push(ticket);
      continue;
    }

    // One nudge per waiting period: a nudge older than waiting_since belongs
    // to an earlier period and doesn't count.
    const alreadyNudged =
      !!ticket.nudged_at &&
      new Date(ticket.nudged_at).getTime() >= new Date(ticket.waiting_since).getTime();

    if (waitingDays >= dailyRules.nudgeAfterDays && !alreadyNudged) {
      plan.nudge.push(ticket);
    }
  }

  for (const request of args.requests) {
    if (request.status === "done" || !request.due_date || request.due_date >= today) {
      continue;
    }
    if (
      request.last_reminded_at &&
      daysBetween(request.last_reminded_at, now) < dailyRules.remindEveryDays
    ) {
      continue;
    }
    const list = plan.remind.get(request.organization_id) ?? [];
    list.push(request);
    plan.remind.set(request.organization_id, list);
  }

  for (const file of args.pendingSowFiles) {
    if (!file.path.startsWith("pending/") || args.referencedSowPaths.has(file.path)) {
      continue;
    }
    if (file.created_at && daysBetween(file.created_at, now) >= dailyRules.pendingSowMaxAgeDays) {
      plan.deleteSowFiles.push(file.path);
    }
  }

  return plan;
}

/** Constant-time bearer check for the cron secret. */
export function isAuthorizedCron(authorization: string | null, secret: string | undefined) {
  if (!secret || !authorization) {
    return false;
  }
  const expected = `Bearer ${secret}`;
  if (authorization.length !== expected.length) {
    return false;
  }
  let mismatch = 0;
  for (let index = 0; index < expected.length; index += 1) {
    mismatch |= authorization.charCodeAt(index) ^ expected.charCodeAt(index);
  }
  return mismatch === 0;
}
