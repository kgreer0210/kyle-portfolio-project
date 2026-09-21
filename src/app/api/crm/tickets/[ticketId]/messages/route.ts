import { NextRequest, NextResponse } from "next/server";
import { getPrimaryOrganizationMembership } from "@/lib/auth";
import { getApiAuthContext } from "@/lib/api-auth";
import { jsonError, jsonFromAuthError } from "@/lib/api-response";
import { maxTicketAttachmentsPerSubmission } from "@/lib/crm";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { postTicketReply } from "@/lib/ticket-replies";
import type { TicketMessageVisibility, TicketStatus } from "@/types/crm";

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

    if (files.length > maxTicketAttachmentsPerSubmission) {
      return jsonError(
        `You can attach up to ${maxTicketAttachmentsPerSubmission} files per reply.`,
      );
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

    await postTicketReply({
      ticket: {
        id: ticket.id as string,
        organization_id: ticket.organization_id as string,
        title: ticket.title as string,
        status: ticket.status as TicketStatus,
        organizationName:
          (ticket.organizations as { name?: string | null } | null)?.name ||
          "Unknown organization",
      },
      author: {
        id: context.user.id,
        email: context.profile.email,
        role: context.profile.role,
      },
      body,
      visibility,
      files,
    });

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
