import { Resend } from "resend";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { getAdminNotificationEmails } from "@/lib/crm";
import { escapeHtml } from "@/lib/notifications";

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
      <p>Ticket ID: ${escapeHtml(args.ticketId)}</p>
      ${args.triage ? formatTriageEmailHtml(args.triage) : ""}
    `,
    text: `${args.organizationName} created a new ticket: ${args.title}.${args.priorityLabel ? ` Priority: ${args.priorityLabel}.` : ""} Created by ${args.createdByEmail}. Ticket ID: ${args.ticketId}.${args.triage ? `\n\n${formatTriageEmailText(args.triage)}` : ""}`,
  });
}

export async function sendTicketReplyNotifications(args: {
  organizationId: string;
  organizationName: string;
  ticketId: string;
  authorEmail: string;
  body: string;
}) {
  const recipients = new Set<string>([
    ...getAdminNotificationEmails(),
    ...(await getOrganizationMemberEmails(args.organizationId)),
  ]);

  recipients.delete(args.authorEmail);

  await sendEmail({
    to: [...recipients],
    subject: `New portal reply for ticket ${args.ticketId}`,
    html: `
      <p><strong>${escapeHtml(args.organizationName)}</strong> has a new public reply.</p>
      <p>Author: ${escapeHtml(args.authorEmail)}</p>
      <p>${escapeHtml(args.body.slice(0, 500))}</p>
    `,
    text: `${args.organizationName} has a new public reply from ${args.authorEmail}. ${args.body.slice(0, 500)}`,
  });
}

export async function sendTicketStatusChangeNotifications(args: {
  organizationId: string;
  organizationName: string;
  ticketId: string;
  title: string;
  status: string;
}) {
  const recipients = await getOrganizationMemberEmails(args.organizationId);

  await sendEmail({
    to: recipients,
    subject: `Ticket update: ${args.title}`,
    html: `
      <p>Your ticket <strong>${escapeHtml(args.title)}</strong> was updated.</p>
      <p>New status: <strong>${escapeHtml(args.status)}</strong></p>
      <p>Ticket ID: ${escapeHtml(args.ticketId)}</p>
    `,
    text: `Your ticket "${args.title}" is now ${args.status}. Ticket ID: ${args.ticketId}.`,
  });
}
