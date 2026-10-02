import Link from "next/link";
import { requireAdminUser } from "@/lib/auth";
import { projectStatusLabels, projectStatuses } from "@/lib/projects";
import type { ProjectStatus } from "@/types/crm";

interface ProjectRow {
  id: string;
  title: string;
  organization_id: string;
  status: ProjectStatus;
  target_date: string | null;
  organizations: { name: string } | null;
}

export default async function AdminProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { supabase } = await requireAdminUser();
  const params = await searchParams;
  const q = (params.q || "").trim();
  const status = projectStatuses.find((value) => value === params.status) || "";
  const { data, error } = await supabase
    .from("projects")
    .select(
      "id, title, organization_id, status, target_date, organizations(name)",
    )
    .order("updated_at", { ascending: false })
    .returns<ProjectRow[]>();
  if (error) throw new Error("Unable to load projects.", { cause: error });
  const projects = (data || []).filter(
    (project) =>
      (!status || project.status === status) &&
      (!q ||
        `${project.title} ${project.organizations?.name || ""}`
          .toLowerCase()
          .includes(q.toLowerCase())),
  );
  return (
    <main className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Projects</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Every client project in one place.
          </p>
        </div>
        <Link
          href="/admin/clients"
          className="rounded-lg border border-penn-blue px-4 py-2 text-sm"
        >
          Choose a client to add a project
        </Link>
      </div>
      <form
        action="/admin/projects"
        className="flex flex-wrap items-center gap-3"
      >
        <label htmlFor="project-search" className="sr-only">
          Search projects
        </label>
        <input
          id="project-search"
          name="q"
          defaultValue={q}
          placeholder="Search projects or clients…"
          className="min-w-0 flex-1 rounded-lg border border-penn-blue bg-rich-black px-4 py-2.5 text-sm sm:max-w-sm"
        />
        <label htmlFor="project-filter" className="sr-only">
          Project status
        </label>
        <select
          id="project-filter"
          name="status"
          defaultValue={status}
          className="rounded-lg border border-penn-blue bg-rich-black px-3 py-2.5 text-sm"
        >
          <option value="">All statuses</option>
          {projectStatuses.map((value) => (
            <option key={value} value={value}>
              {projectStatusLabels[value]}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg border border-penn-blue px-4 py-2.5 text-sm"
        >
          Apply
        </button>
        {q || status ? (
          <Link href="/admin/projects" className="text-sm text-text-secondary">
            Clear
          </Link>
        ) : null}
      </form>
      <div className="admin-panel overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-penn-blue text-text-secondary">
            <tr>
              <th className="px-5 py-3">Project</th>
              <th className="px-5 py-3">Client</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Target date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-penn-blue">
            {projects.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-text-secondary">
                  {q || status
                    ? "No projects match your filters."
                    : "No projects yet. Open a client to create one."}
                </td>
              </tr>
            ) : null}
            {projects.map((project) => (
              <tr key={project.id}>
                <td className="px-5 py-4">
                  <Link
                    href={`/admin/clients/${project.organization_id}/projects/${project.id}`}
                    className="font-medium text-white hover:text-blue-ncs"
                  >
                    {project.title}
                  </Link>
                </td>
                <td className="px-5 py-4 text-text-secondary">
                  {project.organizations?.name || "Unknown client"}
                </td>
                <td className="px-5 py-4 text-text-secondary">
                  {projectStatusLabels[project.status]}
                </td>
                <td className="px-5 py-4 text-text-secondary">
                  {project.target_date || "Not set"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
