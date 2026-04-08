import Link from "next/link";
import NewTicketForm from "@/components/crm/NewTicketForm";
import StatusBadge from "@/components/crm/StatusBadge";
import { formatDateTime } from "@/lib/crm";
import { requireClientUser, getPrimaryOrganizationMembership } from "@/lib/auth";

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
    .select("id, title, type, status, created_at")
    .eq("organization_id", membership.organization_id)
    .order("created_at", { ascending: false });

  const tickets = (data || []) as Array<{
    id: string;
    title: string;
    type: "request" | "issue";
    status: "new" | "open" | "waiting_on_client" | "in_progress" | "resolved" | "closed";
    created_at?: string;
  }>;

  return (
    <main className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-blue-ncs">
            Ticket History
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-white">Your tickets</h2>
        </div>

        <div className="space-y-4">
          {tickets.length === 0 ? (
            <div className="rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-6 text-sm text-text-secondary">
              No tickets yet. Use the form to create your first request or issue.
            </div>
          ) : (
            tickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/portal/tickets/${ticket.id}`}
                className="block rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-6 transition hover:border-blue-ncs"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">
                      {ticket.type}
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-white">
                      {ticket.title}
                    </h3>
                    <p className="mt-2 text-sm text-text-secondary">
                      {formatDateTime(ticket.created_at)}
                    </p>
                  </div>
                  <StatusBadge status={ticket.status} />
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

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
    </main>
  );
}
