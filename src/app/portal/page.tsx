import ClientProjectCard from "@/components/crm/ClientProjectCard";
import Link from "next/link";
import NeedsFromYouList from "@/components/crm/NeedsFromYouList";
import StatusBadge from "@/components/crm/StatusBadge";
import { activeTicketStatuses, formatDateTime } from "@/lib/crm";
import {
  requireClientUser,
  getPrimaryOrganizationMembership,
} from "@/lib/auth";
import { sortRequests, toDateOnly } from "@/lib/projects";
import {
  listOrganizationProjects,
  loadProjectBundle,
} from "@/lib/projectsServer";
import type { TicketStatus } from "@/types/crm";

export default async function PortalDashboardPage() {
  const { supabase, user } = await requireClientUser();
  const membership = await getPrimaryOrganizationMembership(user.id, supabase);

  if (!membership?.organizations) {
    return (
      <main className="client-panel p-8">
        <h2 className="text-2xl font-semibold text-white">
          No organization found
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-text-secondary">
          Your account is active, but it is not yet tied to a client
          organization. Reach out to Kyle to finish the setup.
        </p>
      </main>
    );
  }

  const [projects, { data: openTicketsData, count: openTicketCount }] =
    await Promise.all([
      listOrganizationProjects(supabase, membership.organization_id),
      supabase
        .from("tickets")
        .select("id, title, status, last_activity_at", { count: "exact" })
        .eq("organization_id", membership.organization_id)
        .in("status", activeTicketStatuses)
        .order("last_activity_at", { ascending: false })
        .limit(5),
    ]);

  const visibleProjects = projects.filter(
    (project) => project.status !== "done",
  );
  const [bundleResults, { data: updatesData }] = await Promise.all([
    Promise.all(
      visibleProjects.map((project) => loadProjectBundle(supabase, project.id)),
    ),
    visibleProjects.length > 0
      ? supabase
          .from("project_updates")
          .select("id, project_id, body, sent_at")
          .in(
            "project_id",
            visibleProjects.map((project) => project.id),
          )
          .order("sent_at", { ascending: false })
          .limit(20)
      : Promise.resolve({ data: [] }),
  ]);
  const bundles = bundleResults.filter((bundle) => bundle !== null);
  const latestUpdateByProject = new Map<
    string,
    { body: string; sent_at: string }
  >();
  for (const update of (updatesData || []) as Array<{
    project_id: string;
    body: string;
    sent_at: string;
  }>) {
    if (!latestUpdateByProject.has(update.project_id)) {
      latestUpdateByProject.set(update.project_id, update);
    }
  }

  const today = toDateOnly(new Date());
  const openTickets = (openTicketsData || []) as Array<{
    id: string;
    title: string;
    status: TicketStatus;
    last_activity_at: string;
  }>;
  const completedProjects = projects.filter(
    (project) => project.status === "done",
  );

  const pendingCount = bundles.reduce(
    (count, bundle) =>
      count +
      bundle.requests.filter((request) => request.status !== "done").length,
    0,
  );
  return (
    <main className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-blue-ncs">
            {membership.organizations.name}
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white">
            Your workspace
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            See what’s moving forward and what needs your attention.
          </p>
        </div>
        <Link href="/portal/tickets/new" className="client-primary">
          Get help
        </Link>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Link href="/portal/projects" className="client-panel p-4 sm:p-5">
          <p className="text-xs text-text-secondary">Active projects</p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {
              visibleProjects.filter((project) => project.status === "active")
                .length
            }
          </p>
        </Link>
        <a href="#your-next-steps" className="client-panel p-4 sm:p-5">
          <p className="text-xs text-text-secondary">Needs from you</p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {pendingCount}
          </p>
        </a>
        <Link href="/portal/tickets" className="client-panel p-4 sm:p-5">
          <p className="text-xs text-text-secondary">Open tickets</p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {openTicketCount || 0}
          </p>
        </Link>
      </div>
      <section
        id="your-next-steps"
        className="client-panel scroll-mt-6 p-5 sm:p-6"
      >
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-ncs/15 text-blue-ncs"
          >
            ✓
          </span>
          <div>
            <h2 className="text-lg font-semibold text-white">
              Your next steps
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              Files, information, and decisions that keep your project moving.
            </p>
          </div>
        </div>
        {pendingCount === 0 ? (
          <p className="mt-5 rounded-lg bg-blue-ncs/5 p-4 text-sm text-text-secondary">
            You’re all caught up. We’ll let you know when something needs your
            attention.
          </p>
        ) : (
          <div className="mt-6 space-y-6">
            {bundles
              .filter((bundle) =>
                bundle.requests.some((request) => request.status !== "done"),
              )
              .map((bundle) => (
                <div key={bundle.project.id}>
                  <Link
                    href={`/portal/projects/${bundle.project.id}`}
                    className="text-sm font-medium text-blue-ncs hover:text-white"
                  >
                    {bundle.project.title}
                  </Link>
                  <div className="mt-3">
                    <NeedsFromYouList
                      requests={sortRequests(
                        bundle.requests.filter(
                          (request) => request.status !== "done",
                        ),
                        today,
                      )}
                      today={today}
                    />
                  </div>
                </div>
              ))}
          </div>
        )}
      </section>
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">Your projects</h2>
          <Link
            href="/portal/projects"
            className="text-sm text-blue-ncs hover:text-white"
          >
            View all →
          </Link>
        </div>
        {bundles.length === 0 ? (
          <div className="client-panel p-6">
            <h3 className="font-semibold text-white">
              {completedProjects.length
                ? "Your projects are wrapped up"
                : "Welcome aboard"}
            </h3>
            <p className="mt-2 text-sm leading-6 text-text-secondary">
              {completedProjects.length
                ? "Your completed projects are available in Projects. Open a support ticket whenever you need a change or a fix."
                : "Kyle is setting up your project. Progress and next steps will appear here when it’s ready. You can ask for help any time."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {bundles.map((bundle) => (
              <ClientProjectCard
                key={bundle.project.id}
                project={bundle.project}
                tasks={bundle.tasks}
              />
            ))}
          </div>
        )}
      </section>
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <section className="client-panel p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-white">
              Latest project updates
            </h2>
          </div>
          <div className="mt-5 space-y-4">
            {latestUpdateByProject.size === 0 ? (
              <p className="text-sm leading-6 text-text-secondary">
                Updates from Kyle will appear here as your projects move
                forward.
              </p>
            ) : (
              bundles
                .filter((bundle) =>
                  latestUpdateByProject.has(bundle.project.id),
                )
                .map((bundle) => {
                  const update = latestUpdateByProject.get(bundle.project.id)!;
                  return (
                    <article
                      key={bundle.project.id}
                      className="border-l-2 border-blue-ncs pl-4"
                    >
                      <Link
                        href={`/portal/projects/${bundle.project.id}`}
                        className="text-sm font-medium text-white hover:text-blue-ncs"
                      >
                        {bundle.project.title}
                      </Link>
                      <p className="mt-1 text-xs text-text-secondary">
                        {formatDateTime(update.sent_at)}
                      </p>
                      <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-text-secondary">
                        {update.body}
                      </p>
                      <Link
                        href={`/portal/projects/${bundle.project.id}`}
                        className="mt-2 inline-block text-xs text-blue-ncs"
                      >
                        Read project updates →
                      </Link>
                    </article>
                  );
                })
            )}
          </div>
        </section>
        <section className="client-panel p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-white">Recent support</h2>
            <Link
              href="/portal/tickets"
              className="text-sm text-blue-ncs hover:text-white"
            >
              View all →
            </Link>
          </div>
          <div className="mt-4 divide-y divide-penn-blue">
            {openTickets.length === 0 ? (
              <p className="py-3 text-sm text-text-secondary">
                No open tickets. We’re here whenever you need help.
              </p>
            ) : (
              openTickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/portal/tickets/${ticket.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 py-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white">
                      {ticket.title}
                    </p>
                    <p className="mt-1 text-xs text-text-secondary">
                      {formatDateTime(ticket.last_activity_at)}
                    </p>
                  </div>
                  <StatusBadge status={ticket.status} />
                </Link>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
