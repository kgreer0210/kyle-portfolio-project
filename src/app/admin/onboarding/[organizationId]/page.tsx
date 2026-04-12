import Link from "next/link";
import { notFound } from "next/navigation";
import AdminOnboardingReviewForm from "@/components/crm/AdminOnboardingReviewForm";
import OnboardingStatusBadge from "@/components/crm/OnboardingStatusBadge";
import { formatDateTime, onboardingSteps } from "@/lib/crm";
import { requireAdminUser } from "@/lib/auth";

interface AdminOnboardingDetailPageProps {
  params: Promise<{
    organizationId: string;
  }>;
}

export default async function AdminOnboardingDetailPage({
  params,
}: AdminOnboardingDetailPageProps) {
  const { organizationId } = await params;
  const { supabase } = await requireAdminUser();

  const [{ data: organization }, { data: onboarding }, { data: responses }] =
    await Promise.all([
      supabase
        .from("organizations")
        .select("id, name, slug, primary_contact_name, primary_contact_email")
        .eq("id", organizationId)
        .maybeSingle(),
      supabase
        .from("client_onboardings")
        .select("status, submitted_at, reviewed_at, completed_steps")
        .eq("organization_id", organizationId)
        .maybeSingle(),
      supabase
        .from("onboarding_step_responses")
        .select("step_key, response")
        .eq("organization_id", organizationId),
    ]);

  if (!organization || !onboarding) {
    notFound();
  }

  const onboardingRecord = onboarding as {
    status:
      | "not_started"
      | "in_progress"
      | "submitted"
      | "completed"
      | "reopened"
      | "skipped_legacy";
    submitted_at?: string | null;
    reviewed_at?: string | null;
    completed_steps?: string[] | null;
  };

  const responseMap = Object.fromEntries(
    (responses || []).map((row) => {
      const entry = row as {
        step_key: string;
        response: Record<string, string>;
      };

      return [entry.step_key, entry.response || {}];
    }),
  );

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
              Review submitted onboarding details, confirm the package is ready,
              or reopen it so the client can continue editing.
            </p>
          </div>
          <OnboardingStatusBadge status={onboardingRecord.status} />
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
              Submitted
            </p>
            <p className="mt-2 text-lg font-semibold text-white">
              {formatDateTime(onboardingRecord.submitted_at)}
            </p>
          </div>
          <div className="rounded-3xl border border-penn-blue bg-rich-black/40 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">
              Reviewed
            </p>
            <p className="mt-2 text-lg font-semibold text-white">
              {formatDateTime(onboardingRecord.reviewed_at)}
            </p>
          </div>
          <div className="rounded-3xl border border-penn-blue bg-rich-black/40 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">
              Completed steps
            </p>
            <p className="mt-2 text-lg font-semibold text-white">
              {onboardingRecord.completed_steps?.length || 0}
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
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          {onboardingSteps.map((step, index) => (
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
                      onboardingRecord.completed_steps?.includes(step.key)
                        ? "bg-emerald-500/15 text-emerald-200"
                        : "bg-slate-500/15 text-slate-300"
                    }`}
                  >
                    {onboardingRecord.completed_steps?.includes(step.key)
                      ? "Completed"
                      : "Open"}
                  </span>
                </div>
                <p className="text-sm leading-7 text-text-secondary">
                  {step.description}
                </p>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {step.fields.map((field) => {
                  const value = responseMap[step.key]?.[field.key]?.trim();

                  return (
                    <div
                      key={field.key}
                      className="rounded-3xl border border-penn-blue bg-rich-black/40 p-4"
                    >
                      <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">
                        {field.label}
                      </p>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-white">
                        {value || "No response provided."}
                      </p>
                    </div>
                  );
                })}
              </div>
            </article>
          ))}
        </div>

        <aside className="space-y-6">
          <div className="rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-6">
            <h3 className="text-xl font-semibold text-white">Review decision</h3>
            <p className="mt-3 text-sm leading-7 text-text-secondary">
              Mark the onboarding complete when the submission is ready, or
              reopen it to let the client continue making updates.
            </p>
            <div className="mt-5">
              <AdminOnboardingReviewForm
                organizationId={organization.id}
                currentStatus={onboardingRecord.status}
              />
            </div>
          </div>

          <div className="rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-6">
            <h3 className="text-xl font-semibold text-white">Client portal effect</h3>
            <p className="mt-3 text-sm leading-7 text-text-secondary">
              Completing the review locks the onboarding package into the client
              portal. Reopening sends the client back into an editable checklist.
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}
