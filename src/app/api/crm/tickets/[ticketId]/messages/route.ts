import { NextRequest, NextResponse } from "next/server";
import { getPrimaryOrganizationMembership } from "@/lib/auth";
import { getApiAuthContext } from "@/lib/api-auth";
import { jsonError, jsonFromAuthError } from "@/lib/api-response";
import { sendTicketReplyNotifications } from "@/lib/crm-notifications";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { uploadTicketAttachments } from "@/lib/ticket-attachments";
import type { TicketMessageVisibility } from "@/types/crm";

interface RouteParams {
  params: Promise<{
    ticketId: string;
  }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const context = await getApiAuthContext();

  if (!context) {
    return jsonError("Unauthorized", 401);
  }

  try {
    const { ticketId } = await params;
    const formData = await request.formData();
    const body = String(formData.get("body") || "").trim();
    const requestedVisibility = String(formData.get("visibility") || "public");
    const files = formData
      .getAll("attachments")
      .filter((entry): entry is File => entry instanceof File && entry.size > 0);

    if (!body) {
      return jsonError("A reply message is required.");
    }

    if (body.length > 5000) {
      return jsonError("Replies must be 5000 characters or fewer.");
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

    let visibility: TicketMessageVisibility = "public";

    if (context.profile.role === "admin") {
      visibility = requestedVisibility === "internal" ? "internal" : "public";
    } else {
      const membership = await getPrimaryOrganizationMembership(
        context.user.id,
        context.supabase,
      );

      if (!membership || membership.organization_id !== ticket.organization_id) {
        return jsonError("You do not have access to this ticket.", 403);
      }

      visibility = "public";
    }

    const { data: message, error: messageError } = await adminSupabase
      .from("ticket_messages")
      .insert({
        ticket_id: ticket.id,
        organization_id: ticket.organization_id,
        author_id: context.user.id,
        visibility,
        body,
        is_system: false,
      })
      .select("id")
      .single();

    if (messageError || !message) {
      console.error("Ticket message error:", messageError);
      return jsonError("Unable to save the reply.", 500);
    }

    if (files.length > 0) {
      await uploadTicketAttachments({
        organizationId: ticket.organization_id,
        ticketId: ticket.id,
        uploadedBy: context.user.id,
        visibility,
        files,
        messageId: message.id,
      });
    }

    const nextTicketStatus =
      context.profile.role === "client" && ticket.status === "waiting_on_client"
        ? "open"
        : ticket.status;

    await adminSupabase
      .from("tickets")
      .update({
        last_activity_at: new Date().toISOString(),
        status: nextTicketStatus,
      })
      .eq("id", ticket.id);

    if (visibility === "public") {
      await sendTicketReplyNotifications({
        organizationId: ticket.organization_id,
        organizationName:
          (ticket.organizations as { name?: string | null } | null)?.name ||
          "Unknown organization",
        ticketId: ticket.id,
        authorEmail: context.profile.email,
        body,
      }).catch((notificationError) => {
        console.error("Ticket reply notification error:", notificationError);
      });
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    const authResponse = jsonFromAuthError(error);

    if (authResponse) {
      return authResponse;
    }

    console.error("Ticket reply route error:", error);
    return jsonError("An unexpected error occurred while saving the reply.", 500);
  }
}
