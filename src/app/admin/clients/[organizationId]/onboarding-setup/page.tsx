import Link from "next/link";
import { notFound } from "next/navigation";
import OnboardingStatusBadge from "@/components/crm/OnboardingStatusBadge";
import PrepareOnboardingForm from "@/components/crm/PrepareOnboardingForm";
import { billingTypeLabels, formatDateTime } from "@/lib/crm";
import { getOrganizationMemberSummary } from "@/lib/crm-invites";
import { requireAdminUser } from "@/lib/auth";
import { loadOnboardingContext } from "@/lib/onboardingServer";
import type { BillingType } from "@/types/crm";

interface PageProps {
  params: Promise<{ organizationId: string }>;
}

export default async function OnboardingSetupPage({ params }: PageProps) {
  const { organizationId } = await params;
  await requireAdminUser();

  const [context, members] = await Promise.all([
    loadOnboardingContext(organizationId),
    getOrganizationMemberSummary(organizationId),
  ]);

  if (!context || !context.onboarding) {
    notFound();
  }

  const { organization, onboarding, savedAnswers } = context;
  const hasClientAnswers = Object.values(savedAnswers).some((step) =>
    Object.values(step).some((value) => value.trim()),
  );
  const isLegacyInProgress =
    onboarding.flow_version !== "v2" &&
    (onboarding.status !== "not_started" || hasClientAnswers);
  const isLocked =
    onboarding.status === "submitted" || onboarding.status === "completed";
  const billingLabel = organization.billing_type
    ? billingTypeLabels[organization.billing_type as BillingType]
    : null;

  return (
    <main className="space-y-8">
      <section className="rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-6 md:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-blue-ncs">Prepare onboarding</p>
            <h2 className="mt-2 text-3xl font-semibold text-white">{organization.name}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-text-secondary">
              Pick the project type, confirm what we already know, decide what to
              ask for, then preview the exact flow the client will see before
              sending it. Only items marked &ldquo;Ask client&rdquo; become questions.
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 lg:items-end">
            <OnboardingStatusBadge status={onboarding.status} />
            <p className="text-xs text-text-secondary">
              {onboarding.plan_sent_at
                ? `Sent ${formatDateTime(onboarding.plan_sent_at)}`
                : onboarding.plan_updated_at
                  ? `Plan saved ${formatDateTime(onboarding.plan_updated_at)}, not sent yet`
                  : "Not prepared yet"}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/admin/clients/${organization.id}`}
            className="rounded-full border border-penn-blue px-5 py-3 font-semibold text-text-primary transition hover:border-blue-ncs"
          >
            Back to client
          </Link>
          <Link
            href={`/admin/onboarding/${organization.id}`}
            className="rounded-full border border-penn-blue px-5 py-3 font-semibold text-text-primary transition hover:border-blue-ncs"
          >
            Review answers
          </Link>
        </div>
      </section>

      {onboarding.mode === "skipped_legacy" ? (
        <section className="rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-6">
          <p className="text-sm leading-7 text-text-secondary">
            This is a legacy client. Onboarding was skipped when the account was
            created, so there is nothing to prepare.
          </p>
        </section>
      ) : isLegacyInProgress ? (
        <section className="rounded-[2rem] border border-amber-500/30 bg-oxford-blue/80 p-6">
          <h3 className="text-xl font-semibold text-white">Original questionnaire in progress</h3>
          <p className="mt-2 text-sm leading-7 text-text-secondary">
            This client already started the original five-step questionnaire, so
            their answers are kept as-is and a prepared plan can&apos;t replace them.
            Review what they&apos;ve submitted from the onboarding review page.
          </p>
        </section>
      ) : (
        <PrepareOnboardingForm
          organizationId={organization.id}
          organizationName={organization.name}
          contactName={organization.primary_contact_name}
          contactEmail={organization.primary_contact_email}
          websiteUrl={organization.website_url}
          billingLabel={billingLabel}
          initialProjectType={onboarding.project_type ?? null}
          initialProjectSummary={onboarding.project_summary ?? ""}
          initialPlan={onboarding.plan ?? null}
          planSentAt={onboarding.plan_sent_at ?? null}
          planUpdatedAt={onboarding.plan_updated_at ?? null}
          memberCount={members.count}
          hasActiveMember={members.hasActiveMember}
          isLocked={isLocked}
          clientHasStarted={hasClientAnswers}
        />
      )}
    </main>
  );
}
