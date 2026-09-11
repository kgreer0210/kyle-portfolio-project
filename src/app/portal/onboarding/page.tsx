import Link from "next/link";
import OnboardingChecklist from "@/components/crm/OnboardingChecklist";
import OnboardingReviewSummary from "@/components/crm/OnboardingReviewSummary";
import { formatFieldValue } from "@/lib/crm";
import {
  requireClientUser,
  getPrimaryOrganizationMembership,
} from "@/lib/auth";
import {
  buildInitialAnswers,
  getVisibleFields,
  summarizeResponses,
} from "@/lib/onboardingFlow";
import { loadOnboardingContext } from "@/lib/onboardingServer";

function getReadOnlyOnboardingContent(status: "submitted" | "completed") {
  if (status === "completed") {
    return {
      eyebrow: "Onboarding reviewed",
      title: "Your onboarding is complete.",
      description:
        "Kyle has reviewed your answers. They stay here for reference. If anything changes, open a support ticket and we'll update our notes.",
    };
  }

  return {
    eyebrow: "Onboarding submitted",
    title: "Thanks — we have your answers.",
    description:
      "Kyle is reviewing them now and will follow up on anything marked as sending later, needing help, or to discuss. Your answers are locked below; to add materials or send a correction, open a support ticket or ask Kyle to reopen this form.",
  };
}

export default async function PortalOnboardingPage() {
  const { supabase, user } = await requireClientUser();
  const membership = await getPrimaryOrganizationMembership(user.id, supabase);

  if (!membership?.organizations) {
    return (
      <main className="rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-8">
        <p className="text-sm text-text-secondary">
          Your account is not connected to an organization yet.
        </p>
      </main>
    );
  }

  const context = await loadOnboardingContext(membership.organization_id);

  if (!context) {
    return (
      <main className="rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-8">
        <p className="text-sm text-text-secondary">
          We couldn&apos;t load your onboarding right now. Please try again shortly.
        </p>
      </main>
    );
  }

  const { onboarding, steps, savedAnswers, isReadyForClient } = context;
  const onboardingStatus = onboarding?.status ?? "not_started";
  const isV2 = onboarding?.flow_version === "v2";

  if (onboarding?.mode === "skipped_legacy") {
    return (
      <main className="space-y-6">
        <section className="rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-blue-ncs">
            Legacy Client Access
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-white">
            Onboarding was skipped for this account.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-text-secondary">
            This portal was created for an existing client relationship, so you
            can start using tickets right away.
          </p>
        </section>
        <Link
          href="/portal/tickets"
          className="inline-flex rounded-full bg-blue-ncs px-5 py-3 font-semibold text-white transition hover:bg-lapis-lazuli"
        >
          Go to tickets
        </Link>
      </main>
    );
  }

  if (onboardingStatus === "submitted" || onboardingStatus === "completed") {
    const content = getReadOnlyOnboardingContent(onboardingStatus);
    const summary = summarizeResponses(steps, savedAnswers);

    return (
      <main className="space-y-6">
        <section className="rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-blue-ncs">
            {content.eyebrow}
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-white">{content.title}</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-text-secondary">
            {content.description}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/portal"
              className="rounded-full border border-penn-blue px-5 py-3 font-semibold text-text-primary transition hover:border-blue-ncs"
            >
              Back to dashboard
            </Link>
            <Link
              href="/portal/tickets"
              className="rounded-full bg-blue-ncs px-5 py-3 font-semibold text-white transition hover:bg-lapis-lazuli"
            >
              Send a correction or more materials
            </Link>
          </div>
        </section>

        {isV2 ? (
          <section className="rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-6">
            <h3 className="text-xl font-semibold text-white">Where things stand</h3>
            <p className="mt-2 text-sm text-text-secondary">
              What you provided, what you&apos;ll send later, and what we&apos;ll work through together.
            </p>
            <div className="mt-5">
              <OnboardingReviewSummary summary={summary} showUnanswered={false} hideEmpty />
            </div>
          </section>
        ) : null}

        <section className="space-y-4">
          {steps.map((step, index) => (
            <article
              key={step.key}
              className="rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-6"
            >
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.2em] text-blue-ncs">Step {index + 1}</p>
                <h3 className="text-2xl font-semibold text-white">{step.title}</h3>
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
                        </p>
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-white">
                          {value || <span className="italic text-text-secondary">Left blank</span>}
                        </p>
                      </div>
                    );
                  })}
              </div>
            </article>
          ))}
        </section>
      </main>
    );
  }

  if (!isReadyForClient) {
    return (
      <main className="space-y-6">
        <section className="rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-blue-ncs">Almost ready</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">
            We&apos;re preparing your onboarding.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-text-secondary">
            Kyle is tailoring a short set of questions to your project so you only
            see what&apos;s relevant. You&apos;ll get an email as soon as it&apos;s ready —
            usually within a business day. In the meantime, the portal and tickets
            are open to you.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/portal"
              className="rounded-full border border-penn-blue px-5 py-3 font-semibold text-text-primary transition hover:border-blue-ncs"
            >
              Back to dashboard
            </Link>
            <Link
              href="/portal/tickets"
              className="rounded-full bg-blue-ncs px-5 py-3 font-semibold text-white transition hover:bg-lapis-lazuli"
            >
              Open a ticket
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const initialAnswers = buildInitialAnswers(steps, savedAnswers);

  return (
    <main className="space-y-6">
      <section className="rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-blue-ncs">
          {onboardingStatus === "reopened" ? "Onboarding reopened" : "Client onboarding"}
        </p>
        <h2 className="mt-2 text-3xl font-semibold text-white">
          {isV2 ? "Let’s get ready to start." : "Let’s get to know your business."}
        </h2>
        {isV2 ? (
          <>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-text-secondary">
              Confirm your contact details and share any project materials you
              already have. Short answers are fine. Leave optional items blank if
              you&apos;re unsure — we&apos;ll work through them together.
            </p>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-text-secondary">
              Four short steps. Your progress is saved whenever you click Save, and
              you can come back any time before submitting.
              {onboardingStatus === "reopened"
                ? " Kyle reopened this so you can update your answers — change what you need to and submit again."
                : ""}
            </p>
          </>
        ) : (
          <p className="mt-4 max-w-3xl text-sm leading-7 text-text-secondary">
            This one-time setup gives us everything we need to do great work for
            you. Five short steps, and you can save anytime; no need to finish in
            one sitting. Stuck on what to write? The optional{" "}
            <span className="text-blue-ncs">✦ Refine</span> button can polish a
            rough draft or walk you through a few multiple-choice questions.
          </p>
        )}
      </section>

      <OnboardingChecklist
        organizationId={membership.organization_id}
        status={onboardingStatus}
        initialStep={onboarding?.current_step || steps[0].key}
        initialResponses={initialAnswers}
        steps={steps}
      />
    </main>
  );
}
