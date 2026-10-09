import Link from "next/link";
import StatusBadge from "@/components/crm/StatusBadge";
import { activeTicketStatuses, formatDateTime } from "@/lib/crm";
import {
  requireClientUser,
  getPrimaryOrganizationMembership,
} from "@/lib/auth";
import type { TicketStatus } from "@/types/crm";

interface SupportTicket {
  id: string;
  title: string;
  type: "request" | "issue";
  status: TicketStatus;
  last_activity_at: string;
}

export default async function PortalTicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; q?: string }>;
}) {
  const { supabase, user } = await requireClientUser();
  const membership = await getPrimaryOrganizationMembership(user.id, supabase);
  if (!membership?.organizations)
    return (
      <main className="client-panel p-6">
        Your account is not connected to an organization yet. Contact Kyle for
        help.
      </main>
    );
  const params = await searchParams;
  const view = params.view === "all" ? "all" : "active";
  const q = (params.q || "").trim();
  let query = supabase
    .from("tickets")
    .select("id, title, type, status, last_activity_at")
    .eq("organization_id", membership.organization_id)
    .order("last_activity_at", { ascending: false });
  if (view === "active") query = query.in("status", activeTicketStatuses);
  if (q)
    query = query.ilike(
      "title",
      `%${q.replace(/[\\%_]/g, (match) => `\\${match}`)}%`,
    );
  const { data: tickets, error } = await query.returns<SupportTicket[]>();
  if (error)
    throw new Error("Unable to load your support tickets.", { cause: error });
  const searchSuffix = q ? `&q=${encodeURIComponent(q)}` : "";
  return (
    <main className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-white">Support</h1>
          <p className="mt-2 text-sm leading-6 text-text-secondary">
            Your questions, requests, and conversations with Kyle.
          </p>
        </div>
        <Link href="/portal/tickets/new" className="client-primary">
          New ticket
        </Link>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <nav
          aria-label="Support views"
          className="flex rounded-lg border border-penn-blue p-1"
        >
          <Link
            href={`/portal/tickets?view=active${searchSuffix}`}
            aria-current={view === "active" ? "page" : undefined}
            className={`rounded-md px-4 py-2 text-sm ${view === "active" ? "bg-blue-ncs/15 text-white" : "text-text-secondary"}`}
          >
            Open tickets
          </Link>
          <Link
            href={`/portal/tickets?view=all${searchSuffix}`}
            aria-current={view === "all" ? "page" : undefined}
            className={`rounded-md px-4 py-2 text-sm ${view === "all" ? "bg-blue-ncs/15 text-white" : "text-text-secondary"}`}
          >
            All tickets
          </Link>
        </nav>
        <form
          action="/portal/tickets"
          className="flex min-w-0 max-w-full gap-2"
        >
          <input type="hidden" name="view" value={view} />
          <label htmlFor="support-search" className="sr-only">
            Search your tickets
          </label>
          <input
            id="support-search"
            name="q"
            defaultValue={q}
            placeholder="Search your tickets…"
            className="min-w-0 rounded-lg border border-penn-blue bg-rich-black px-3 py-2 text-sm"
          />
          <button type="submit" className="client-secondary">
            Search
          </button>
          {q ? (
            <Link
              href={`/portal/tickets?view=${view}`}
              className="self-center text-sm text-text-secondary"
            >
              Clear
            </Link>
          ) : null}
        </form>
      </div>
      <section
        className="client-panel overflow-hidden"
        aria-label="Your support tickets"
      >
        {tickets?.length ? (
          <div className="divide-y divide-penn-blue">
            {tickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/portal/tickets/${ticket.id}`}
                className="flex flex-wrap items-center justify-between gap-4 px-5 py-5 transition hover:bg-blue-ncs/5 sm:px-6"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-text-secondary">
                    {ticket.type === "issue" ? "Issue" : "Request"} ·{" "}
                    {formatDateTime(ticket.last_activity_at)}
                  </p>
                  <h2 className="mt-2 text-base font-medium text-white">
                    {ticket.title}
                  </h2>
                </div>
                <div className="flex items-center gap-4">
                  <StatusBadge status={ticket.status} />
                  <span aria-hidden="true" className="text-text-secondary">
                    →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <h2 className="text-lg font-semibold text-white">
              {q
                ? "No matching tickets"
                : view === "active"
                  ? "You’re all caught up"
                  : "Let’s start a conversation"}
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              {q
                ? "Try another search or clear your filters."
                : "Need a change, found an issue, or have a question? Create a ticket and we’ll help."}
            </p>
            {!q ? (
              <Link
                href="/portal/tickets/new"
                className="mt-5 inline-flex text-sm font-medium text-blue-ncs"
              >
                Create a ticket →
              </Link>
            ) : null}
          </div>
        )}
      </section>
    </main>
  );
}
