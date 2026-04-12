import Link from "next/link";
import { requireClientUser, getPrimaryOrganizationMembership } from "@/lib/auth";

function getOnboardingStatusLabel(status?: string | null) {
  switch (status) {
    case "in_progress":
      return "In progress";
    case "submitted":
      return "Submitted";
    case "completed":
      return "Completed";
    case "reopened":
      return "Needs updates";
    case "skipped_legacy":
      return "Skipped";
    default:
      return "Not started";
  }
}

export default async function PortalDashboardPage() {
  const { supabase, user } = await requireClientUser();
  const membership = await getPrimaryOrganizationMembership(user.id, supabase);

  if (!membership?.organizations) {
    return (
      <main className="rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-8">
        <h2 className="text-2xl font-semibold text-white">No organization found</h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-text-secondary">
          Your account is active, but it is not yet tied to a client organization.
          Reach out to Kyle to finish the setup.
        </p>
      </main>
    );
  }

  const [{ data: onboarding }, { count: openTicketCount }] = await Promise.all([
    supabase
      .from("client_onboardings")
      .select("status, mode")
      .eq("organization_id", membership.organization_id)
      .maybeSingle(),
    supabase
      .from("tickets")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", membership.organization_id)
      .in("status", ["new", "open", "waiting_on_client", "in_progress"]),
  ]);
  const onboardingStatus = (onboarding as { status?: string } | null)?.status;
  const onboardingMode = (onboarding as { mode?: string } | null)?.mode;
  const showFinishOnboardingCard =
    onboardingStatus === "not_started" ||
    onboardingStatus === "in_progress" ||
    onboardingStatus === "reopened" ||
    !onboardingStatus;
  const showUnderReviewCard = onboardingStatus === "submitted";
  const showCompletedCard = onboardingStatus === "completed";
  const shouldHideOnboardingCard = onboardingMode === "skipped_legacy";

  return (
    <main className="space-y-8">
      <section className="rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-blue-ncs">
          Your Organization
        </p>
        <h2 className="mt-2 text-3xl font-semibold text-white">
          {membership.organizations.name}
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-text-secondary">
          Use this portal to finish onboarding, track requests, and keep support
          history in one place.
        </p>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        <div className="rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-6">
          <p className="text-sm text-text-secondary">Onboarding status</p>
          <p className="mt-3 text-2xl font-semibold text-white">
            {getOnboardingStatusLabel(onboardingStatus)}
          </p>
        </div>
        <div className="rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-6">
          <p className="text-sm text-text-secondary">Open tickets</p>
          <p className="mt-3 text-2xl font-semibold text-white">
            {openTicketCount || 0}
          </p>
        </div>
        <div className="rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-6">
          <p className="text-sm text-text-secondary">Portal access</p>
          <p className="mt-3 text-2xl font-semibold text-white">Active</p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        {!shouldHideOnboardingCard ? (
          showFinishOnboardingCard ? (
            <Link
              href="/portal/onboarding"
              className="rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-6 transition hover:border-blue-ncs"
            >
              <h3 className="text-xl font-semibold text-white">Finish onboarding</h3>
              <p className="mt-3 text-sm leading-7 text-text-secondary">
                Complete the guided checklist so project context, access needs, and
                communication preferences are documented in one place.
              </p>
            </Link>
          ) : showUnderReviewCard ? (
            <div className="rounded-[2rem] border border-amber-500/30 bg-oxford-blue/80 p-6">
              <h3 className="text-xl font-semibold text-white">Onboarding under review</h3>
              <p className="mt-3 text-sm leading-7 text-text-secondary">
                Your onboarding package has been submitted. We&apos;re reviewing it now,
                and you can still use the portal for tickets while we wrap that up.
              </p>
              <Link
                href="/portal/onboarding"
                className="mt-5 inline-flex text-sm font-medium text-blue-ncs transition hover:text-white"
              >
                View submitted onboarding
              </Link>
            </div>
          ) : showCompletedCard ? (
            <div className="rounded-[2rem] border border-emerald-500/30 bg-oxford-blue/80 p-6">
              <h3 className="text-xl font-semibold text-white">Onboarding complete</h3>
              <p className="mt-3 text-sm leading-7 text-text-secondary">
                Your onboarding is fully complete, and your submitted details remain
                available in the portal for reference.
              </p>
              <Link
                href="/portal/onboarding"
                className="mt-5 inline-flex text-sm font-medium text-blue-ncs transition hover:text-white"
              >
                Review onboarding details
              </Link>
            </div>
          ) : null
        ) : null}

        <Link
          href="/portal/tickets"
          className="rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-6 transition hover:border-blue-ncs"
        >
          <h3 className="text-xl font-semibold text-white">Open a ticket</h3>
          <p className="mt-3 text-sm leading-7 text-text-secondary">
            Submit a request, report an issue, or follow an existing thread with
            attachments and status updates.
          </p>
        </Link>
      </section>
    </main>
  );
}
