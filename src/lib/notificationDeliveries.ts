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
  };

  return {
    deliveryId: row.delivery_id,
    claimed: row.claimed,
    alreadySent: row.already_sent,
  };
}

export async function markNotificationDeliverySent(
  supabase: SupabaseClient,
  deliveryId: string,
  now: string,
) {
  const { error } = await supabase.rpc("mark_notification_delivery_sent", {
    p_delivery_id: deliveryId,
    p_now: now,
  });
  if (error) throw error;
}

export async function markNotificationDeliveryFailed(
  supabase: SupabaseClient,
  deliveryId: string,
  reason: string,
  now: string,
) {
  const { error } = await supabase.rpc("mark_notification_delivery_failed", {
    p_delivery_id: deliveryId,
    p_error: reason,
    p_now: now,
  });
  if (error) throw error;
}
