import Link from "next/link";
import OnboardingChecklist from "@/components/crm/OnboardingChecklist";
import { onboardingSteps } from "@/lib/crm";
import { requireClientUser, getPrimaryOrganizationMembership } from "@/lib/auth";

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
      const entry = row as { step_key: string; response: Record<string, string> };
      return [entry.step_key, entry.response || {}];
    }),
  );

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
            can start using tickets right away without repeating a full discovery
            flow.
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

  return (
    <main className="space-y-6">
      <section className="rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-blue-ncs">
          Client Onboarding
        </p>
        <h2 className="mt-2 text-3xl font-semibold text-white">
          Tell us what we need to support you well.
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-text-secondary">
          Save your progress as you go. Once the final step is submitted, the
          onboarding package moves into review and we can start from a much
          cleaner shared context.
        </p>
      </section>

      <OnboardingChecklist
        organizationId={membership.organization_id}
        status={
          ((onboarding as { status?: string } | null)?.status as
            | "not_started"
            | "in_progress"
            | "submitted"
            | "completed"
            | "reopened"
            | "skipped_legacy") || "not_started"
        }
        initialStep={
          (onboarding as { current_step?: string } | null)?.current_step ||
          onboardingSteps[0].key
        }
        initialCompletedSteps={
          (onboarding as { completed_steps?: string[] } | null)?.completed_steps || []
        }
        initialResponses={responseMap}
      />
    </main>
  );
}
