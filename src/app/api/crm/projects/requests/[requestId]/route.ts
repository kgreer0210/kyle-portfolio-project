import { NextRequest, NextResponse } from "next/server";
import { requireApiClientUser } from "@/lib/api-auth";
import { jsonError, jsonFromAuthError } from "@/lib/api-response";
import {
  sendTicketCreatedNotifications,
  sendTicketReplyNotifications,
} from "@/lib/crm-notifications";
import { validateAttachmentSelection } from "@/lib/crm";
import {
  isClientRequestAction,
  materialsTicketTitle,
  nextRequestStatus,
} from "@/lib/projects";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { uploadTicketAttachments } from "@/lib/ticket-attachments";
import type { ProjectRequestStatus } from "@/types/crm";

export const maxDuration = 60;

interface RouteParams {
  params: Promise<{
    requestId: string;
  }>;
}

/**
 * Client actions on a "Needs from you" item. Clients have no write RLS on
 * project tables, so membership is checked here and writes use the service
 * role. Uploads and "help me" go through one Materials ticket per request so
 * files, notifications, and the conversation reuse the ticket system.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  let context;

  try {
    context = await requireApiClientUser();
  } catch (error) {
    return jsonFromAuthError(error) || jsonError("Unauthorized", 401);
  }

  try {
    const { requestId } = await params;
    const formData = await request.formData();
    const action = String(formData.get("action") || "");
    const note = String(formData.get("note") || "").trim();
    const files = formData
      .getAll("attachments")
      .filter((entry): entry is File => entry instanceof File && entry.size > 0);

    if (!isClientRequestAction(action)) {
      return jsonError("Invalid action.");
    }

    if (note.length > 2000) {
      return jsonError("Notes must be 2000 characters or fewer.");
    }

    if (action === "upload") {
      if (files.length === 0) {
        return jsonError("Choose at least one file to upload.");
      }
      const fileError = validateAttachmentSelection(files);
      if (fileError) {
        return jsonError(fileError);
      }
    } else if (files.length > 0) {
      return jsonError("Files can only be sent with an upload.");
    }

    if (action === "help" && !note) {
      return jsonError("Tell us what you need help with.");
    }

    const organizationId = context.membership.organization_id;
    const adminSupabase = createAdminSupabaseClient();
    const { data: projectRequest, error: lookupError } = await adminSupabase
      .from("project_requests")
      .select("id, organization_id, project_id, title, status, ticket_id")
      .eq("id", requestId)
      .maybeSingle();

    if (lookupError) {
      console.error("Project request lookup error:", lookupError);
      return jsonError("Unable to load this item.", 500);
    }

    // Same response for missing and other-org rows so ids can't be probed.
    if (!projectRequest || projectRequest.organization_id !== organizationId) {
      return jsonError("Item not found.", 404);
    }

    const status = nextRequestStatus(
      projectRequest.status as ProjectRequestStatus,
      action,
    );
    let ticketId: string | null = projectRequest.ticket_id;

    if (action === "upload" || action === "help") {
      const organizationName =
        context.membership.organizations?.name || "Unknown organization";
      const messageBody =
        action === "upload"
          ? note || `Uploaded ${files.length} file${files.length === 1 ? "" : "s"}.`
          : `Needs help: ${note}`;

      if (!ticketId) {
        const { data: ticket, error: ticketError } = await adminSupabase
          .from("tickets")
          .insert({
            organization_id: organizationId,
            project_id: projectRequest.project_id,
            created_by: context.user.id,
            type: "request",
            status: "new",
            priority: "normal",
            title: materialsTicketTitle(projectRequest.title),
            description: messageBody,
            last_activity_at: new Date().toISOString(),
          })
          .select("id")
          .single();

        if (ticketError || !ticket) {
          console.error("Materials ticket creation error:", ticketError);
          return jsonError("Unable to save this item.", 500);
        }

        ticketId = ticket.id as string;

        if (files.length > 0) {
          await uploadTicketAttachments({
            organizationId,
            ticketId,
            uploadedBy: context.user.id,
            visibility: "public",
            files,
          });
        }

        await sendTicketCreatedNotifications({
          organizationId,
          organizationName,
          ticketId,
          title: materialsTicketTitle(projectRequest.title),
          createdByEmail: context.profile.email,
        }).catch((notificationError) => {
          console.error("Materials ticket notification error:", notificationError);
        });
      } else {
        const { data: message, error: messageError } = await adminSupabase
          .from("ticket_messages")
          .insert({
            ticket_id: ticketId,
            organization_id: organizationId,
            author_id: context.user.id,
            visibility: "public",
            body: messageBody,
            is_system: false,
          })
          .select("id")
          .single();

        if (messageError || !message) {
          console.error("Materials ticket message error:", messageError);
          return jsonError("Unable to save this item.", 500);
        }

        if (files.length > 0) {
          await uploadTicketAttachments({
            organizationId,
            ticketId,
            uploadedBy: context.user.id,
            visibility: "public",
            files,
            messageId: message.id,
          });
        }

        const { data: existingTicket } = await adminSupabase
          .from("tickets")
          .select("status")
          .eq("id", ticketId)
          .maybeSingle();
        const existingStatus = existingTicket?.status as string | undefined;
        const reopened =
          existingStatus === "waiting_on_client" ||
          existingStatus === "resolved" ||
          existingStatus === "closed";

        await adminSupabase
          .from("tickets")
          .update({
            last_activity_at: new Date().toISOString(),
            ...(reopened
              ? {
                  status: "open",
                  resolved_at: null,
                  closed_at: null,
                  waiting_since: null,
                  nudged_at: null,
                }
              : {}),
          })
          .eq("id", ticketId);

        await sendTicketReplyNotifications({
          organizationId,
          organizationName,
          ticketId,
          title: materialsTicketTitle(projectRequest.title),
          authorEmail: context.profile.email,
          body: messageBody,
        }).catch((notificationError) => {
          console.error("Materials reply notification error:", notificationError);
        });
      }
    }

    const { error: updateError } = await adminSupabase
      .from("project_requests")
      .update({
        status,
        ticket_id: ticketId,
        ...(note && action !== "help" ? { client_note: note } : {}),
      })
      .eq("id", projectRequest.id);

    if (updateError) {
      console.error("Project request update error:", updateError);
      return jsonError("Unable to save this item.", 500);
    }

    return NextResponse.json({ ok: true, status, ticketId });
  } catch (error) {
    console.error("Project request route error:", error);
    const message =
      error instanceof Error && error.message.includes("exceeds")
        ? error.message
        : "An unexpected error occurred while saving this item.";
    return jsonError(message, 500);
  }
}
