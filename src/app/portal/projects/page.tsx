import Link from "next/link";
import ClientProjectCard from "@/components/crm/ClientProjectCard";
import {
  requireClientUser,
  getPrimaryOrganizationMembership,
} from "@/lib/auth";
import {
  listOrganizationProjects,
  loadProjectBundle,
} from "@/lib/projectsServer";

export default async function ClientProjectsPage() {
  const { supabase, user } = await requireClientUser();
  const membership = await getPrimaryOrganizationMembership(user.id, supabase);
  if (!membership?.organizations)
    return (
      <main className="client-panel p-6">
        Your account is not connected to an organization yet. Contact Kyle for
        help.
      </main>
    );
  const projects = await listOrganizationProjects(
    supabase,
    membership.organization_id,
  );
  const bundles = await Promise.all(
    projects.map((project) => loadProjectBundle(supabase, project.id)),
  );
  const active = bundles.filter(
    (bundle) => bundle && bundle.project.status !== "done",
  );
  const completed = bundles.filter(
    (bundle) => bundle?.project.status === "done",
  );
  return (
    <main className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-white">Your projects</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Progress, updates, and everything we need from you.
          </p>
        </div>
        <Link href="/portal/tickets/new" className="client-secondary">
          Ask a question
        </Link>
      </div>
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">
          In progress{" "}
          <span className="ml-2 text-sm font-normal text-text-secondary">
            {active.length}
          </span>
        </h2>
        {active.length === 0 ? (
          <p className="client-panel p-6 text-sm text-text-secondary">
            {completed.length
              ? "Your projects are complete. You can revisit them below."
              : "Your project is being set up. We’ll share progress here once it’s ready."}
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {active.map((bundle) =>
              bundle ? (
                <ClientProjectCard
                  key={bundle.project.id}
                  project={bundle.project}
                  tasks={bundle.tasks}
                />
              ) : null,
            )}
          </div>
        )}
      </section>
      {completed.length ? (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Completed</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {completed.map((bundle) =>
              bundle ? (
                <ClientProjectCard
                  key={bundle.project.id}
                  project={bundle.project}
                  tasks={bundle.tasks}
                />
              ) : null,
            )}
          </div>
        </section>
      ) : null}
    </main>
  );
}
