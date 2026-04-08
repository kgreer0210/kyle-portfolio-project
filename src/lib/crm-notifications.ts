import { Resend } from "resend";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { getAdminNotificationEmails } from "@/lib/crm";

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

  if (!resend || args.to.length === 0) {
    return;
  }

  await resend.emails.send({
    from: "KYGR CRM <info@kygrsolutions.com>",
    to: args.to,
    subject: args.subject,
    html: args.html,
    text: args.text,
  });
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
      <p>An invite was sent to <strong>${args.clientEmail}</strong> for <strong>${args.organizationName}</strong>.</p>
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
      <p><strong>${clientLabel}</strong> accepted their portal access.</p>
      ${
        args.organizationName
          ? `<p>Organization: <strong>${args.organizationName}</strong></p>`
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
      <p><strong>${args.organizationName}</strong> submitted onboarding.</p>
      <p>Submitted by: ${args.submittedByEmail}</p>
    `,
    text: `${args.organizationName} submitted onboarding. Submitted by ${args.submittedByEmail}.`,
  });
}

export async function sendTicketCreatedNotifications(args: {
  organizationId: string;
  organizationName: string;
  ticketId: string;
  title: string;
  createdByEmail: string;
}) {
  const recipients = getAdminNotificationEmails();

  await sendEmail({
    to: recipients,
    subject: `New client ticket: ${args.title}`,
    html: `
      <p><strong>${args.organizationName}</strong> created a new ticket.</p>
      <p>Title: <strong>${args.title}</strong></p>
      <p>Created by: ${args.createdByEmail}</p>
      <p>Ticket ID: ${args.ticketId}</p>
    `,
    text: `${args.organizationName} created a new ticket: ${args.title}. Created by ${args.createdByEmail}. Ticket ID: ${args.ticketId}.`,
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
      <p><strong>${args.organizationName}</strong> has a new public reply.</p>
      <p>Author: ${args.authorEmail}</p>
      <p>${args.body.slice(0, 500)}</p>
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
      <p>Your ticket <strong>${args.title}</strong> was updated.</p>
      <p>New status: <strong>${args.status}</strong></p>
      <p>Ticket ID: ${args.ticketId}</p>
    `,
    text: `Your ticket "${args.title}" is now ${args.status}. Ticket ID: ${args.ticketId}.`,
  });
}
