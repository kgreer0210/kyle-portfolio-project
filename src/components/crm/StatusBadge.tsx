import type { TicketStatus } from "@/types/crm";
import { ticketStatusLabels } from "@/lib/crm";

const statusClasses: Record<TicketStatus, string> = {
  new: "border-blue-ncs/40 bg-blue-ncs/10 text-blue-ncs",
  open: "border-cyan-400/40 bg-cyan-400/10 text-cyan-200",
  waiting_on_client: "border-amber-400/40 bg-amber-400/10 text-amber-200",
  in_progress: "border-indigo-400/40 bg-indigo-400/10 text-indigo-200",
  resolved: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200",
  closed: "border-slate-400/40 bg-slate-400/10 text-slate-200",
};

export default function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${statusClasses[status]}`}
    >
      {ticketStatusLabels[status]}
    </span>
  );
}
