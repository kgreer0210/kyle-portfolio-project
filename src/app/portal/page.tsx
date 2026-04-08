import Link from "next/link";
import { requireClientUser, getPrimaryOrganizationMembership } from "@/lib/auth";

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
            {(onboarding as { status?: string } | null)?.status || "Not started"}
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
