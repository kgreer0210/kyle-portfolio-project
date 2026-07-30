import { Resend } from "resend";
import { createAdminSupabaseClient } from "@/lib/supabase";
import {
  getAdminNotificationEmails,
  getSiteUrl,
  ticketStatusLabels,
} from "@/lib/crm";
import { escapeHtml } from "@/lib/notifications";
import type { TicketStatus } from "@/types/crm";

function getAdminTicketUrl(ticketId: string) {
  return `${getSiteUrl()}/admin/tickets/${ticketId}`;
}

function getPortalTicketUrl(ticketId: string) {
  return `${getSiteUrl()}/portal/tickets/${ticketId}`;
}

/**
 * Every ticket email needs to lead back into the portal. Without a link, clients
 * reply to the notification itself, which lands in a mailbox instead of on the
 * ticket and leaves the thread out of sync with the real conversation.
 */
function ticketCallToActionHtml(url: string, label: string) {
  return `
      <p style="margin:24px 0;">
        <a href="${escapeHtml(url)}" style="display:inline-block;padding:12px 20px;border-radius:9999px;background:#0b3c6b;color:#ffffff;text-decoration:none;font-weight:600;">${escapeHtml(label)}</a>
      </p>
      <p style="font-size:12px;color:#6b7280;">Replying to this email won&rsquo;t add your message to the ticket &mdash; please use the link above so everything stays in one place.</p>
    `;
}

function ticketCallToActionText(url: string, label: string) {
  return `${label}: ${url}\n\nReplying to this email won't add your message to the ticket - please use the link above so everything stays in one place.`;
}

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return null;
  }

  return new Resend(apiKey);
}

async function sendEmail(args: {
  to: string[];
  subject: string;
  html: string;
  text: string;
}) {
  const resend = getResendClient();

  if (!resend) {
    console.warn(
      `[crm-notifications] RESEND_API_KEY is not set; skipped email "${args.subject}".`,
    );
    return;
  }

  if (args.to.length === 0) {
    return;
  }

  const { error } = await resend.emails.send({
    from: "KYGR CRM <info@kygrsolutions.com>",
    to: args.to,
    subject: args.subject,
    html: args.html,
    text: args.text,
  });

  if (error) {
    console.error("[crm-notifications] Resend send failed", {
      subject: args.subject,
      to: args.to,
      error,
    });
  }
}

async function getOrganizationMemberEmails(organizationId: string) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("organization_members")
    .select("profiles(email)")
    .eq("organization_id", organizationId);

  if (error || !data) {
    return [];
  }

  const emails = new Set<string>();

  data.forEach((row) => {
    const email = (row as { profiles?: { email?: string | null } | null })
      .profiles?.email;

    if (email) {
      emails.add(email);
    }
  });

  return [...emails];
}

export async function sendInviteSentNotification(args: {
  organizationName: string;
  clientEmail: string;
  clientType: "new" | "existing";
}) {
  const recipients = getAdminNotificationEmails();

  await sendEmail({
    to: recipients,
    subject: `CRM invite sent for ${args.organizationName}`,
    html: `
      <p>An invite was sent to <strong>${escapeHtml(args.clientEmail)}</strong> for <strong>${escapeHtml(args.organizationName)}</strong>.</p>
      <p>Client type: ${args.clientType === "existing" ? "Existing client" : "New client"}.</p>
    `,
    text: `An invite was sent to ${args.clientEmail} for ${args.organizationName}. Client type: ${args.clientType}.`,
  });
}

export async function sendInviteAcceptedNotification(args: {
  organizationName?: string;
  clientEmail: string;
  clientName?: string | null;
}) {
  const recipients = getAdminNotificationEmails();
  const clientLabel = args.clientName || args.clientEmail;

  await sendEmail({
    to: recipients,
    subject: `Client activated portal access: ${clientLabel}`,
    html: `
      <p><strong>${escapeHtml(clientLabel)}</strong> accepted their portal access.</p>
      ${
        args.organizationName
          ? `<p>Organization: <strong>${escapeHtml(args.organizationName)}</strong></p>`
          : ""
      }
    `,
    text: `${clientLabel} accepted portal access.${args.organizationName ? ` Organization: ${args.organizationName}.` : ""}`,
  });
}

export async function sendOnboardingSubmittedNotification(args: {
  organizationId: string;
  organizationName: string;
  submittedByEmail: string;
}) {
  const recipients = getAdminNotificationEmails();

  await sendEmail({
    to: recipients,
    subject: `Onboarding submitted: ${args.organizationName}`,
    html: `
      <p><strong>${escapeHtml(args.organizationName)}</strong> submitted onboarding.</p>
      <p>Submitted by: ${escapeHtml(args.submittedByEmail)}</p>
    `,
    text: `${args.organizationName} submitted onboarding. Submitted by ${args.submittedByEmail}.`,
  });
}

export interface TicketTriageEmailData {
  summary: string;
  appliedPriorityLabel: string;
  appliedCategoryLabel: string | null;
  missingInfo: string[];
  clarifyingQuestions: string[];
  workScope: string;
  billingAssessment: string;
}

function formatTriageEmailHtml(triage: TicketTriageEmailData): string {
  const missingInfoHtml = triage.missingInfo.length
    ? `<p>Missing info:</p><ul>${triage.missingInfo
        .map((item) => `<li>${escapeHtml(item)}</li>`)
        .join("")}</ul>`
    : "";
  const questionsHtml = triage.clarifyingQuestions.length
    ? `<p>Suggested questions for the client:</p><ol>${triage.clarifyingQuestions
        .map((question) => `<li>${escapeHtml(question)}</li>`)
        .join("")}</ol>`
    : "";

  return `
      <hr />
      <p><strong>AI triage</strong></p>
      <p>${escapeHtml(triage.summary)}</p>
      <p>Applied priority: <strong>${escapeHtml(triage.appliedPriorityLabel)}</strong>${
        triage.appliedCategoryLabel
          ? ` · Category: <strong>${escapeHtml(triage.appliedCategoryLabel)}</strong>`
          : ""
      }</p>
      <p>Work scope: ${escapeHtml(triage.workScope)} · ${escapeHtml(triage.billingAssessment)}</p>
      ${missingInfoHtml}
      ${questionsHtml}
    `;
}

function formatTriageEmailText(triage: TicketTriageEmailData): string {
  const parts = [
    `AI triage: ${triage.summary}`,
    `Applied priority: ${triage.appliedPriorityLabel}${
      triage.appliedCategoryLabel
        ? `. Category: ${triage.appliedCategoryLabel}`
        : ""
    }.`,
    `Work scope: ${triage.workScope}. ${triage.billingAssessment}`,
  ];

  if (triage.missingInfo.length) {
    parts.push(`Missing info: ${triage.missingInfo.join("; ")}`);
  }

  if (triage.clarifyingQuestions.length) {
    parts.push(
      `Suggested questions: ${triage.clarifyingQuestions.join(" | ")}`,
    );
  }

  return parts.join("\n");
}

export async function sendTicketCreatedNotifications(args: {
  organizationId: string;
  organizationName: string;
  ticketId: string;
  title: string;
  createdByEmail: string;
  priorityLabel?: string;
  triage?: TicketTriageEmailData;
}) {
  const recipients = getAdminNotificationEmails();
  const subjectPrefix = args.priorityLabel ? `[${args.priorityLabel}] ` : "";

  await sendEmail({
    to: recipients,
    subject: `${subjectPrefix}New client ticket: ${args.title}`,
    html: `
      <p><strong>${escapeHtml(args.organizationName)}</strong> created a new ticket.</p>
      <p>Title: <strong>${escapeHtml(args.title)}</strong></p>
      ${args.priorityLabel ? `<p>Priority: <strong>${escapeHtml(args.priorityLabel)}</strong></p>` : ""}
      <p>Created by: ${escapeHtml(args.createdByEmail)}</p>
      ${ticketCallToActionHtml(getAdminTicketUrl(args.ticketId), "Open ticket")}
      ${args.triage ? formatTriageEmailHtml(args.triage) : ""}
    `,
    text: `${args.organizationName} created a new ticket: ${args.title}.${args.priorityLabel ? ` Priority: ${args.priorityLabel}.` : ""} Created by ${args.createdByEmail}.\n\n${ticketCallToActionText(getAdminTicketUrl(args.ticketId), "Open ticket")}${args.triage ? `\n\n${formatTriageEmailText(args.triage)}` : ""}`,
  });
}

export async function sendTicketReplyNotifications(args: {
  organizationId: string;
  organizationName: string;
  ticketId: string;
  title: string;
  authorEmail: string;
  body: string;
}) {
  const excerpt = args.body.slice(0, 500);
  const subject = `New reply on ticket: ${args.title}`;

  // Admins and clients need different destinations, so these go out as separate
  // sends rather than one shared `to:` list.
  const adminRecipients = new Set(getAdminNotificationEmails());
  const clientRecipients = new Set(
    await getOrganizationMemberEmails(args.organizationId),
  );

  adminRecipients.delete(args.authorEmail);
  clientRecipients.delete(args.authorEmail);

  const adminUrl = getAdminTicketUrl(args.ticketId);
  const portalUrl = getPortalTicketUrl(args.ticketId);

  await Promise.all([
    sendEmail({
      to: [...adminRecipients],
      subject,
      html: `
      <p><strong>${escapeHtml(args.organizationName)}</strong> has a new public reply.</p>
      <p>Ticket: <strong>${escapeHtml(args.title)}</strong></p>
      <p>Author: ${escapeHtml(args.authorEmail)}</p>
      <p>${escapeHtml(excerpt)}</p>
      ${ticketCallToActionHtml(adminUrl, "Open ticket")}
    `,
      text: `${args.organizationName} has a new public reply from ${args.authorEmail} on "${args.title}".\n\n${excerpt}\n\n${ticketCallToActionText(adminUrl, "Open ticket")}`,
    }),
    sendEmail({
      to: [...clientRecipients],
      subject,
      html: `
      <p>There&rsquo;s a new reply on your ticket <strong>${escapeHtml(args.title)}</strong>.</p>
      <p>${escapeHtml(excerpt)}</p>
      ${ticketCallToActionHtml(portalUrl, "View and reply in the portal")}
    `,
      text: `There's a new reply on your ticket "${args.title}".\n\n${excerpt}\n\n${ticketCallToActionText(portalUrl, "View and reply in the portal")}`,
    }),
  ]);
}

export async function sendTicketStatusChangeNotifications(args: {
  organizationId: string;
  organizationName: string;
  ticketId: string;
  title: string;
  status: TicketStatus;
}) {
  const recipients = await getOrganizationMemberEmails(args.organizationId);
  const statusLabel = ticketStatusLabels[args.status] || args.status;
  const portalUrl = getPortalTicketUrl(args.ticketId);
  const needsClientReply = args.status === "waiting_on_client";
  const prompt = needsClientReply
    ? "We need some more information from you before we can continue."
    : "";

  await sendEmail({
    to: recipients,
    subject: `Ticket update: ${args.title}`,
    html: `
      <p>Your ticket <strong>${escapeHtml(args.title)}</strong> was updated.</p>
      <p>New status: <strong>${escapeHtml(statusLabel)}</strong></p>
      ${prompt ? `<p>${escapeHtml(prompt)}</p>` : ""}
      ${ticketCallToActionHtml(portalUrl, needsClientReply ? "View and reply in the portal" : "View ticket")}
    `,
    text: `Your ticket "${args.title}" is now ${statusLabel}.${prompt ? ` ${prompt}` : ""}\n\n${ticketCallToActionText(portalUrl, needsClientReply ? "View and reply in the portal" : "View ticket")}`,
  });
}
