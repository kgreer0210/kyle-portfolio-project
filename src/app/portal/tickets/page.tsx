import Link from "next/link";
import NewTicketForm from "@/components/crm/NewTicketForm";
import PriorityBadge from "@/components/crm/PriorityBadge";
import StatusBadge from "@/components/crm/StatusBadge";
import { formatDateTime } from "@/lib/crm";
import { requireClientUser, getPrimaryOrganizationMembership } from "@/lib/auth";
import type { TicketPriority, TicketStatus } from "@/types/crm";

export default async function PortalTicketsPage() {
  const { supabase, user } = await requireClientUser();
  const membership = await getPrimaryOrganizationMembership(user.id, supabase);

  if (!membership?.organizations) {
    return (
      <main className="rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-8">
        <p className="text-sm text-text-secondary">
          Your account is not connected to an organization yet.
        </p>
      </main>
    );
  }

  const { data } = await supabase
    .from("tickets")
    .select("id, title, type, status, priority, created_at")
    .eq("organization_id", membership.organization_id)
    .order("created_at", { ascending: false });

  const tickets = (data || []) as Array<{
    id: string;
    title: string;
    type: "request" | "issue";
    status: TicketStatus;
    priority: TicketPriority;
    created_at?: string;
  }>;

  return (
    <main className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
      <section className="rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-6 md:p-8">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-blue-ncs">
            New Ticket
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-white">
            Start a support thread
          </h3>
        </div>
        <div className="mt-6">
          <NewTicketForm />
        </div>
      </section>

      <section className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-blue-ncs">
            Recent Activity
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Your tickets</h2>
        </div>

        <div className="divide-y divide-penn-blue overflow-hidden rounded-[2rem] border border-penn-blue bg-oxford-blue/80">
          {tickets.length === 0 ? (
            <p className="p-6 text-sm leading-6 text-text-secondary">
              No tickets yet. Use the form to create your first request or issue.
            </p>
          ) : (
            tickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/portal/tickets/${ticket.id}`}
                className="block p-5 transition hover:bg-penn-blue/30"
              >
                <p className="text-xs uppercase tracking-[0.16em] text-text-secondary">
                  {ticket.type} · {formatDateTime(ticket.created_at)}
                </p>
                <h3 className="mt-2 line-clamp-2 font-semibold text-white">
                  {ticket.title}
                </h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  <StatusBadge status={ticket.status} />
                  <PriorityBadge priority={ticket.priority || "normal"} />
                </div>
              </Link>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
