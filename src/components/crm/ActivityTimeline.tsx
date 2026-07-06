import Link from "next/link";
import { formatDateTime } from "@/lib/crm";
import {
  activityEventTypeLabels,
  type ActivityEvent,
} from "@/lib/crm-activity";

export default function ActivityTimeline({
  events,
}: {
  events: ActivityEvent[];
}) {
  if (events.length === 0) {
    return (
      <p className="text-sm leading-7 text-text-secondary">
        No activity recorded for this client yet.
      </p>
    );
  }

  return (
    <ol className="space-y-4">
      {events.map((event) => {
        const content = (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-penn-blue px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-text-secondary">
                {activityEventTypeLabels[event.type]}
              </span>
              <span className="text-xs text-text-secondary">
                {formatDateTime(event.occurredAt)}
              </span>
            </div>
            <p className="mt-2 text-sm font-semibold text-white">{event.title}</p>
            {event.detail ? (
              <p className="mt-1 text-sm leading-6 text-text-secondary">
                {event.detail}
              </p>
            ) : null}
          </>
        );

        return (
          <li key={event.id}>
            {event.href ? (
              <Link
                href={event.href}
                className="block rounded-3xl border border-penn-blue bg-rich-black/40 p-4 transition hover:border-blue-ncs"
              >
                {content}
              </Link>
            ) : (
              <div className="rounded-3xl border border-penn-blue bg-rich-black/40 p-4">
                {content}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
