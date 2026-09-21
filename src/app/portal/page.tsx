import Link from "next/link";
import NeedsFromYouList from "@/components/crm/NeedsFromYouList";
import {
  MilestoneTimeline,
  ProgressBar,
  formatDueDate,
} from "@/components/crm/ProjectProgress";
import StatusBadge from "@/components/crm/StatusBadge";
import { activeTicketStatuses, formatDateTime } from "@/lib/crm";
import { requireClientUser, getPrimaryOrganizationMembership } from "@/lib/auth";
import {
  computeProgress,
  groupMilestones,
  sortRequests,
  toDateOnly,
} from "@/lib/projects";
import { listOrganizationProjects, loadProjectBundle } from "@/lib/projectsServer";
import type { TicketStatus } from "@/types/crm";

export default async function PortalDashboardPage() {
  const { supabase, user } = await requireClientUser();
  const membership = await getPrimaryOrganizationMembership(user.id, supabase);

  if (!membership?.organizations) {
    return (
      <main className="rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-8">
        <h2 className="text-2xl font-semibold text-white">No organization found</h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-text-secondary">
          Your account is active, but it is not yet tied to a client organization.
          Reach out to Kyle to finish the setup.
        </p>
      </main>
    );
  }

  const [projects, { data: openTicketsData }] = await Promise.all([
    listOrganizationProjects(supabase, membership.organization_id),
    supabase
      .from("tickets")
      .select("id, title, status, last_activity_at")
      .eq("organization_id", membership.organization_id)
      .in("status", activeTicketStatuses)
      .order("last_activity_at", { ascending: false })
      .limit(5),
  ]);

  const visibleProjects = projects.filter((project) => project.status !== "done");
  const [bundleResults, { data: updatesData }] = await Promise.all([
    Promise.all(visibleProjects.map((project) => loadProjectBundle(supabase, project.id))),
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
  const latestUpdateByProject = new Map<string, { body: string; sent_at: string }>();
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
  const completedProjects = projects.filter((project) => project.status === "done");

  return (
    <main className="space-y-8">
      <section className="rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-blue-ncs">
          {membership.organizations.name}
        </p>
        {bundles.length === 0 ? (
          <>
            <h2 className="mt-2 text-3xl font-semibold text-white">
              Welcome to your portal
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-text-secondary">
              {completedProjects.length > 0
                ? "Your projects are wrapped up. Need something changed or fixed? Open a ticket and Kyle will take it from there."
                : "Kyle is setting up your project. Once it's ready you'll see progress and anything needed from you right here. You can open a ticket any time."}
            </p>
          </>
        ) : (
          <h2 className="mt-2 text-3xl font-semibold text-white">
            {bundles.length === 1 ? "Your project" : "Your projects"}
          </h2>
        )}
      </section>

      {bundles.map((bundle) => {
        const { project } = bundle;
        const progress = computeProgress(bundle.tasks);
        const { milestones } = groupMilestones(bundle.milestones, bundle.tasks);
        const recentlyDone = bundle.tasks
          .filter((task) => task.done_at)
          .sort((a, b) => (b.done_at || "").localeCompare(a.done_at || ""))
          .slice(0, 3);
        const requests = sortRequests(bundle.requests, today);
        const pendingCount = requests.filter((item) => item.status !== "done").length;
        const targetDate = formatDueDate(project.target_date);
        const latestUpdate = latestUpdateByProject.get(project.id);

        return (
          <div key={project.id} className="space-y-6">
            <section className="rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-6 md:p-8">
              <div className="flex flex-col gap-2 md:flex-row md:items-baseline md:justify-between">
                <h3 className="text-2xl font-semibold text-white">{project.title}</h3>
                <p className="text-sm text-text-secondary">
                  {project.status === "paused"
                    ? "Paused"
                    : targetDate
                      ? `Target ${targetDate}`
                      : null}
                </p>
              </div>
              {project.summary ? (
                <p className="mt-3 max-w-3xl whitespace-pre-wrap text-sm leading-7 text-text-secondary">
                  {project.summary}
                </p>
              ) : null}
              <div className="mt-6">
                <ProgressBar progress={progress} />
              </div>
              {milestones.length > 0 ? (
                <div className="mt-5">
                  <MilestoneTimeline milestones={milestones} />
                </div>
              ) : null}
              {recentlyDone.length > 0 ? (
                <p className="mt-5 text-sm text-text-secondary">
                  <span className="text-text-primary">Recently done:</span>{" "}
                  {recentlyDone.map((task) => task.title).join(" · ")}
                </p>
              ) : null}
            </section>

            {latestUpdate ? (
              <section className="rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-6 md:p-8">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-xl font-semibold text-white">Latest update</h3>
                  <p className="text-sm text-text-secondary">
                    {formatDateTime(latestUpdate.sent_at)}
                  </p>
                </div>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-text-primary">
                  {latestUpdate.body}
                </p>
              </section>
            ) : null}

            {requests.length > 0 ? (
              <section className="rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-6 md:p-8">
                <h3 className="text-xl font-semibold text-white">
                  Needs from you{pendingCount > 0 ? ` (${pendingCount})` : ""}
                </h3>
                <p className="mt-2 text-sm leading-6 text-text-secondary">
                  Send what you have, tell Kyle you&apos;ll send it later, or ask
                  for help. Never share passwords here. Kyle will walk you
                  through giving access safely.
                </p>
                <div className="mt-5">
                  <NeedsFromYouList requests={requests} today={today} />
                </div>
              </section>
            ) : null}
          </div>
        );
      })}

      <section className="rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-xl font-semibold text-white">Your tickets</h3>
          <Link
            href="/portal/tickets"
            className="rounded-full bg-blue-ncs px-5 py-2 text-sm font-semibold text-white transition hover:bg-lapis-lazuli"
          >
            New ticket
          </Link>
        </div>
        {openTickets.length === 0 ? (
          <p className="mt-4 text-sm text-text-secondary">
            No open tickets. Need a change, found a bug, or have a question? Open
            a ticket.
          </p>
        ) : (
          <div className="mt-5 space-y-3">
            {openTickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/portal/tickets/${ticket.id}`}
                className="block rounded-3xl border border-penn-blue bg-rich-black/40 p-4 transition hover:border-blue-ncs"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold text-white">{ticket.title}</p>
                    <p className="mt-1 text-sm text-text-secondary">
                      Last activity {formatDateTime(ticket.last_activity_at)}
                    </p>
                  </div>
                  <StatusBadge status={ticket.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
