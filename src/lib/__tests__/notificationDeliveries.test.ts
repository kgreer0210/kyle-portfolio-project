import { describe, expect, it } from "vitest";
import {
  requestReminderPeriodKey,
  waitingNudgePeriodKey,
} from "@/lib/notificationDeliveries";
import type { OpenRequest, WaitingTicket } from "@/lib/dailyActions";

describe("notification delivery periods", () => {
  it("keys a nudge to the current waiting period", () => {
    const ticket = {
      id: "ticket-1",
      organization_id: "org-1",
      title: "Need approval",
      status: "waiting_on_client",
      waiting_since: "2026-09-18T12:00:00.000Z",
      nudged_at: null,
    } satisfies WaitingTicket;

    expect(waitingNudgePeriodKey(ticket)).toBe(ticket.waiting_since);
  });

  it("produces the same reminder period regardless of query order", () => {
    const items = [
      {
        id: "request-b",
        organization_id: "org-1",
        project_id: "project-1",
        title: "Copy",
        status: "open",
        due_date: "2026-09-18",
        last_reminded_at: null,
      },
      {
        id: "request-a",
        organization_id: "org-1",
        project_id: "project-1",
        title: "Logo",
        status: "open",
        due_date: "2026-09-17",
        last_reminded_at: "2026-09-14T12:00:00.000Z",
      },
    ] satisfies OpenRequest[];

    expect(requestReminderPeriodKey(items)).toBe(
      requestReminderPeriodKey([...items].reverse()),
    );
  });

  it("starts a new reminder period after delivery state advances", () => {
    const item = {
      id: "request-a",
      organization_id: "org-1",
      project_id: "project-1",
      title: "Logo",
      status: "open",
      due_date: "2026-09-17",
      last_reminded_at: null,
    } satisfies OpenRequest;

    expect(requestReminderPeriodKey([item])).not.toBe(
      requestReminderPeriodKey([
        { ...item, last_reminded_at: "2026-09-21T12:00:00.000Z" },
      ]),
    );
  });
});
