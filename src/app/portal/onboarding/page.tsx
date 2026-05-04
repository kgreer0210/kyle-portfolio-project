import Link from "next/link";
import OnboardingChecklist from "@/components/crm/OnboardingChecklist";
import { onboardingSteps } from "@/lib/crm";
import {
  requireClientUser,
  getPrimaryOrganizationMembership,
} from "@/lib/auth";

function getReadOnlyOnboardingContent(status: "submitted" | "completed") {
  if (status === "completed") {
    return {
      eyebrow: "Onboarding Complete",
      title: "Your onboarding is complete.",
      description:
        "Thanks for wrapping up the onboarding flow. Your responses are saved here as a reference point for future work.",
    };
  }

  return {
    eyebrow: "Onboarding Under Review",
    title: "Your onboarding has been submitted.",
    description:
      "Thanks for completing the onboarding checklist. We're reviewing your responses now, and the details below remain available for reference.",
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

  const [{ data: onboarding }, { data: responses }] = await Promise.all([
    supabase
      .from("client_onboardings")
      .select("*")
      .eq("organization_id", membership.organization_id)
      .maybeSingle(),
    supabase
      .from("onboarding_step_responses")
      .select("step_key, response")
      .eq("organization_id", membership.organization_id),
  ]);

  const responseMap = Object.fromEntries(
    (responses || []).map((row) => {
      const entry = row as {
        step_key: string;
        response: Record<string, string>;
      };
      return [entry.step_key, entry.response || {}];
    }),
  );
  const onboardingStatus =
    ((onboarding as { status?: string } | null)?.status as
      | "not_started"
      | "in_progress"
      | "submitted"
      | "completed"
      | "reopened"
      | "skipped_legacy") || "not_started";

  if ((onboarding as { mode?: string } | null)?.mode === "skipped_legacy") {
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
            can start using tickets right away without repeating a full
            discovery flow.
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

    return (
      <main className="space-y-6">
        <section className="rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-blue-ncs">
            {content.eyebrow}
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-white">
            {content.title}
          </h2>
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
              Go to tickets
            </Link>
          </div>
        </section>

        <section className="space-y-4">
          {onboardingSteps.map((step, index) => (
            <article
              key={step.key}
              className="rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-6"
            >
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.2em] text-blue-ncs">
                  Step {index + 1}
                </p>
                <h3 className="text-2xl font-semibold text-white">
                  {step.title}
                </h3>
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
        </section>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <section className="rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-blue-ncs">
          Client Onboarding
        </p>
        <h2 className="mt-2 text-3xl font-semibold text-white">
          Let&apos;s get to know your business.
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-text-secondary">
          This one-time setup gives us everything we need to do great work for
          you — your goals, your tools, the people involved, and how you like to
          work. Five short steps, and you can save anytime; no need to finish in
          one sitting.
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-text-secondary">
          Stuck on what to write? Click{" "}
          <span className="text-blue-ncs">✦ Refine</span> to{" "}
          <span className="text-blue-ncs">✦ Polish</span> a rough draft, or{" "}
          <span className="text-blue-ncs">↗ Expand</span> to walk through a few
          quick multiple-choice questions and have your answer drafted for you.
          The more we know now, the smoother every step that follows will be.
        </p>
      </section>

      <OnboardingChecklist
        organizationId={membership.organization_id}
        status={onboardingStatus}
        initialStep={
          (onboarding as { current_step?: string } | null)?.current_step ||
          onboardingSteps[0].key
        }
        initialCompletedSteps={
          (onboarding as { completed_steps?: string[] } | null)
            ?.completed_steps || []
        }
        initialResponses={responseMap}
      />
    </main>
  );
}
