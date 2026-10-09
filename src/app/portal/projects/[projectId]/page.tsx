import Link from "next/link";
import { notFound } from "next/navigation";
import NeedsFromYouList from "@/components/crm/NeedsFromYouList";
import WorkspaceTabs from "@/components/crm/WorkspaceTabs";
import {
  MilestoneTimeline,
  ProgressBar,
  formatDueDate,
} from "@/components/crm/ProjectProgress";
import StatusBadge from "@/components/crm/StatusBadge";
import {
  requireClientUser,
  getPrimaryOrganizationMembership,
} from "@/lib/auth";
import { loadProjectBundle } from "@/lib/projectsServer";
import {
  computeProgress,
  groupMilestones,
  sortRequests,
  toDateOnly,
  projectStatusLabels,
} from "@/lib/projects";
import { formatDateTime } from "@/lib/crm";
import type { TicketStatus } from "@/types/crm";

interface Update {
  id: string;
  body: string;
  sent_at: string;
}
interface ProjectTicket {
  id: string;
  title: string;
  status: TicketStatus;
  last_activity_at: string;
}

export default async function ClientProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { supabase, user } = await requireClientUser();
  const membership = await getPrimaryOrganizationMembership(user.id, supabase);
  if (!membership?.organizations) notFound();
  // Use the signed-in client's RLS-scoped connection, never the service role.
  const bundle = await loadProjectBundle(supabase, projectId);
  if (!bundle || bundle.project.organization_id !== membership.organization_id)
    notFound();
  const [
    { data: updates, error: updatesError },
    { data: tickets, error: ticketsError },
  ] = await Promise.all([
    supabase
      .from("project_updates")
      .select("id, body, sent_at")
      .eq("project_id", projectId)
      .order("sent_at", { ascending: false })
      .limit(20)
      .returns<Update[]>(),
    supabase
      .from("tickets")
      .select("id, title, status, last_activity_at")
      .eq("project_id", projectId)
      .eq("organization_id", membership.organization_id)
      .order("last_activity_at", { ascending: false })
      .limit(10)
      .returns<ProjectTicket[]>(),
  ]);
  if (updatesError || ticketsError)
    throw new Error("Unable to load project activity.", {
      cause: updatesError || ticketsError,
    });
  const { project } = bundle;
  const tasks = bundle.tasks.filter((task) => task.client_visible);
  const progress = computeProgress(tasks);
  const grouped = groupMilestones(bundle.milestones, tasks);
  const today = toDateOnly(new Date());
  const requests = sortRequests(bundle.requests, today);
  const pending = requests.filter(
    (request) => request.status !== "done",
  ).length;
  const target = formatDueDate(project.target_date);
  return (
    <main className="space-y-6">
      <Link
        href="/portal/projects"
        className="inline-flex text-sm text-text-secondary hover:text-white"
      >
        ← Your projects
      </Link>
      <section className="client-panel p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-blue-ncs">
              {membership.organizations.name}
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
              {project.title}
            </h1>
          </div>
          <span className="rounded-full border border-penn-blue px-3 py-1 text-xs text-text-secondary">
            {projectStatusLabels[project.status]}
          </span>
        </div>
        {project.summary ? (
          <p className="mt-3 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-text-secondary">
            {project.summary}
          </p>
        ) : null}
        <div className="mt-6 max-w-xl">
          <ProgressBar progress={progress} />
          <p className="mt-2 text-xs text-text-secondary">
            {progress
              ? `${progress.done} of ${progress.total} tasks complete`
              : "Progress will appear when tasks are added."}
            {target ? ` · Target ${target}` : ""}
          </p>
        </div>
      </section>
      <WorkspaceTabs
        label="Your project sections"
        sections={[
          {
            id: "overview",
            label: "Overview",
            content: (
              <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
                <section className="client-panel p-5 sm:p-6">
                  <h2 className="text-lg font-semibold text-white">
                    Project roadmap
                  </h2>
                  {grouped.milestones.length ? (
                    <div className="mt-5">
                      <MilestoneTimeline milestones={grouped.milestones} />
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-text-secondary">
                      Your milestones will appear here as the project takes
                      shape.
                    </p>
                  )}
                  <div className="mt-6 space-y-6">
                    {grouped.milestones
                      .filter((milestone) => milestone.tasks.length > 0)
                      .map((milestone) => (
                        <div key={milestone.id}>
                          <h3 className="text-sm font-medium text-white">
                            {milestone.title}
                          </h3>
                          <ul className="mt-2 divide-y divide-penn-blue">
                            {milestone.tasks.map((task) => (
                              <li
                                key={task.id}
                                className="flex items-start gap-3 py-3 text-sm"
                              >
                                <span
                                  aria-hidden="true"
                                  className={
                                    task.done_at
                                      ? "text-emerald-300"
                                      : "text-text-secondary"
                                  }
                                >
                                  {task.done_at ? "✓" : "○"}
                                </span>
                                <span className="text-text-secondary">
                                  {task.title}
                                  <span className="sr-only">
                                    {task.done_at
                                      ? " — complete"
                                      : " — pending"}
                                  </span>
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    {grouped.unassigned.length ? (
                      <div>
                        <h3 className="text-sm font-medium text-white">
                          Other work
                        </h3>
                        <ul className="mt-2 divide-y divide-penn-blue">
                          {grouped.unassigned.map((task) => (
                            <li
                              key={task.id}
                              className="flex gap-3 py-3 text-sm text-text-secondary"
                            >
                              <span aria-hidden="true">
                                {task.done_at ? "✓" : "○"}
                              </span>
                              {task.title}
                              <span className="sr-only">
                                {task.done_at ? " — complete" : " — pending"}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                </section>
                <aside className="client-panel p-5">
                  <h2 className="text-base font-semibold text-white">
                    Need a hand?
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-text-secondary">
                    Ask a question, report an issue, or request a change. Kyle
                    will follow up in your support thread.
                  </p>
                  <Link
                    href={`/portal/tickets/new?projectId=${encodeURIComponent(project.id)}`}
                    className="client-primary mt-4 inline-flex"
                  >
                    Start a request
                  </Link>
                </aside>
              </div>
            ),
          },
          {
            id: "requests",
            label: `Needs from you${pending ? ` (${pending})` : ""}`,
            content: (
              <section className="client-panel p-5 sm:p-6">
                <h2 className="text-lg font-semibold text-white">
                  Needs from you
                </h2>
                <p className="mt-2 text-sm leading-6 text-text-secondary">
                  Send files, share information, or ask for help. For account
                  access, Kyle will guide you through a safe way to grant it.
                </p>
                <div className="mt-5">
                  <NeedsFromYouList requests={requests} today={today} />
                </div>
              </section>
            ),
          },
          {
            id: "updates",
            label: "Updates",
            content: (
              <section className="client-panel p-5 sm:p-6">
                <h2 className="text-lg font-semibold text-white">
                  Project updates
                </h2>
                {updates?.length ? (
                  <div className="mt-5 space-y-6">
                    {updates.map((update) => (
                      <article
                        key={update.id}
                        className="border-l-2 border-blue-ncs pl-4"
                      >
                        <p className="text-xs text-text-secondary">
                          {formatDateTime(update.sent_at)}
                        </p>
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-text-primary">
                          {update.body}
                        </p>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-text-secondary">
                    No updates yet. Kyle’s updates will appear here.
                  </p>
                )}
              </section>
            ),
          },
          {
            id: "support",
            label: "Support",
            content: (
              <section className="client-panel p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-white">
                    Project support
                  </h2>
                  <Link
                    href={`/portal/tickets/new?projectId=${encodeURIComponent(project.id)}`}
                    className="client-secondary"
                  >
                    New ticket
                  </Link>
                </div>
                {tickets?.length ? (
                  <div className="mt-4 divide-y divide-penn-blue">
                    {tickets.map((ticket) => (
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
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-text-secondary">
                    No support tickets linked to this project yet.
                  </p>
                )}
              </section>
            ),
          },
        ]}
      />
    </main>
  );
}
