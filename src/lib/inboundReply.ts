import {
  extractEmailAddress,
  htmlToText,
  parseReplyAddress,
  stripQuotedReply,
  type InboundConfig,
} from "@/lib/inboundEmail";
import type { ReplyAuthor, ReplyTicket } from "@/lib/ticket-replies";
import {
  maxTicketAttachmentBytes,
  maxTicketAttachmentsPerSubmission,
} from "@/lib/crm";

export interface InboundEventData {
  email_id: string;
  from: string;
  to: string[];
  cc?: string[] | null;
  received_for?: string[] | null;
  message_id: string;
}

export interface InboundAttachmentInfo {
  filename: string | null;
  content_type: string;
  content_disposition: string | null;
  size: number;
  download_url: string;
}

export interface InboundDeps {
  getTicket(ticketId: string): Promise<ReplyTicket | null>;
  findProfileByEmail(email: string): Promise<ReplyAuthor | null>;
  isOrganizationMember(userId: string, organizationId: string): Promise<boolean>;
  getEmailContent(emailId: string): Promise<{ text: string | null; html: string | null }>;
  listAttachments(emailId: string): Promise<InboundAttachmentInfo[]>;
  downloadAttachment(info: InboundAttachmentInfo): Promise<File>;
  postReply(args: {
    ticket: ReplyTicket;
    author: ReplyAuthor;
    body: string;
    files: File[];
    externalMessageId: string;
  }): Promise<{ duplicate: boolean }>;
}

export type InboundOutcome =
  | { status: "posted"; ticketId: string; attachments: number }
  | { status: "duplicate"; ticketId: string }
  | {
      status: "ignored";
      reason:
        | "no_reply_address"
        | "ticket_not_found"
        | "unknown_sender"
        | "sender_not_member"
        | "empty_body";
    };

const MAX_BODY = 5000;

/**
 * Decide whether an inbound email becomes a ticket reply, then post it.
 * Every rejection is "ignored" (HTTP 200 to the webhook) so the provider
 * doesn't retry mail that will never be accepted.
 */
export async function handleInboundEmail(
  data: InboundEventData,
  config: InboundConfig,
  deps: InboundDeps,
): Promise<InboundOutcome> {
  const recipients = [...data.to, ...(data.cc ?? []), ...(data.received_for ?? [])];
  const ticketId = parseReplyAddress(recipients, config);
  if (!ticketId) {
    return { status: "ignored", reason: "no_reply_address" };
  }

  const ticket = await deps.getTicket(ticketId);
  if (!ticket) {
    return { status: "ignored", reason: "ticket_not_found" };
  }

  const senderEmail = extractEmailAddress(data.from);
  const author = senderEmail ? await deps.findProfileByEmail(senderEmail) : null;
  if (!author) {
    return { status: "ignored", reason: "unknown_sender" };
  }

  // A valid reply address proves the email came from a thread we sent; it
  // doesn't prove who is replying. Only org members and admins may post.
  if (
    author.role !== "admin" &&
    !(await deps.isOrganizationMember(author.id, ticket.organization_id))
  ) {
    return { status: "ignored", reason: "sender_not_member" };
  }

  const content = await deps.getEmailContent(data.email_id);
  const rawText = content.text?.trim() ? content.text : content.html ? htmlToText(content.html) : "";
  const body = stripQuotedReply(rawText).slice(0, MAX_BODY);
  if (!body) {
    return { status: "ignored", reason: "empty_body" };
  }

  const attachmentInfos = (await deps.listAttachments(data.email_id))
    .filter(
      (info) =>
        info.content_disposition !== "inline" &&
        info.size > 0 &&
        info.size <= maxTicketAttachmentBytes,
    )
    .slice(0, maxTicketAttachmentsPerSubmission);

  const files: File[] = [];
  for (const info of attachmentInfos) {
    try {
      files.push(await deps.downloadAttachment(info));
    } catch (error) {
      console.error("Inbound attachment download error:", error);
    }
  }

  const result = await deps.postReply({
    ticket,
    author,
    body,
    files,
    externalMessageId: data.message_id,
  });

  return result.duplicate
    ? { status: "duplicate", ticketId }
    : { status: "posted", ticketId, attachments: files.length };
}
