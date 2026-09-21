import { describe, expect, it, vi } from "vitest";
import {
  claimNotificationDelivery,
  markNotificationDeliveryFailed,
  markNotificationDeliverySent,
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

describe("notification delivery claim fencing", () => {
  it("carries the attempt token off the claim", async () => {
    const single = vi.fn().mockResolvedValue({
      data: {
        delivery_id: "delivery-1",
        claimed: true,
        already_sent: false,
        attempt: 2,
      },
      error: null,
    });
    const rpc = vi.fn().mockReturnValue({ single });
    const supabase = { rpc } as unknown as Parameters<
      typeof claimNotificationDelivery
    >[0];

    const claim = await claimNotificationDelivery(supabase, {
      kind: "waiting_ticket_nudge",
      resourceId: "ticket-1",
      periodKey: "2026-09-18T12:00:00.000Z",
      now: "2026-09-21T12:00:00.000Z",
    });

    expect(claim).toEqual({
      deliveryId: "delivery-1",
      claimed: true,
      alreadySent: false,
      attempt: 2,
    });
  });

  it("sends the attempt token with both completions", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: true, error: null });
    const supabase = { rpc } as unknown as Parameters<
      typeof markNotificationDeliverySent
    >[0];
    const claim = {
      deliveryId: "delivery-1",
      claimed: true,
      alreadySent: false,
      attempt: 3,
    };

    await expect(
      markNotificationDeliverySent(supabase, claim, "2026-09-21T12:00:00.000Z"),
    ).resolves.toBe(true);
    expect(rpc).toHaveBeenCalledWith("mark_notification_delivery_sent", {
      p_delivery_id: "delivery-1",
      p_attempt: 3,
      p_now: "2026-09-21T12:00:00.000Z",
    });

    await expect(
      markNotificationDeliveryFailed(
        supabase,
        claim,
        "provider rejected",
        "2026-09-21T12:00:00.000Z",
      ),
    ).resolves.toBe(true);
    expect(rpc).toHaveBeenCalledWith("mark_notification_delivery_failed", {
      p_delivery_id: "delivery-1",
      p_attempt: 3,
      p_error: "provider rejected",
      p_now: "2026-09-21T12:00:00.000Z",
    });
  });

  it("reports a lost claim when the fenced update matches no row", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: false, error: null });
    const supabase = { rpc } as unknown as Parameters<
      typeof markNotificationDeliverySent
    >[0];

    await expect(
      markNotificationDeliverySent(
        supabase,
        {
          deliveryId: "delivery-1",
          claimed: true,
          alreadySent: false,
          attempt: 1,
        },
        "2026-09-21T12:00:00.000Z",
      ),
    ).resolves.toBe(false);
  });
});
