import Link from "next/link";
import { notFound } from "next/navigation";
import AdminOnboardingReviewForm from "@/components/crm/AdminOnboardingReviewForm";
import OnboardingReviewSummary from "@/components/crm/OnboardingReviewSummary";
import OnboardingStatusBadge from "@/components/crm/OnboardingStatusBadge";
import { formatDateTime, formatFieldValue } from "@/lib/crm";
import { requireAdminUser } from "@/lib/auth";
import {
  getStepStatus,
  getVisibleFields,
  stepStatusLabels,
  summarizeResponses,
} from "@/lib/onboardingFlow";
import { projectTypeLabels } from "@/lib/onboardingPresets";
import { loadOnboardingContext } from "@/lib/onboardingServer";

interface AdminOnboardingDetailPageProps {
  params: Promise<{
    organizationId: string;
  }>;
}

export default async function AdminOnboardingDetailPage({
  params,
}: AdminOnboardingDetailPageProps) {
  const { organizationId } = await params;
  await requireAdminUser();

  const context = await loadOnboardingContext(organizationId);

  if (!context || !context.onboarding) {
    notFound();
  }

  const { organization, onboarding, steps, savedAnswers } = context;
  const isV2 = onboarding.flow_version === "v2";
  const summary = summarizeResponses(steps, savedAnswers);
  const hasSubmission =
    onboarding.status === "submitted" || onboarding.status === "completed";

  return (
    <main className="space-y-8">
      <section className="rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-6 md:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-blue-ncs">
              Onboarding Review
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-white">
              {organization.name}
            </h2>
            <p className="mt-3 text-sm leading-7 text-text-secondary">
              {isV2
                ? "What the client provided, what they'll send later, where they need help, and what to discuss. Marking this reviewed is your call based on what the first milestone needs — submission never does it automatically."
                : "Review submitted onboarding details, confirm the package is ready, or reopen it so the client can continue editing."}
            </p>
          </div>
          <OnboardingStatusBadge status={onboarding.status} />
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-penn-blue bg-rich-black/40 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">
              Primary contact
            </p>
            <p className="mt-2 text-lg font-semibold text-white">
              {organization.primary_contact_name || "N/A"}
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              {organization.primary_contact_email || "No email"}
            </p>
          </div>
          <div className="rounded-3xl border border-penn-blue bg-rich-black/40 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">
              {isV2 ? "Project type" : "Flow"}
            </p>
            <p className="mt-2 text-lg font-semibold text-white">
              {isV2 && onboarding.project_type
                ? projectTypeLabels[onboarding.project_type]
                : "Original questionnaire"}
            </p>
            {isV2 ? (
              <p className="mt-1 text-sm text-text-secondary">
                {onboarding.plan_sent_at
                  ? `Sent ${formatDateTime(onboarding.plan_sent_at)}`
                  : "Not sent yet"}
              </p>
            ) : null}
          </div>
          <div className="rounded-3xl border border-penn-blue bg-rich-black/40 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">
              Submitted
            </p>
            <p className="mt-2 text-lg font-semibold text-white">
              {formatDateTime(onboarding.submitted_at)}
            </p>
          </div>
          <div className="rounded-3xl border border-penn-blue bg-rich-black/40 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">
              Reviewed
            </p>
            <p className="mt-2 text-lg font-semibold text-white">
              {formatDateTime(onboarding.reviewed_at)}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/admin/onboarding"
            className="rounded-full border border-penn-blue px-5 py-3 font-semibold text-text-primary transition hover:border-blue-ncs"
          >
            Back to onboarding queue
          </Link>
          <Link
            href={`/admin/clients/${organization.id}`}
            className="rounded-full border border-penn-blue px-5 py-3 font-semibold text-text-primary transition hover:border-blue-ncs"
          >
            View client
          </Link>
          {isV2 ? (
            <Link
              href={`/admin/clients/${organization.id}/onboarding-setup`}
              className="rounded-full border border-penn-blue px-5 py-3 font-semibold text-text-primary transition hover:border-blue-ncs"
            >
              Edit onboarding plan
            </Link>
          ) : null}
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          {isV2 ? (
            <div className="rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-6">
              <h3 className="text-xl font-semibold text-white">Follow-up</h3>
              <p className="mt-2 text-sm leading-7 text-text-secondary">
                {hasSubmission
                  ? "Grouped from the client's submitted answers."
                  : "Grouped from what the client has saved so far — they haven't submitted yet."}
              </p>
              {onboarding.project_summary ? (
                <div className="mt-4 rounded-3xl border border-blue-ncs/30 bg-blue-ncs/5 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-blue-ncs">
                    Summary the client confirmed against
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-white">
                    {onboarding.project_summary}
                  </p>
                </div>
              ) : null}
              <div className="mt-5">
                <OnboardingReviewSummary summary={summary} showUnanswered hideEmpty={false} />
              </div>
            </div>
          ) : null}

          <div className="space-y-4">
            {steps.map((step, index) => {
              const stepStatus = getStepStatus(step, savedAnswers);
              return (
                <article
                  key={step.key}
                  className="rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-6"
                >
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.2em] text-blue-ncs">
                      Step {index + 1}
                    </p>
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <h3 className="text-2xl font-semibold text-white">{step.title}</h3>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                          stepStatus === "complete"
                            ? "bg-emerald-500/15 text-emerald-200"
                            : stepStatus === "in_progress"
                              ? "bg-amber-500/15 text-amber-200"
                              : "bg-slate-500/15 text-slate-300"
                        }`}
                      >
                        {stepStatusLabels[stepStatus]}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    {getVisibleFields(step, savedAnswers)
                      .filter((field) => field.type !== "static")
                      .map((field) => {
                        const raw = savedAnswers[step.key]?.[field.key] ?? "";
                        const value = formatFieldValue(field, raw);

                        return (
                          <div
                            key={field.key}
                            className="rounded-3xl border border-penn-blue bg-rich-black/40 p-4"
                          >
                            <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">
                              {field.label}
                              {field.required ? " · required" : ""}
                            </p>
                            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-white">
                              {value || <span className="italic text-text-secondary">Left blank</span>}
                            </p>
                          </div>
                        );
                      })}
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-6">
            <h3 className="text-xl font-semibold text-white">Review decision</h3>
            <p className="mt-3 text-sm leading-7 text-text-secondary">
              Mark it reviewed when you have what the first milestone needs, or
              reopen it so the client can update their answers. Readiness to start
              development is your decision — the client&apos;s submission never sets it.
            </p>
            <div className="mt-5">
              <AdminOnboardingReviewForm
                organizationId={organization.id}
                currentStatus={onboarding.status}
              />
            </div>
          </div>

          <div className="rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-6">
            <h3 className="text-xl font-semibold text-white">Client portal effect</h3>
            <p className="mt-3 text-sm leading-7 text-text-secondary">
              Marking reviewed locks the answers in the client portal. Reopening
              sends the client back into the editable form with their answers intact;
              their status shows &ldquo;Needs updates&rdquo; until they submit again.
              Clients can also send corrections or extra materials through a support ticket.
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}
