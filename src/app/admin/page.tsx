import Link from "next/link";
import { requireAdminUser } from "@/lib/auth";

export default async function AdminDashboardPage() {
  const { supabase } = await requireAdminUser();

  const [{ count: clientCount }, { count: ticketCount }, { count: onboardingCount }] =
    await Promise.all([
      supabase.from("organizations").select("*", { count: "exact", head: true }),
      supabase
        .from("tickets")
        .select("*", { count: "exact", head: true })
        .in("status", ["new", "open", "waiting_on_client", "in_progress"]),
      supabase
        .from("client_onboardings")
        .select("*", { count: "exact", head: true })
        .in("status", ["submitted", "reopened", "in_progress"]),
    ]);

  return (
    <main className="space-y-8">
      <section className="grid gap-5 md:grid-cols-3">
        <div className="rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-6">
          <p className="text-sm text-text-secondary">Client organizations</p>
          <p className="mt-3 text-4xl font-semibold text-white">
            {clientCount || 0}
          </p>
        </div>
        <Link
          href="/admin/tickets"
          className="rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-6 transition hover:border-blue-ncs"
        >
          <p className="text-sm text-text-secondary">Active tickets</p>
          <p className="mt-3 text-4xl font-semibold text-white">
            {ticketCount || 0}
          </p>
          <p className="mt-4 text-sm font-medium text-blue-ncs">Open ticket queue</p>
        </Link>
        <Link
          href="/admin/onboarding"
          className="rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-6 transition hover:border-blue-ncs"
        >
          <p className="text-sm text-text-secondary">Onboarding needing review</p>
          <p className="mt-3 text-4xl font-semibold text-white">
            {onboardingCount || 0}
          </p>
          <p className="mt-4 text-sm font-medium text-blue-ncs">Review onboarding</p>
        </Link>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-6">
          <h2 className="text-xl font-semibold text-white">Fast actions</h2>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/admin/clients/new"
              className="rounded-full bg-blue-ncs px-5 py-3 font-semibold text-white transition hover:bg-lapis-lazuli"
            >
              Add client
            </Link>
            <Link
              href="/admin/clients"
              className="rounded-full border border-penn-blue px-5 py-3 font-semibold text-text-primary transition hover:border-blue-ncs"
            >
              View clients
            </Link>
            <Link
              href="/admin/tickets"
              className="rounded-full border border-penn-blue px-5 py-3 font-semibold text-text-primary transition hover:border-blue-ncs"
            >
              View tickets
            </Link>
            <Link
              href="/admin/onboarding"
              className="rounded-full border border-penn-blue px-5 py-3 font-semibold text-text-primary transition hover:border-blue-ncs"
            >
              Review onboarding
            </Link>
          </div>
        </div>

        <div className="rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-6">
          <h2 className="text-xl font-semibold text-white">Admin inbox</h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-text-secondary">
            Use the ticket queue for active client requests and the onboarding
            queue for submitted discovery packages that need a decision.
          </p>
        </div>
      </section>
    </main>
  );
}
