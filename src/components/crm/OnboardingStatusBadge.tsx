import type { OnboardingStatus } from "@/types/crm";
import { onboardingStatusLabels } from "@/lib/crm";

const statusClasses: Record<OnboardingStatus, string> = {
  not_started: "border-slate-400/40 bg-slate-400/10 text-slate-200",
  in_progress: "border-cyan-400/40 bg-cyan-400/10 text-cyan-200",
  submitted: "border-amber-400/40 bg-amber-400/10 text-amber-100",
  completed: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200",
  reopened: "border-orange-400/40 bg-orange-400/10 text-orange-200",
  skipped_legacy: "border-indigo-400/40 bg-indigo-400/10 text-indigo-200",
};

export default function OnboardingStatusBadge({
  status,
}: {
  status: OnboardingStatus;
}) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${statusClasses[status]}`}
    >
      {onboardingStatusLabels[status]}
    </span>
  );
}
