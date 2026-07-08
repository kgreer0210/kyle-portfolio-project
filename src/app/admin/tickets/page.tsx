import Link from "next/link";
import PriorityBadge from "@/components/crm/PriorityBadge";
import StatusBadge from "@/components/crm/StatusBadge";
import TicketQueueFilters from "@/components/crm/TicketQueueFilters";
import {
  activeTicketStatuses,
  formatDateTime,
  isTicketPriority,
  ticketCategoryLabels,
} from "@/lib/crm";
import { requireAdminUser } from "@/lib/auth";
import type { TicketCategory, TicketPriority, TicketStatus } from "@/types/crm";

const pageSize = 20;

const allStatuses: TicketStatus[] = [
  "new",
  "open",
  "waiting_on_client",
  "in_progress",
  "resolved",
  "closed",
];

interface AdminTicketsPageProps {
  searchParams?: Promise<{
    view?: string;
    q?: string;
    status?: string;
    priority?: string;
    org?: string;
    page?: string;
  }>;
}

function escapeIlikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}

export default async function AdminTicketsPage({
  searchParams,
}: AdminTicketsPageProps) {
  const { supabase } = await requireAdminUser();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const view = resolvedSearchParams?.view === "all" ? "all" : "active";
  const q = (resolvedSearchParams?.q || "").trim();
  const statusFilter = allStatuses.includes(
    resolvedSearchParams?.status as TicketStatus,
  )
    ? (resolvedSearchParams?.status as TicketStatus)
    : "";
  const priorityFilter =
    resolvedSearchParams?.priority &&
    isTicketPriority(resolvedSearchParams.priority)
      ? resolvedSearchParams.priority
      : "";
  const orgFilter = resolvedSearchParams?.org || "";
  const page = Math.max(0, Number.parseInt(resolvedSearchParams?.page || "0", 10) || 0);

  let query = supabase
    .from("tickets")
    .select(
      "id, title, type, status, priority, category, created_at, last_activity_at, organizations(name)",
      { count: "exact" },
    )
    .order("last_activity_at", { ascending: false })
    .order("id", { ascending: false })
    .range(page * pageSize, page * pageSize + pageSize - 1);

  if (statusFilter) {
    query = query.eq("status", statusFilter);
  } else if (view === "active") {
    query = query.in("status", activeTicketStatuses);
  }

  if (priorityFilter) {
    query = query.eq("priority", priorityFilter);
  }

  if (orgFilter) {
    query = query.eq("organization_id", orgFilter);
  }

  if (q) {
    query = query.ilike("title", `%${escapeIlikePattern(q)}%`);
  }

  const [{ data, count }, { data: organizationsData }] = await Promise.all([
    query,
    supabase.from("organizations").select("id, name").order("name"),
  ]);

  const tickets = (data || []) as Array<{
    id: string;
    title: string;
    type: "request" | "issue";
    status: TicketStatus;
    priority: TicketPriority;
    category: TicketCategory | null;
    created_at?: string;
    last_activity_at?: string;
    organizations?: { name?: string | null } | null;
  }>;

  const organizations = (organizationsData || []) as Array<{
    id: string;
    name: string;
  }>;

  const totalCount = count || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const hasPrev = page > 0;
  const hasNext = page + 1 < totalPages;

  function pageHref(targetPage: number): string {
    const params = new URLSearchParams();
    if (view !== "active") params.set("view", view);
    if (q) params.set("q", q);
    if (statusFilter) params.set("status", statusFilter);
    if (priorityFilter) params.set("priority", priorityFilter);
    if (orgFilter) params.set("org", orgFilter);
    if (targetPage > 0) params.set("page", String(targetPage));
    const queryString = params.toString();
    return `/admin/tickets${queryString ? `?${queryString}` : ""}`;
  }

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-blue-ncs">
            Admin Ticket Queue
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-white">Tickets</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-text-secondary">
            Review client requests by most recent activity. Search, filter, and
            jump directly into the ticket detail workflow.
          </p>
        </div>

        <TicketQueueFilters
          view={view}
          q={q}
          status={statusFilter}
          priority={priorityFilter}
          org={orgFilter}
          organizations={organizations}
        />
      </div>

      {tickets.length === 0 ? (
        <div className="rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-8 text-sm text-text-secondary">
          {q || statusFilter || priorityFilter || orgFilter
            ? "No tickets match the current filters."
            : view === "active"
              ? "No active tickets are waiting in the queue."
              : "No tickets have been submitted yet."}
        </div>
      ) : (
        <div className="overflow-hidden rounded-[2rem] border border-penn-blue bg-oxford-blue/80">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-penn-blue text-left text-sm">
              <thead className="bg-rich-black/40 text-text-secondary">
                <tr>
                  <th className="px-6 py-4 font-medium">Ticket</th>
                  <th className="px-6 py-4 font-medium">Organization</th>
                  <th className="px-6 py-4 font-medium">Category</th>
                  <th className="px-6 py-4 font-medium">Priority</th>
                  <th className="px-6 py-4 font-medium">Status</th>
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
                      <p className="mt-1 text-xs capitalize text-text-secondary">
                        {ticket.type} · opened {formatDateTime(ticket.created_at)}
                      </p>
                    </td>
                    <td className="px-6 py-5 text-text-secondary">
                      {ticket.organizations?.name || "Unknown organization"}
                    </td>
                    <td className="px-6 py-5 text-text-secondary">
                      {ticket.category
                        ? ticketCategoryLabels[ticket.category]
                        : "—"}
                    </td>
                    <td className="px-6 py-5">
                      <PriorityBadge priority={ticket.priority || "normal"} />
                    </td>
                    <td className="px-6 py-5">
                      <StatusBadge status={ticket.status} />
                    </td>
                    <td className="px-6 py-5 text-text-secondary">
                      {formatDateTime(ticket.last_activity_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-between text-sm text-text-secondary">
          <p>
            Page {page + 1} of {totalPages} · {totalCount} tickets
          </p>
          <div className="flex gap-3">
            {hasPrev ? (
              <Link
                href={pageHref(page - 1)}
                className="rounded-full border border-penn-blue px-4 py-2 font-medium transition hover:border-blue-ncs hover:text-white"
              >
                Previous
              </Link>
            ) : null}
            {hasNext ? (
              <Link
                href={pageHref(page + 1)}
                className="rounded-full border border-penn-blue px-4 py-2 font-medium transition hover:border-blue-ncs hover:text-white"
              >
                Next
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </main>
  );
}
