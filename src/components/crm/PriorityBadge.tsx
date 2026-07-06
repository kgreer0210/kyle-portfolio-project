import type { TicketPriority } from "@/types/crm";
import { ticketPriorityLabels } from "@/lib/crm";

const priorityClasses: Record<TicketPriority, string> = {
  low: "border-slate-400/40 bg-slate-400/10 text-slate-200",
  normal: "border-blue-ncs/40 bg-blue-ncs/10 text-blue-ncs",
  high: "border-amber-400/40 bg-amber-400/10 text-amber-200",
  urgent: "border-red-400/40 bg-red-400/10 text-red-200",
};

export default function PriorityBadge({
  priority,
}: {
  priority: TicketPriority;
}) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${priorityClasses[priority]}`}
    >
      {ticketPriorityLabels[priority]}
    </span>
  );
}
