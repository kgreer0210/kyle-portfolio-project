import Link from "next/link";
import StatusBadge from "@/components/crm/StatusBadge";
import { formatDateTime } from "@/lib/crm";
import { requireAdminUser } from "@/lib/auth";

const activeStatuses = ["new", "open", "waiting_on_client", "in_progress"];

interface AdminTicketsPageProps {
  searchParams?: Promise<{
    view?: string;
  }>;
}

export default async function AdminTicketsPage({
  searchParams,
}: AdminTicketsPageProps) {
  const { supabase } = await requireAdminUser();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const view = resolvedSearchParams?.view === "all" ? "all" : "active";

  let query = supabase
    .from("tickets")
    .select(
      "id, title, type, status, created_at, last_activity_at, organizations(name)",
    )
    .order("last_activity_at", { ascending: false });

  if (view === "active") {
    query = query.in("status", activeStatuses);
  }

  const { data } = await query;

  const tickets = (data || []) as Array<{
    id: string;
    title: string;
    type: "request" | "issue";
    status: "new" | "open" | "waiting_on_client" | "in_progress" | "resolved" | "closed";
    created_at?: string;
    last_activity_at?: string;
    organizations?: { name?: string | null } | null;
  }>;

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-blue-ncs">
            Admin Ticket Queue
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-white">Tickets</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-text-secondary">
            Review client requests by most recent activity and jump directly into
            the existing ticket detail workflow.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/tickets"
            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
              view === "active"
                ? "border-blue-ncs bg-blue-ncs/10 text-white"
                : "border-penn-blue text-text-secondary hover:border-blue-ncs hover:text-white"
            }`}
          >
            Active
          </Link>
          <Link
            href="/admin/tickets?view=all"
            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
              view === "all"
                ? "border-blue-ncs bg-blue-ncs/10 text-white"
                : "border-penn-blue text-text-secondary hover:border-blue-ncs hover:text-white"
            }`}
          >
            All
          </Link>
        </div>
      </div>

      {tickets.length === 0 ? (
        <div className="rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-8 text-sm text-text-secondary">
          {view === "active"
            ? "No active tickets are waiting in the queue."
            : "No tickets have been submitted yet."}
        </div>
      ) : (
        <div className="overflow-hidden rounded-[2rem] border border-penn-blue bg-oxford-blue/80">
          <table className="min-w-full divide-y divide-penn-blue text-left text-sm">
            <thead className="bg-rich-black/40 text-text-secondary">
              <tr>
                <th className="px-6 py-4 font-medium">Ticket</th>
                <th className="px-6 py-4 font-medium">Organization</th>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Opened</th>
                <th className="px-6 py-4 font-medium">Last activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-penn-blue">
              {tickets.map((ticket) => (
                <tr key={ticket.id}>
                  <td className="px-6 py-5">
                    <Link
                      href={`/admin/tickets/${ticket.id}`}
                      className="font-semibold text-white hover:text-blue-ncs"
                    >
                      {ticket.title}
                    </Link>
                  </td>
                  <td className="px-6 py-5 text-text-secondary">
                    {ticket.organizations?.name || "Unknown organization"}
                  </td>
                  <td className="px-6 py-5 capitalize text-text-secondary">
                    {ticket.type}
                  </td>
                  <td className="px-6 py-5">
                    <StatusBadge status={ticket.status} />
                  </td>
                  <td className="px-6 py-5 text-text-secondary">
                    {formatDateTime(ticket.created_at)}
                  </td>
                  <td className="px-6 py-5 text-text-secondary">
                    {formatDateTime(ticket.last_activity_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
