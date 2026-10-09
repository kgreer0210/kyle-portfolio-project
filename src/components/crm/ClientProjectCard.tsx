import Link from "next/link";
import { ProgressBar, formatDueDate } from "@/components/crm/ProjectProgress";
import { computeProgress, projectStatusLabels } from "@/lib/projects";
import type { Project, ProjectTask } from "@/types/crm";

export default function ClientProjectCard({
  project,
  tasks,
}: {
  project: Project;
  tasks?: ProjectTask[];
}) {
  const target = formatDueDate(project.target_date);
  const progress = tasks ? computeProgress(tasks) : null;
  return (
    <article className="client-panel flex min-w-0 flex-col p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium text-blue-ncs">Project</p>
        <span className="rounded-full border border-penn-blue px-2.5 py-1 text-xs text-text-secondary">
          {projectStatusLabels[project.status]}
        </span>
      </div>
      <h2 className="mt-3 text-lg font-semibold text-white">
        <Link
          href={`/portal/projects/${project.id}`}
          className="hover:text-blue-ncs"
        >
          {project.title}
        </Link>
      </h2>
      <p className="mt-2 line-clamp-2 text-sm leading-6 text-text-secondary">
        {project.summary ||
          "Open your project for progress, updates, and next steps."}
      </p>
      {tasks ? (
        <div className="mt-5">
          <ProgressBar progress={progress} />
          <p className="mt-2 text-xs text-text-secondary">
            {progress
              ? `${progress.done} of ${progress.total} tasks complete`
              : "Progress will appear when tasks are added."}
          </p>
        </div>
      ) : null}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
        <span className="text-xs text-text-secondary">
          {target ? `Target ${target}` : "No target date set"}
        </span>
        <Link
          href={`/portal/projects/${project.id}`}
          className="text-sm font-medium text-blue-ncs hover:text-white"
        >
          View project →
        </Link>
      </div>
    </article>
  );
}
