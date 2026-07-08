import { NextRequest, NextResponse } from "next/server";
import { requireApiClientUser } from "@/lib/api-auth";
import { jsonError, jsonFromAuthError } from "@/lib/api-response";
import { sendTicketCreatedNotifications } from "@/lib/crm-notifications";
import {
  isTicketCategory,
  isTicketPriority,
  maxTicketAttachmentsPerSubmission,
  ticketPriorityLabels,
} from "@/lib/crm";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { uploadTicketAttachments } from "@/lib/ticket-attachments";
import type { TicketType } from "@/types/crm";

function isTicketType(value: string): value is TicketType {
  return value === "request" || value === "issue";
}

export async function POST(request: NextRequest) {
  let context;

  try {
    context = await requireApiClientUser();
  } catch (error) {
    return jsonFromAuthError(error) || jsonError("Unauthorized", 401);
  }

  try {
    const formData = await request.formData();
    const type = String(formData.get("type") || "request");
    const title = String(formData.get("title") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const priority = String(formData.get("priority") || "normal");
    const rawCategory = String(formData.get("category") || "").trim();
    const files = formData
      .getAll("attachments")
      .filter((entry): entry is File => entry instanceof File && entry.size > 0);

    if (!isTicketType(type)) {
      return jsonError("Invalid ticket type.");
    }

    if (!title || !description) {
      return jsonError("Title and description are required.");
    }

    if (title.length > 200) {
      return jsonError("Title must be 200 characters or fewer.");
    }

    if (description.length > 5000) {
      return jsonError("Description must be 5000 characters or fewer.");
    }

    if (!isTicketPriority(priority)) {
      return jsonError("Invalid ticket priority.");
    }

    if (rawCategory && !isTicketCategory(rawCategory)) {
      return jsonError("Invalid ticket category.");
    }

    if (files.length > maxTicketAttachmentsPerSubmission) {
      return jsonError(
        `You can attach up to ${maxTicketAttachmentsPerSubmission} files per ticket.`,
      );
    }

    const adminSupabase = createAdminSupabaseClient();
    const { data: ticket, error: ticketError } = await adminSupabase
      .from("tickets")
      .insert({
        organization_id: context.membership.organization_id,
        created_by: context.user.id,
        type,
        status: "new",
        priority,
        category: rawCategory || null,
        title,
        description,
        last_activity_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (ticketError || !ticket) {
      console.error("Ticket creation error:", ticketError);
      return jsonError("Unable to create ticket.", 500);
    }

    if (files.length > 0) {
      await uploadTicketAttachments({
        organizationId: context.membership.organization_id,
        ticketId: ticket.id,
        uploadedBy: context.user.id,
        visibility: "public",
        files,
      });
    }

    await sendTicketCreatedNotifications({
      organizationId: context.membership.organization_id,
      organizationName: context.membership.organizations?.name || "Unknown organization",
      ticketId: ticket.id,
      title,
      createdByEmail: context.profile.email,
      priorityLabel: ticketPriorityLabels[priority],
    }).catch((notificationError) => {
      console.error("Ticket create notification error:", notificationError);
    });

    return NextResponse.json({ ticketId: ticket.id }, { status: 201 });
  } catch (error) {
    console.error("Ticket create route error:", error);
    return jsonError("An unexpected error occurred while creating the ticket.", 500);
  }
}
