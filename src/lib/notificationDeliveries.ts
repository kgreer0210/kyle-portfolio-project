import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { OpenRequest, WaitingTicket } from "@/lib/dailyActions";

export type NotificationDeliveryKind =
  | "waiting_ticket_nudge"
  | "project_request_reminder";

export interface NotificationDeliveryClaim {
  deliveryId: string;
  claimed: boolean;
  alreadySent: boolean;
  /**
   * Monotonic claim token for this attempt. A delivery can be reclaimed by a
   * later run, so completing one has to prove it still owns the claim.
   */
  attempt: number;
}

export function waitingNudgePeriodKey(ticket: WaitingTicket): string {
  if (!ticket.waiting_since) {
    throw new Error("A waiting-ticket nudge requires waiting_since");
  }
  return ticket.waiting_since;
}

export function requestReminderPeriodKey(items: OpenRequest[]): string {
  const reminderState = items
    .map((item) => `${item.id}:${item.last_reminded_at ?? "never"}`)
    .sort()
    .join("|");

  return createHash("sha256").update(reminderState).digest("hex");
}

export async function claimNotificationDelivery(
  supabase: SupabaseClient,
  args: {
    kind: NotificationDeliveryKind;
    resourceId: string;
    periodKey: string;
    now: string;
  },
): Promise<NotificationDeliveryClaim> {
  const { data, error } = await supabase
    .rpc("claim_notification_delivery", {
      p_kind: args.kind,
      p_resource_id: args.resourceId,
      p_period_key: args.periodKey,
      p_now: args.now,
    })
    .single();

  if (error) {
    throw error;
  }

  const row = data as {
    delivery_id: string;
    claimed: boolean;
    already_sent: boolean;
    attempt: number;
  };

  return {
    deliveryId: row.delivery_id,
    claimed: row.claimed,
    alreadySent: row.already_sent,
    attempt: row.attempt,
  };
}

/** Returns false when a newer claim has taken the delivery over. */
export async function markNotificationDeliverySent(
  supabase: SupabaseClient,
  claim: NotificationDeliveryClaim,
  now: string,
): Promise<boolean> {
  const { data, error } = await supabase.rpc("mark_notification_delivery_sent", {
    p_delivery_id: claim.deliveryId,
    p_attempt: claim.attempt,
    p_now: now,
  });
  if (error) throw error;
  return data === true;
}

/** Returns false when a newer claim has taken the delivery over. */
export async function markNotificationDeliveryFailed(
  supabase: SupabaseClient,
  claim: NotificationDeliveryClaim,
  reason: string,
  now: string,
): Promise<boolean> {
  const { data, error } = await supabase.rpc("mark_notification_delivery_failed", {
    p_delivery_id: claim.deliveryId,
    p_attempt: claim.attempt,
    p_error: reason,
    p_now: now,
  });
  if (error) throw error;
  return data === true;
}
