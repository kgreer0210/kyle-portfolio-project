import Link from "next/link";
import PriorityBadge from "@/components/crm/PriorityBadge";
import StatusBadge from "@/components/crm/StatusBadge";
import {
  activeTicketStatuses,
  formatDateTime,
  ticketPriorities,
  ticketPriorityLabels,
  ticketStatusLabels,
} from "@/lib/crm";
import { requireAdminUser } from "@/lib/auth";
import type { TicketPriority, TicketStatus } from "@/types/crm";

interface ActiveTicket {
  id: string;
  title: string;
  status: TicketStatus;
  priority: TicketPriority;
  last_activity_at: string;
  organization_id: string;
  organizations?: { name?: string | null } | null;
}

interface RecentMessage {
  id: string;
  ticket_id: string;
  body: string;
  visibility: "public" | "internal";
  is_system: boolean;
  created_at: string;
  tickets?: { title?: string | null } | null;
  profiles?: { full_name?: string | null; email?: string | null } | null;
}

const priorityRank: Record<TicketPriority, number> = {
  low: 0,
  normal: 1,
  high: 2,
  urgent: 3,
};

export default async function AdminDashboardPage() {
  const { supabase } = await requireAdminUser();

  const [
    { count: clientCount },
    { data: activeTicketsData },
    { count: onboardingCount },
    { data: recentMessagesData },
  ] = await Promise.all([
    supabase.from("organizations").select("*", { count: "exact", head: true }),
    supabase
      .from("tickets")
      .select(
        "id, title, status, priority, last_activity_at, organization_id, organizations(name)",
      )
      .in("status", activeTicketStatuses),
    supabase
      .from("client_onboardings")
      .select("*", { count: "exact", head: true })
      .in("status", ["submitted", "reopened", "in_progress"]),
    supabase
      .from("ticket_messages")
      .select(
        "id, ticket_id, body, visibility, is_system, created_at, tickets(title), profiles:author_id(full_name, email)",
      )
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const activeTickets = (activeTicketsData || []) as ActiveTicket[];
  const recentMessages = (recentMessagesData || []) as RecentMessage[];

  const statusCounts = new Map<TicketStatus, number>();
  const priorityCounts = new Map<TicketPriority, number>();
  const clientRollups = new Map<
    string,
    { name: string; count: number; worstPriority: TicketPriority }
  >();

  activeTickets.forEach((ticket) => {
    statusCounts.set(ticket.status, (statusCounts.get(ticket.status) || 0) + 1);
    const priority = ticket.priority || "normal";
    priorityCounts.set(priority, (priorityCounts.get(priority) || 0) + 1);

    const orgName = ticket.organizations?.name || "Unknown organization";
    const rollup = clientRollups.get(ticket.organization_id);

    if (!rollup) {
      clientRollups.set(ticket.organization_id, {
        name: orgName,
        count: 1,
        worstPriority: priority,
      });
    } else {
      rollup.count += 1;
      if (priorityRank[priority] > priorityRank[rollup.worstPriority]) {
        rollup.worstPriority = priority;
      }
    }
  });

  const awaitingReply = activeTickets
    .filter((ticket) => ticket.status === "new" || ticket.status === "open")
    .sort(
      (a, b) =>
        new Date(a.last_activity_at).getTime() -
        new Date(b.last_activity_at).getTime(),
    )
    .slice(0, 5);

  const rollupList = [...clientRollups.entries()].sort(
    (a, b) => b[1].count - a[1].count,
  );

  return (
    <main className="space-y-8">
      <section className="grid gap-5 md:grid-cols-3">
        <Link
          href="/admin/clients"
          className="rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-6 transition hover:border-blue-ncs"
        >
          <p className="text-sm text-text-secondary">Client organizations</p>
          <p className="mt-3 text-4xl font-semibold text-white">
            {clientCount || 0}
          </p>
          <p className="mt-4 text-sm font-medium text-blue-ncs">View clients</p>
        </Link>
        <Link
          href="/admin/tickets"
          className="rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-6 transition hover:border-blue-ncs"
        >
          <p className="text-sm text-text-secondary">Active tickets</p>
          <p className="mt-3 text-4xl font-semibold text-white">
            {activeTickets.length}
          </p>
          <p className="mt-4 text-sm font-medium text-blue-ncs">Open ticket queue</p>
        </Link>
        <Link
          href="/admin/onboarding"
          className="rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-6 transition hover:border-blue-ncs"
        >
          <p className="text-sm text-text-secondary">Onboarding needing review</p>
          <p className="mt-3 text-4xl font-semibold text-white">
            {onboardingCount || 0}
          </p>
          <p className="mt-4 text-sm font-medium text-blue-ncs">Review onboarding</p>
        </Link>
      </section>

      {activeTickets.length > 0 ? (
        <section className="grid gap-5 md:grid-cols-2">
          <div className="rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-6">
            <h2 className="text-xl font-semibold text-white">By status</h2>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {activeTicketStatuses.map((status) => (
                <Link
                  key={status}
                  href={`/admin/tickets?status=${status}`}
                  className="rounded-3xl border border-penn-blue bg-rich-black/40 p-4 transition hover:border-blue-ncs"
                >
                  <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">
                    {ticketStatusLabels[status]}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {statusCounts.get(status) || 0}
                  </p>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-6">
            <h2 className="text-xl font-semibold text-white">By priority</h2>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {[...ticketPriorities].reverse().map((priority) => (
                <Link
                  key={priority}
                  href={`/admin/tickets?priority=${priority}`}
                  className="rounded-3xl border border-penn-blue bg-rich-black/40 p-4 transition hover:border-blue-ncs"
                >
                  <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">
                    {ticketPriorityLabels[priority]}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {priorityCounts.get(priority) || 0}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-6">
          <h2 className="text-xl font-semibold text-white">Awaiting your reply</h2>
          <p className="mt-2 text-sm text-text-secondary">
            New and open tickets, oldest activity first.
          </p>
          <div className="mt-5 space-y-3">
            {awaitingReply.length === 0 ? (
              <p className="text-sm text-text-secondary">
                Nothing is waiting on you right now.
              </p>
            ) : (
              awaitingReply.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/admin/tickets/${ticket.id}`}
                  className="block rounded-3xl border border-penn-blue bg-rich-black/40 p-4 transition hover:border-blue-ncs"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-white">{ticket.title}</p>
                      <p className="mt-1 text-sm text-text-secondary">
                        {ticket.organizations?.name || "Unknown organization"} ·{" "}
                        {formatDateTime(ticket.last_activity_at)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <StatusBadge status={ticket.status} />
                      <PriorityBadge priority={ticket.priority || "normal"} />
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-6">
          <h2 className="text-xl font-semibold text-white">Recent activity</h2>
          <p className="mt-2 text-sm text-text-secondary">
            The latest messages across every ticket.
          </p>
          <div className="mt-5 space-y-3">
            {recentMessages.length === 0 ? (
              <p className="text-sm text-text-secondary">No messages yet.</p>
            ) : (
              recentMessages.map((message) => {
                const authorLabel =
                  message.profiles?.full_name ||
                  message.profiles?.email ||
                  "Unknown";
                const bodyPreview =
                  message.body.length > 90
                    ? `${message.body.slice(0, 90)}…`
                    : message.body;

                return (
                  <Link
                    key={message.id}
                    href={`/admin/tickets/${message.ticket_id}`}
                    className="block rounded-3xl border border-penn-blue bg-rich-black/40 p-4 transition hover:border-blue-ncs"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-semibold text-white">
                        {message.tickets?.title || "Ticket"}
                      </p>
                      <p className="shrink-0 text-xs text-text-secondary">
                        {formatDateTime(message.created_at)}
                      </p>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-text-secondary">
                      {message.is_system
                        ? bodyPreview
                        : `${authorLabel}: ${bodyPreview}`}
                      {message.visibility === "internal" && !message.is_system
                        ? " (internal)"
                        : ""}
                    </p>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-6">
          <h2 className="text-xl font-semibold text-white">Clients with open work</h2>
          <div className="mt-5 space-y-3">
            {rollupList.length === 0 ? (
              <p className="text-sm text-text-secondary">
                No clients have active tickets.
              </p>
            ) : (
              rollupList.map(([organizationId, rollup]) => (
                <Link
                  key={organizationId}
                  href={`/admin/clients/${organizationId}`}
                  className="block rounded-3xl border border-penn-blue bg-rich-black/40 p-4 transition hover:border-blue-ncs"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-white">{rollup.name}</p>
                      <p className="mt-1 text-sm text-text-secondary">
                        {rollup.count} active ticket{rollup.count === 1 ? "" : "s"}
                      </p>
                    </div>
                    <PriorityBadge priority={rollup.worstPriority} />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-6">
          <h2 className="text-xl font-semibold text-white">Fast actions</h2>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/admin/clients/new"
              className="rounded-full bg-blue-ncs px-5 py-3 font-semibold text-white transition hover:bg-lapis-lazuli"
            >
              Add client
            </Link>
            <Link
              href="/admin/clients"
              className="rounded-full border border-penn-blue px-5 py-3 font-semibold text-text-primary transition hover:border-blue-ncs"
            >
              View clients
            </Link>
            <Link
              href="/admin/tickets"
              className="rounded-full border border-penn-blue px-5 py-3 font-semibold text-text-primary transition hover:border-blue-ncs"
            >
              View tickets
            </Link>
            <Link
              href="/admin/onboarding"
              className="rounded-full border border-penn-blue px-5 py-3 font-semibold text-text-primary transition hover:border-blue-ncs"
            >
              Review onboarding
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
