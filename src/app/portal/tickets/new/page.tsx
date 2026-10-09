import Link from "next/link";
import NewTicketForm from "@/components/crm/NewTicketForm";
import {
  requireClientUser,
  getPrimaryOrganizationMembership,
} from "@/lib/auth";
import { firstParam } from "@/lib/searchParams";

export default async function NewSupportTicketPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string | string[] }>;
}) {
  const { supabase, user } = await requireClientUser();
  const membership = await getPrimaryOrganizationMembership(user.id, supabase);
  if (!membership?.organizations)
    return (
      <main className="client-panel p-6">
        Your account is not connected to an organization yet. Contact Kyle for
        help.
      </main>
    );

  // Only show or attach a project the client can see in their own organization.
  const requestedProjectId = firstParam((await searchParams).projectId);
  const { data: project } = requestedProjectId
    ? await supabase
        .from("projects")
        .select("id, title")
        .eq("id", requestedProjectId)
        .eq("organization_id", membership.organization_id)
        .maybeSingle<{ id: string; title: string }>()
    : { data: null };

  return (
    <main className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/portal/tickets"
        className="inline-flex text-sm text-text-secondary hover:text-white"
      >
        ← Your support tickets
      </Link>
      <div>
        <h1 className="text-3xl font-semibold text-white">How can we help?</h1>
        <p className="mt-2 text-sm leading-6 text-text-secondary">
          Tell us what you need. The assistant can help you describe it, and
          Kyle will follow up in your ticket.
        </p>
      </div>
      <section className="client-panel p-5 sm:p-7">
        {project ? (
          <p className="mb-5 text-sm text-text-secondary">
            For project <span className="font-medium text-white">{project.title}</span>
          </p>
        ) : null}
        <NewTicketForm projectId={project?.id} />
      </section>
    </main>
  );
}
