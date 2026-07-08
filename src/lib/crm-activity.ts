import { createAdminSupabaseClient } from "@/lib/supabase";
import { onboardingStatusLabels, ticketStatusLabels } from "@/lib/crm";
import type { OnboardingStatus, TicketStatus } from "@/types/crm";

export type ActivityEventType =
  | "ticket_created"
  | "ticket_reply"
  | "internal_note"
  | "status_change"
  | "onboarding"
  | "admin_note";

export interface ActivityEvent {
  id: string;
  type: ActivityEventType;
  occurredAt: string;
  title: string;
  detail: string;
  href?: string;
}

export const activityEventTypeLabels: Record<ActivityEventType, string> = {
  ticket_created: "Ticket created",
  ticket_reply: "Reply",
  internal_note: "Internal note",
  status_change: "Status change",
  onboarding: "Onboarding",
  admin_note: "Admin note",
};

function truncate(value: string, max = 140): string {
  const collapsed = value.replace(/\s+/g, " ").trim();
  return collapsed.length > max ? `${collapsed.slice(0, max)}…` : collapsed;
}

export async function getOrganizationActivity(
  organizationId: string,
  limit = 30,
): Promise<ActivityEvent[]> {
  const supabase = createAdminSupabaseClient();

  const [
    { data: tickets },
    { data: messages },
    { data: onboarding },
    { data: notes },
  ] = await Promise.all([
    supabase
      .from("tickets")
      .select("id, title, status, created_at")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("ticket_messages")
      .select(
        "id, ticket_id, body, visibility, is_system, created_at, tickets(title), profiles:author_id(full_name, email)",
      )
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("client_onboardings")
      .select("id, status, started_at, submitted_at, reviewed_at")
      .eq("organization_id", organizationId)
      .maybeSingle(),
    supabase
      .from("organization_notes")
      .select("id, body, created_at, profiles:author_id(full_name, email)")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(limit),
  ]);

  const events: ActivityEvent[] = [];

  (tickets || []).forEach((ticket) => {
    events.push({
      id: `ticket-${ticket.id}`,
      type: "ticket_created",
      occurredAt: ticket.created_at,
      title: ticket.title,
      detail: `Ticket opened (now ${ticketStatusLabels[ticket.status as TicketStatus] || ticket.status})`,
      href: `/admin/tickets/${ticket.id}`,
    });
  });

  (messages || []).forEach((message) => {
    const author = (
      message as {
        profiles?: { full_name?: string | null; email?: string | null } | null;
      }
    ).profiles;
    const ticketTitle =
      (message as { tickets?: { title?: string | null } | null }).tickets
        ?.title || "Ticket";
    const authorLabel = author?.full_name || author?.email || "Unknown";

    events.push({
      id: `message-${message.id}`,
      type: message.is_system
        ? "status_change"
        : message.visibility === "internal"
          ? "internal_note"
          : "ticket_reply",
      occurredAt: message.created_at,
      title: ticketTitle,
      detail: message.is_system
        ? truncate(message.body)
        : `${authorLabel}: ${truncate(message.body)}`,
      href: `/admin/tickets/${message.ticket_id}`,
    });
  });

  if (onboarding) {
    const onboardingEntries: Array<{ at: string | null; label: string }> = [
      { at: onboarding.started_at, label: "Onboarding started" },
      { at: onboarding.submitted_at, label: "Onboarding submitted" },
      {
        at: onboarding.reviewed_at,
        label: `Onboarding reviewed (${onboardingStatusLabels[onboarding.status as OnboardingStatus] || onboarding.status})`,
      },
    ];

    onboardingEntries.forEach((entry, index) => {
      if (entry.at) {
        events.push({
          id: `onboarding-${onboarding.id}-${index}`,
          type: "onboarding",
          occurredAt: entry.at,
          title: entry.label,
          detail: "",
          href: `/admin/onboarding/${organizationId}`,
        });
      }
    });
  }

  (notes || []).forEach((note) => {
    const author = (
      note as {
        profiles?: { full_name?: string | null; email?: string | null } | null;
      }
    ).profiles;

    events.push({
      id: `note-${note.id}`,
      type: "admin_note",
      occurredAt: note.created_at,
      title: author?.full_name || author?.email || "Admin",
      detail: truncate(note.body),
    });
  });

  return events
    .sort(
      (a, b) =>
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
    )
    .slice(0, limit);
}
