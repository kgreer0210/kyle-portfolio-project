import type { MilestoneWithTasks, ProgressSummary } from "@/lib/projects";

function formatDueDate(date: string | null) {
  if (!date) return null;
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function ProgressBar({ progress }: { progress: ProgressSummary | null }) {
  const percent = progress?.percent ?? 0;

  return (
    <div className="flex items-center gap-3">
      <div
        className="h-2 flex-1 overflow-hidden rounded-full bg-rich-black/60"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label="Project progress"
      >
        <div
          className="h-full rounded-full bg-blue-ncs transition-[width]"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="w-12 text-right text-sm font-semibold text-white">
        {progress ? `${percent}%` : "—"}
      </span>
    </div>
  );
}

const stateStyles: Record<MilestoneWithTasks["state"], string> = {
  done: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200",
  current: "border-blue-ncs bg-blue-ncs/15 text-white",
  upcoming: "border-penn-blue bg-rich-black/40 text-text-secondary",
};

const stateMarker: Record<MilestoneWithTasks["state"], string> = {
  done: "✓",
  current: "●",
  upcoming: "○",
};

/** Horizontal (wraps on mobile) milestone timeline for the client portal. */
export function MilestoneTimeline({
  milestones,
}: {
  milestones: MilestoneWithTasks[];
}) {
  if (milestones.length === 0) {
    return null;
  }

  return (
    <ol className="flex flex-wrap gap-2">
      {milestones.map((milestone) => {
        const due = formatDueDate(milestone.due_date);
        return (
          <li
            key={milestone.id}
            className={`rounded-full border px-4 py-2 text-sm ${stateStyles[milestone.state]}`}
          >
            <span aria-hidden="true" className="mr-2">
              {stateMarker[milestone.state]}
            </span>
            <span className="font-medium">{milestone.title}</span>
            {due && milestone.state !== "done" ? (
              <span className="ml-2 text-xs opacity-80">due {due}</span>
            ) : null}
            <span className="sr-only"> ({milestone.state})</span>
          </li>
        );
      })}
    </ol>
  );
}

export { formatDueDate };
