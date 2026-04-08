import { NextRequest, NextResponse } from "next/server";
import { requireApiAdminUser } from "@/lib/api-auth";
import { jsonError, jsonFromAuthError } from "@/lib/api-response";
import { sendTicketStatusChangeNotifications } from "@/lib/crm-notifications";
import { createAdminSupabaseClient } from "@/lib/supabase";
import type { TicketStatus } from "@/types/crm";

const validStatuses = new Set<TicketStatus>([
  "new",
  "open",
  "waiting_on_client",
  "in_progress",
  "resolved",
  "closed",
]);

interface RouteParams {
  params: Promise<{
    ticketId: string;
  }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  let context;

  try {
    context = await requireApiAdminUser();
  } catch (error) {
    return jsonFromAuthError(error) || jsonError("Unauthorized", 401);
  }

  try {
    const { ticketId } = await params;
    const body = (await request.json()) as { status?: TicketStatus };
    const status = body.status;

    if (!status || !validStatuses.has(status)) {
      return jsonError("Invalid ticket status.");
    }

    const adminSupabase = createAdminSupabaseClient();
    const { data: ticket, error: ticketLookupError } = await adminSupabase
      .from("tickets")
      .select("id, organization_id, title, status, organizations(name)")
      .eq("id", ticketId)
      .maybeSingle();

    if (ticketLookupError) {
      console.error("Ticket lookup error:", ticketLookupError);
      return jsonError("Unable to load the ticket.", 500);
    }

    if (!ticket) {
      return jsonError("Ticket not found.", 404);
    }

    const now = new Date().toISOString();
    const { error: updateError } = await adminSupabase
      .from("tickets")
      .update({
        status,
        last_activity_at: now,
        resolved_at: status === "resolved" ? now : null,
        closed_at: status === "closed" ? now : null,
      })
      .eq("id", ticket.id);

    if (updateError) {
      console.error("Ticket status update error:", updateError);
      return jsonError("Unable to update the ticket status.", 500);
    }

    const systemBody = `Status changed from ${ticket.status.replaceAll("_", " ")} to ${status.replaceAll("_", " ")}.`;
    await adminSupabase.from("ticket_messages").insert({
      ticket_id: ticket.id,
      organization_id: ticket.organization_id,
      author_id: context.user.id,
      visibility: "public",
      body: systemBody,
      is_system: true,
    });

    await sendTicketStatusChangeNotifications({
      organizationId: ticket.organization_id,
      organizationName:
        (ticket.organizations as { name?: string | null } | null)?.name ||
        "Unknown organization",
      ticketId: ticket.id,
      title: ticket.title,
      status: status.replaceAll("_", " "),
    }).catch((notificationError) => {
      console.error("Ticket status notification error:", notificationError);
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Ticket status route error:", error);
    return jsonError("An unexpected error occurred while updating the ticket.", 500);
  }
}
