import Link from "next/link";
import { notFound } from "next/navigation";
import ProjectEditor from "@/components/crm/ProjectEditor";
import ProjectUpdatesPanel, {
  type ProjectUpdateItem,
} from "@/components/crm/ProjectUpdatesPanel";
import StatusBadge from "@/components/crm/StatusBadge";
import { formatDateTime } from "@/lib/crm";
import { requireAdminUser } from "@/lib/auth";
import { toDateOnly } from "@/lib/projects";
import { loadProjectBundle } from "@/lib/projectsServer";
import { createAdminSupabaseClient } from "@/lib/supabase";
import type { TicketStatus } from "@/types/crm";

interface ProjectPageProps {
  params: Promise<{
    organizationId: string;
    projectId: string;
  }>;
  searchParams: Promise<{
    inviteError?: string;
  }>;
}

export default async function AdminProjectPage({
  params,
  searchParams,
}: ProjectPageProps) {
  const { organizationId, projectId } = await params;
  const { inviteError } = await searchParams;
  const { supabase } = await requireAdminUser();

  const [bundle, { data: organization }, { data: sow }, { data: tickets }, { data: updates }] =
    await Promise.all([
      loadProjectBundle(supabase, projectId),
      supabase
        .from("organizations")
        .select("id, name")
        .eq("id", organizationId)
        .maybeSingle(),
      supabase
        .from("project_sow")
        .select("storage_path, file_name, extraction")
        .eq("project_id", projectId)
        .maybeSingle(),
      supabase
        .from("tickets")
        .select("id, title, status, last_activity_at")
        .eq("project_id", projectId)
        .order("last_activity_at", { ascending: false })
        .limit(10),
      supabase
        .from("project_updates")
        .select("id, body, sent_at")
        .eq("project_id", projectId)
        .order("sent_at", { ascending: false })
        .limit(20),
    ]);

  if (!bundle || !organization || bundle.project.organization_id !== organizationId) {
    notFound();
  }

  const sowRecord = sow as {
    storage_path: string | null;
    file_name: string | null;
    extraction: { out_of_scope?: unknown } | null;
  } | null;

  let sowFileUrl: string | null = null;
  if (sowRecord?.storage_path) {
    const { data: signed } = await createAdminSupabaseClient()
      .storage.from("sow-documents")
      .createSignedUrl(sowRecord.storage_path, 3600);
    sowFileUrl = signed?.signedUrl ?? null;
  }

  const outOfScope = Array.isArray(sowRecord?.extraction?.out_of_scope)
    ? (sowRecord.extraction.out_of_scope as unknown[]).filter(
        (line): line is string => typeof line === "string",
      )
    : [];

  const projectTickets = (tickets || []) as Array<{
    id: string;
    title: string;
    status: TicketStatus;
    last_activity_at: string;
  }>;

  return (
    <main className="space-y-6">
      <nav className="flex flex-wrap items-center gap-2 text-sm text-text-secondary">
        <Link href="/admin/clients" className="transition hover:text-white">
          Clients
        </Link>
        <span aria-hidden="true">/</span>
        <Link
          href={`/admin/clients/${organization.id}`}
          className="transition hover:text-white"
        >
          {organization.name}
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-text-primary">{bundle.project.title}</span>
      </nav>

      {inviteError ? (
        <p className="rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          The project was created, but the portal invite failed: {inviteError}
        </p>
      ) : null}

      <ProjectEditor
        project={bundle.project}
        milestones={bundle.milestones}
        tasks={bundle.tasks}
        requests={bundle.requests}
        today={toDateOnly(new Date())}
        sowFileUrl={sowFileUrl}
        sowFileName={sowRecord?.file_name ?? null}
        outOfScope={outOfScope}
      />

      <ProjectUpdatesPanel
        projectId={bundle.project.id}
        updates={(updates || []) as ProjectUpdateItem[]}
      />

      <section className="rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-6">
        <h3 className="text-xl font-semibold text-white">Tickets on this project</h3>
        {projectTickets.length === 0 ? (
          <p className="mt-4 text-sm text-text-secondary">No tickets linked yet.</p>
        ) : (
          <div className="mt-5 space-y-3">
            {projectTickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/admin/tickets/${ticket.id}`}
                className="flex flex-col gap-2 rounded-3xl border border-penn-blue bg-rich-black/40 p-4 transition hover:border-blue-ncs md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-semibold text-white">{ticket.title}</p>
                  <p className="mt-1 text-sm text-text-secondary">
                    Last activity {formatDateTime(ticket.last_activity_at)}
                  </p>
                </div>
                <StatusBadge status={ticket.status} />
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
