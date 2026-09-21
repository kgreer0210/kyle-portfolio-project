import { NextRequest, NextResponse } from "next/server";
import {
  isAuthorizedCron,
  planDailyActions,
  type OpenRequest,
  type WaitingTicket,
} from "@/lib/dailyActions";
import {
  sendAutoResolvedEmail,
  sendRequestReminderEmail,
  sendWaitingNudgeEmail,
} from "@/lib/crm-notifications";
import { sowBucket } from "@/lib/sowStorage";
import { createAdminSupabaseClient } from "@/lib/supabase";
import {
  claimNotificationDelivery,
  markNotificationDeliveryFailed,
  markNotificationDeliverySent,
  requestReminderPeriodKey,
  waitingNudgePeriodKey,
} from "@/lib/notificationDeliveries";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Daily housekeeping, triggered by Vercel Cron (see vercel.json) or any
 * scheduler that sends `Authorization: Bearer $CRON_SECRET`.
 */
export async function GET(request: NextRequest) {
  if (!isAuthorizedCron(request.headers.get("authorization"), process.env.CRON_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminSupabaseClient();
  const now = new Date();

  const [
    { data: tickets, error: ticketsError },
    { data: requests, error: requestsError },
    { data: pendingDirs },
    { data: sowRows },
  ] = await Promise.all([
    supabase
      .from("tickets")
      .select("id, organization_id, title, status, waiting_since, nudged_at")
      .eq("status", "waiting_on_client"),
    supabase
      .from("project_requests")
      .select("id, organization_id, project_id, title, status, due_date, last_reminded_at, projects!inner(status)")
      .neq("status", "done")
      .not("due_date", "is", null)
      .eq("projects.status", "active"),
    supabase.storage.from(sowBucket).list("pending", { limit: 1000 }),
    supabase.from("project_sow").select("storage_path").like("storage_path", "pending/%"),
  ]);

  if (ticketsError || requestsError) {
    console.error("Daily job load error:", ticketsError || requestsError);
    return NextResponse.json({ error: "Load failed" }, { status: 500 });
  }

  // pending/<uuid>/<file>: list each upload folder to get file timestamps.
  const pendingFiles: Array<{ path: string; created_at: string | null }> = [];
  for (const dir of pendingDirs || []) {
    const { data: files } = await supabase.storage.from(sowBucket).list(`pending/${dir.name}`);
    for (const file of files || []) {
      pendingFiles.push({ path: `pending/${dir.name}/${file.name}`, created_at: file.created_at ?? null });
    }
  }

  const plan = planDailyActions({
    now,
    tickets: (tickets || []) as WaitingTicket[],
    requests: (requests || []) as unknown as OpenRequest[],
    pendingSowFiles: pendingFiles,
    referencedSowPaths: new Set(
      (sowRows || []).map((row) => (row as { storage_path: string }).storage_path),
    ),
  });

  const nowIso = now.toISOString();
  const summary = { nudged: 0, resolved: 0, reminded: 0, sowFilesDeleted: 0, errors: 0 };

  for (const ticket of plan.nudge) {
    const delivery = await claimNotificationDelivery(supabase, {
      kind: "waiting_ticket_nudge",
      resourceId: ticket.id,
      periodKey: waitingNudgePeriodKey(ticket),
      now: nowIso,
    }).catch((claimError) => {
      console.error("Nudge delivery claim error:", claimError);
      return null;
    });
    if (!delivery) {
      summary.errors += 1;
      continue;
    }
    if (!delivery.claimed && !delivery.alreadySent) continue;

    if (delivery.claimed) {
      const sent = await sendWaitingNudgeEmail({
        organizationId: ticket.organization_id,
        ticketId: ticket.id,
        title: ticket.title,
        idempotencyKey: `crm-delivery/${delivery.deliveryId}`,
      }).catch((sendError) => {
        console.error("Nudge email error:", sendError);
        return false;
      });
      if (!sent) {
        await markNotificationDeliveryFailed(
          supabase,
          delivery.deliveryId,
          "Waiting-ticket nudge was not accepted by the email provider",
          nowIso,
        ).catch((markError) => console.error("Nudge delivery release error:", markError));
        summary.errors += 1;
        continue;
      }
      await markNotificationDeliverySent(supabase, delivery.deliveryId, nowIso).catch(
        (markError) => {
          summary.errors += 1;
          console.error("Nudge delivery completion error:", markError);
        },
      );
    }

    const { error } = await supabase
      .from("tickets")
      .update({ nudged_at: nowIso })
      .eq("id", ticket.id)
      .eq("status", "waiting_on_client");
    if (error) {
      summary.errors += 1;
      continue;
    }
    summary.nudged += 1;
  }

  for (const ticket of plan.resolve) {
    const { data: updated, error } = await supabase
      .from("tickets")
      .update({
        status: "resolved",
        resolved_at: nowIso,
        last_activity_at: nowIso,
        waiting_since: null,
        nudged_at: null,
      })
      .eq("id", ticket.id)
      .eq("status", "waiting_on_client")
      .select("id")
      .maybeSingle();
    if (error || !updated) {
      if (error) summary.errors += 1;
      continue;
    }
    await supabase.from("ticket_messages").insert({
      ticket_id: ticket.id,
      organization_id: ticket.organization_id,
      author_id: null,
      visibility: "public",
      is_system: true,
      body: "Marked resolved automatically after no reply. Reply here to reopen.",
    });
    await sendAutoResolvedEmail({
      organizationId: ticket.organization_id,
      ticketId: ticket.id,
      title: ticket.title,
    }).catch((sendError) => {
      summary.errors += 1;
      console.error("Auto-resolve email error:", sendError);
    });
    summary.resolved += 1;
  }

  for (const [organizationId, items] of plan.remind) {
    const sortedItems = [...items].sort((a, b) => a.id.localeCompare(b.id));
    const delivery = await claimNotificationDelivery(supabase, {
      kind: "project_request_reminder",
      resourceId: organizationId,
      periodKey: requestReminderPeriodKey(sortedItems),
      now: nowIso,
    }).catch((claimError) => {
      console.error("Request reminder delivery claim error:", claimError);
      return null;
    });
    if (!delivery) {
      summary.errors += 1;
      continue;
    }
    if (!delivery.claimed && !delivery.alreadySent) continue;

    if (delivery.claimed) {
      const sent = await sendRequestReminderEmail({
        organizationId,
        items: sortedItems,
        idempotencyKey: `crm-delivery/${delivery.deliveryId}`,
      }).catch((sendError) => {
        console.error("Request reminder email error:", sendError);
        return false;
      });
      if (!sent) {
        await markNotificationDeliveryFailed(
          supabase,
          delivery.deliveryId,
          "Project-request reminder was not accepted by the email provider",
          nowIso,
        ).catch((markError) =>
          console.error("Request reminder delivery release error:", markError),
        );
        summary.errors += 1;
        continue;
      }
      await markNotificationDeliverySent(supabase, delivery.deliveryId, nowIso).catch(
        (markError) => {
          summary.errors += 1;
          console.error("Request reminder delivery completion error:", markError);
        },
      );
    }

    const { error } = await supabase
      .from("project_requests")
      .update({ last_reminded_at: nowIso })
      .in(
        "id",
        sortedItems.map((item) => item.id),
      );
    if (error) {
      summary.errors += 1;
      continue;
    }
    summary.reminded += items.length;
  }

  if (plan.deleteSowFiles.length > 0) {
    const { error } = await supabase.storage.from(sowBucket).remove(plan.deleteSowFiles);
    if (error) {
      summary.errors += 1;
      console.error("Pending SOW cleanup error:", error);
    } else {
      summary.sowFilesDeleted = plan.deleteSowFiles.length;
    }
  }

  return NextResponse.json({ ok: true, ...summary });
}
