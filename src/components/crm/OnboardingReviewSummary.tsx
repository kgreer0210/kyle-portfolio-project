import type { ResponseSummary, SummaryEntry } from "@/lib/onboardingFlow";
import type { OnboardingSummaryBucket } from "@/types/crm";

interface OnboardingReviewSummaryProps {
  summary: ResponseSummary;
  /** When provided, each group gets an edit action that jumps to the step. */
  onEdit?: (stepKey: string) => void;
  /** Show required-but-blank items prominently (client review). */
  showUnanswered?: boolean;
  /** Compact admin variant hides empty buckets. */
  hideEmpty?: boolean;
}

const bucketMeta: Record<
  OnboardingSummaryBucket | "unanswered",
  { title: string; hint: string; tone: string }
> = {
  provided: {
    title: "Provided",
    hint: "Answers and materials we have now.",
    tone: "border-emerald-500/30 text-emerald-200",
  },
  later: {
    title: "Sending later",
    hint: "Items the client will share after submitting.",
    tone: "border-sky-500/30 text-sky-200",
  },
  help: {
    title: "Needs help",
    hint: "Items where the client asked for a hand.",
    tone: "border-amber-500/30 text-amber-200",
  },
  discuss: {
    title: "To discuss",
    hint: "Questions or changes to talk through. Nothing here changes the agreed scope on its own.",
    tone: "border-fuchsia-500/30 text-fuchsia-200",
  },
  unanswered: {
    title: "Not answered",
    hint: "Optional unless marked required.",
    tone: "border-slate-500/30 text-slate-300",
  },
};

function groupByStep(entries: SummaryEntry[]) {
  const groups = new Map<string, { title: string; entries: SummaryEntry[] }>();
  for (const entry of entries) {
    const group = groups.get(entry.stepKey) ?? { title: entry.stepTitle, entries: [] };
    group.entries.push(entry);
    groups.set(entry.stepKey, group);
  }
  return [...groups.entries()];
}

function Bucket({
  bucket,
  entries,
  onEdit,
  hideEmpty,
  emptyText,
}: {
  bucket: OnboardingSummaryBucket | "unanswered";
  entries: SummaryEntry[];
  onEdit?: (stepKey: string) => void;
  hideEmpty?: boolean;
  emptyText: string;
}) {
  if (hideEmpty && entries.length === 0) return null;
  const meta = bucketMeta[bucket];

  return (
    <section
      className="rounded-3xl border border-penn-blue bg-rich-black/40 p-4"
      aria-labelledby={`summary-${bucket}`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h4 id={`summary-${bucket}`} className="text-base font-semibold text-white">
          {meta.title}
          <span
            className={`ml-2 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] ${meta.tone}`}
          >
            {entries.length}
          </span>
        </h4>
        <p className="text-xs text-text-secondary">{meta.hint}</p>
      </div>

      {entries.length === 0 ? (
        <p className="mt-3 text-sm text-text-secondary">{emptyText}</p>
      ) : (
        <div className="mt-3 space-y-3">
          {groupByStep(entries).map(([stepKey, group]) => (
            <div key={stepKey}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">
                  {group.title}
                </p>
                {onEdit ? (
                  <button
                    type="button"
                    onClick={() => onEdit(stepKey)}
                    className="text-xs font-medium text-blue-ncs transition hover:text-white"
                  >
                    Edit
                  </button>
                ) : null}
              </div>
              <ul className="mt-2 space-y-2">
                {group.entries.map((entry) => (
                  <li
                    key={`${entry.stepKey}-${entry.fieldKey}`}
                    className="rounded-2xl border border-penn-blue/60 bg-oxford-blue/60 px-3 py-2"
                  >
                    <p className="text-xs text-text-secondary">
                      {entry.label}
                      {entry.required ? (
                        <span className="ml-2 rounded-full border border-amber-500/40 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.18em] text-amber-200">
                          Required
                        </span>
                      ) : null}
                    </p>
                    {entry.value ? (
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-white">
                        {entry.value}
                      </p>
                    ) : (
                      <p className="mt-1 text-sm italic text-text-secondary">Left blank</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function OnboardingReviewSummary({
  summary,
  onEdit,
  showUnanswered = true,
  hideEmpty = false,
}: OnboardingReviewSummaryProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Bucket
        bucket="provided"
        entries={summary.provided}
        onEdit={onEdit}
        hideEmpty={hideEmpty}
        emptyText="Nothing provided yet."
      />
      <Bucket
        bucket="later"
        entries={summary.later}
        onEdit={onEdit}
        hideEmpty={hideEmpty}
        emptyText="Nothing marked for later."
      />
      <Bucket
        bucket="help"
        entries={summary.help}
        onEdit={onEdit}
        hideEmpty={hideEmpty}
        emptyText="No help requested."
      />
      <Bucket
        bucket="discuss"
        entries={summary.discuss}
        onEdit={onEdit}
        hideEmpty={hideEmpty}
        emptyText="Nothing flagged for discussion."
      />
      {showUnanswered ? (
        <div className="md:col-span-2">
          <Bucket
            bucket="unanswered"
            entries={summary.unanswered}
            onEdit={onEdit}
            hideEmpty={hideEmpty}
            emptyText="Everything has an answer."
          />
        </div>
      ) : null}
    </div>
  );
}
