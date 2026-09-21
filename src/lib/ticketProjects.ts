import type { SupabaseClient } from "@supabase/supabase-js";
import type { TicketProjectScope } from "@/lib/ticketTriage";

/**
 * Attach a new ticket to a project only when there is no ambiguity: exactly
 * one active project. Otherwise leave it for the admin to set.
 */
export function pickAutoProjectId(
  projects: Array<{ id: string; status: string }>,
): string | null {
  const active = projects.filter((project) => project.status === "active");
  return active.length === 1 ? active[0].id : null;
}

export function toProjectScope(args: {
  project: { title: string; summary: string | null };
  milestones: Array<{ title: string }>;
  extraction: unknown;
}): TicketProjectScope {
  const rawOutOfScope = (args.extraction as { out_of_scope?: unknown } | null)?.out_of_scope;
  return {
    title: args.project.title,
    summary: args.project.summary,
    milestones: args.milestones.map((milestone) => milestone.title),
    outOfScope: Array.isArray(rawOutOfScope)
      ? rawOutOfScope.filter((line): line is string => typeof line === "string")
      : [],
  };
}

/** Load scope for triage. Pass the service-role client. */
export async function loadProjectScope(
  supabase: SupabaseClient,
  projectId: string,
): Promise<TicketProjectScope | null> {
  const [{ data: project }, { data: milestones }, { data: sow }] = await Promise.all([
    supabase.from("projects").select("title, summary").eq("id", projectId).maybeSingle(),
    supabase
      .from("project_milestones")
      .select("title")
      .eq("project_id", projectId)
      .order("position"),
    supabase.from("project_sow").select("extraction").eq("project_id", projectId).maybeSingle(),
  ]);

  if (!project) {
    return null;
  }

  return toProjectScope({
    project: project as { title: string; summary: string | null },
    milestones: (milestones || []) as Array<{ title: string }>,
    extraction: (sow as { extraction?: unknown } | null)?.extraction ?? null,
  });
}
