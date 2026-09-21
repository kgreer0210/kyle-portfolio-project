import { sendTicketReplyNotifications } from "@/lib/crm-notifications";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { uploadTicketAttachments } from "@/lib/ticket-attachments";
import type { ProfileRole, TicketMessageVisibility, TicketStatus } from "@/types/crm";

export interface ReplyTicket {
  id: string;
  organization_id: string;
  title: string;
  status: TicketStatus;
  organizationName: string;
}

export interface ReplyAuthor {
  id: string;
  email: string;
  role: ProfileRole;
}

export interface TicketStatusChange {
  status: TicketStatus;
  resolved_at?: null;
  closed_at?: null;
  waiting_since?: null;
  nudged_at?: null;
}

/**
 * How a ticket's status reacts to a new message. A client reply reopens a
 * ticket that was waiting on them or already resolved/closed; admin replies
 * and internal notes never change status.
 */
export function statusAfterReply(
  currentStatus: TicketStatus,
  authorRole: ProfileRole,
  visibility: TicketMessageVisibility,
): TicketStatusChange | null {
  if (authorRole !== "client" || visibility !== "public") {
    return null;
  }

  if (currentStatus === "waiting_on_client") {
    return { status: "open", waiting_since: null, nudged_at: null };
  }

  if (currentStatus === "resolved" || currentStatus === "closed") {
    return { status: "open", resolved_at: null, closed_at: null, waiting_since: null, nudged_at: null };
  }

  return null;
}

/**
 * Save a reply (from the portal or an email) and apply its side effects:
 * attachments, status change, activity timestamp, and notifications.
 * Authorization is the caller's job.
 */
export async function postTicketReply(args: {
  ticket: ReplyTicket;
  author: ReplyAuthor;
  body: string;
  visibility: TicketMessageVisibility;
  files?: File[];
  /** Email Message-ID, used to ignore webhook retries. */
  externalMessageId?: string | null;
}): Promise<{ messageId: string; duplicate: boolean }> {
  const supabase = createAdminSupabaseClient();

  const { data: message, error: messageError } = await supabase
    .from("ticket_messages")
    .insert({
      ticket_id: args.ticket.id,
      organization_id: args.ticket.organization_id,
      author_id: args.author.id,
      visibility: args.visibility,
      body: args.body,
      is_system: false,
      external_message_id: args.externalMessageId ?? null,
    })
    .select("id")
    .single();

  if (messageError || !message) {
    // Unique violation on external_message_id: this email was already posted.
    if (messageError?.code === "23505" && args.externalMessageId) {
      const { data: existing } = await supabase
        .from("ticket_messages")
        .select("id")
        .eq("external_message_id", args.externalMessageId)
        .maybeSingle();
      return { messageId: (existing?.id as string) ?? "", duplicate: true };
    }
    throw messageError || new Error("Unable to save the reply.");
  }

  if (args.files && args.files.length > 0) {
    await uploadTicketAttachments({
      organizationId: args.ticket.organization_id,
      ticketId: args.ticket.id,
      uploadedBy: args.author.id,
      visibility: args.visibility,
      files: args.files,
      messageId: message.id as string,
    });
  }

  const statusChange = statusAfterReply(args.ticket.status, args.author.role, args.visibility);

  await supabase
    .from("tickets")
    .update({
      last_activity_at: new Date().toISOString(),
      ...(statusChange ?? {}),
    })
    .eq("id", args.ticket.id);

  if (args.visibility === "public") {
    await sendTicketReplyNotifications({
      organizationId: args.ticket.organization_id,
      organizationName: args.ticket.organizationName,
      ticketId: args.ticket.id,
      title: args.ticket.title,
      authorEmail: args.author.email,
      body: args.body,
    }).catch((notificationError) => {
      console.error("Ticket reply notification error:", notificationError);
    });
  }

  return { messageId: message.id as string, duplicate: false };
}
