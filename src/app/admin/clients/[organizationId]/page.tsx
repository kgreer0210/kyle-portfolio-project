import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDateTime } from "@/lib/crm";
import { requireAdminUser } from "@/lib/auth";

interface ClientDetailPageProps {
  params: Promise<{
    organizationId: string;
  }>;
}

export default async function AdminClientDetailPage({
  params,
}: ClientDetailPageProps) {
  const { organizationId } = await params;
  const { supabase } = await requireAdminUser();

  const [{ data: organization }, { data: members }, { data: onboarding }, { data: tickets }] =
    await Promise.all([
      supabase
        .from("organizations")
        .select("*")
        .eq("id", organizationId)
        .maybeSingle(),
      supabase
        .from("organization_members")
        .select("role, profiles(full_name, email, status)")
        .eq("organization_id", organizationId),
      supabase
        .from("client_onboardings")
        .select("*")
        .eq("organization_id", organizationId)
        .maybeSingle(),
      supabase
        .from("tickets")
        .select("id, title, status, created_at")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

  if (!organization) {
    notFound();
  }

  const organizationMembers = (members || []) as Array<{
    role: string;
    profiles?: { full_name?: string | null; email?: string | null; status?: string | null } | null;
  }>;
  const recentTickets = (tickets || []) as Array<{
    id: string;
    title: string;
    status: string;
    created_at?: string;
  }>;

  return (
    <main className="space-y-8">
      <section className="rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-blue-ncs">
          Client Detail
        </p>
        <h2 className="mt-2 text-3xl font-semibold text-white">
          {organization.name}
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-penn-blue bg-rich-black/40 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">
              Client type
            </p>
            <p className="mt-2 text-lg font-semibold text-white capitalize">
              {organization.client_kind}
            </p>
          </div>
          <div className="rounded-3xl border border-penn-blue bg-rich-black/40 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">
              Onboarding
            </p>
            <p className="mt-2 text-lg font-semibold text-white">
              {(onboarding as { status?: string } | null)?.status || "Not started"}
            </p>
          </div>
          <div className="rounded-3xl border border-penn-blue bg-rich-black/40 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">
              Created
            </p>
            <p className="mt-2 text-lg font-semibold text-white">
              {formatDateTime(organization.created_at)}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-6">
          <h3 className="text-xl font-semibold text-white">Members</h3>
          <div className="mt-5 space-y-4">
            {organizationMembers.map((member, index) => (
              <div
                key={`${member.profiles?.email || "member"}-${index}`}
                className="rounded-3xl border border-penn-blue bg-rich-black/40 p-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-white">
                      {member.profiles?.full_name || member.profiles?.email || "Unknown"}
                    </p>
                    <p className="mt-1 text-sm text-text-secondary">
                      {member.profiles?.email || "No email"}
                    </p>
                  </div>
                  <div className="text-right text-xs uppercase tracking-[0.18em] text-text-secondary">
                    <div>{member.role}</div>
                    <div className="mt-2">{member.profiles?.status || "active"}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-6">
          <h3 className="text-xl font-semibold text-white">Recent tickets</h3>
          <div className="mt-5 space-y-3">
            {recentTickets.length === 0 ? (
              <p className="text-sm text-text-secondary">
                No tickets yet for this client.
              </p>
            ) : (
              recentTickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/admin/tickets/${ticket.id}`}
                  className="block rounded-3xl border border-penn-blue bg-rich-black/40 p-4 transition hover:border-blue-ncs"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-white">{ticket.title}</p>
                      <p className="mt-1 text-sm text-text-secondary">
                        {formatDateTime(ticket.created_at)}
                      </p>
                    </div>
                    <span className="text-xs uppercase tracking-[0.18em] text-text-secondary">
                      {ticket.status}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
