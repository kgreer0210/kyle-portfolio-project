import Link from "next/link";
import { notFound } from "next/navigation";
import ActivityTimeline from "@/components/crm/ActivityTimeline";
import OnboardingStatusBadge from "@/components/crm/OnboardingStatusBadge";
import OrgNoteDeleteButton from "@/components/crm/OrgNoteDeleteButton";
import OrgNoteForm from "@/components/crm/OrgNoteForm";
import StatusBadge from "@/components/crm/StatusBadge";
import { activeTicketStatuses, formatDateTime } from "@/lib/crm";
import { getOrganizationActivity } from "@/lib/crm-activity";
import { requireAdminUser } from "@/lib/auth";
import type { TicketStatus } from "@/types/crm";

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

  const [
    { data: organization },
    { data: members },
    { data: onboarding },
    { data: tickets },
    { count: openTicketCount },
    { count: totalTicketCount },
    { data: notes },
    activity,
  ] = await Promise.all([
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
    supabase
      .from("tickets")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .in("status", activeTicketStatuses),
    supabase
      .from("tickets")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId),
    supabase
      .from("organization_notes")
      .select("id, body, created_at, profiles:author_id(full_name, email)")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false }),
    getOrganizationActivity(organizationId),
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
    status: TicketStatus;
    created_at?: string;
  }>;
  const adminNotes = (notes || []) as Array<{
    id: string;
    body: string;
    created_at: string;
    profiles?: { full_name?: string | null; email?: string | null } | null;
  }>;
  const onboardingStatus =
    ((onboarding as { status?: string } | null)?.status as
      | "not_started"
      | "in_progress"
      | "submitted"
      | "completed"
      | "reopened"
      | "skipped_legacy"
      | undefined) || "not_started";
  const lastActivityAt = activity[0]?.occurredAt;

  return (
    <main className="space-y-8">
      <section className="rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-blue-ncs">
          Client Profile
        </p>
        <h2 className="mt-2 text-3xl font-semibold text-white">
          {organization.name}
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-3xl border border-penn-blue bg-rich-black/40 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">
              Open tickets
            </p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {openTicketCount || 0}
            </p>
          </div>
          <div className="rounded-3xl border border-penn-blue bg-rich-black/40 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">
              Total tickets
            </p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {totalTicketCount || 0}
            </p>
          </div>
          <div className="rounded-3xl border border-penn-blue bg-rich-black/40 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">
              Last activity
            </p>
            <p className="mt-2 text-sm font-semibold text-white">
              {lastActivityAt ? formatDateTime(lastActivityAt) : "None yet"}
            </p>
          </div>
          <div className="rounded-3xl border border-penn-blue bg-rich-black/40 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">
              Onboarding
            </p>
            <div className="mt-3">
              <OnboardingStatusBadge status={onboardingStatus} />
            </div>
            <Link
              href={`/admin/onboarding/${organization.id}`}
              className="mt-4 inline-flex text-sm font-medium text-blue-ncs transition hover:text-white"
            >
              Review onboarding
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-penn-blue bg-rich-black/40 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">
              Contact
            </p>
            <p className="mt-2 font-semibold text-white">
              {organization.primary_contact_name || "No contact on file"}
            </p>
            {organization.primary_contact_email ? (
              <a
                href={`mailto:${organization.primary_contact_email}`}
                className="mt-1 block text-sm text-blue-ncs transition hover:text-white"
              >
                {organization.primary_contact_email}
              </a>
            ) : null}
            {organization.website_url ? (
              <a
                href={organization.website_url}
                target="_blank"
                rel="noreferrer"
                className="mt-1 block text-sm text-text-secondary transition hover:text-white"
              >
                {organization.website_url}
              </a>
            ) : null}
            <p className="mt-2 text-xs capitalize text-text-secondary">
              {organization.client_kind} client · since{" "}
              {formatDateTime(organization.created_at)}
            </p>
          </div>
          <div className="rounded-3xl border border-penn-blue bg-rich-black/40 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">
              General notes
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-text-primary">
              {organization.notes || "No general notes."}
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
                    <StatusBadge status={ticket.status} />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-6">
          <h3 className="text-xl font-semibold text-white">Admin notes</h3>
          <p className="mt-2 text-sm text-text-secondary">
            Private to you — clients never see these.
          </p>
          <div className="mt-5">
            <OrgNoteForm organizationId={organization.id} />
          </div>
          <div className="mt-6 space-y-3">
            {adminNotes.length === 0 ? (
              <p className="text-sm text-text-secondary">No notes yet.</p>
            ) : (
              adminNotes.map((note) => (
                <div
                  key={note.id}
                  className="rounded-3xl border border-penn-blue bg-rich-black/40 p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-xs text-text-secondary">
                      {formatDateTime(note.created_at)}
                    </p>
                    <OrgNoteDeleteButton
                      organizationId={organization.id}
                      noteId={note.id}
                    />
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-text-primary">
                    {note.body}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-6">
          <h3 className="text-xl font-semibold text-white">Activity timeline</h3>
          <p className="mt-2 text-sm text-text-secondary">
            Tickets, replies, status changes, onboarding milestones, and notes.
          </p>
          <div className="mt-5">
            <ActivityTimeline events={activity} />
          </div>
        </div>
      </section>
    </main>
  );
}
