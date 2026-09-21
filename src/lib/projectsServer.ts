import type { SupabaseClient } from "@supabase/supabase-js";
import {
  milestoneSelectColumns,
  projectSelectColumns,
  requestSelectColumns,
  taskSelectColumns,
} from "@/lib/projects";
import type {
  Project,
  ProjectMilestone,
  ProjectRequest,
  ProjectTask,
} from "@/types/crm";

export interface ProjectBundle {
  project: Project;
  milestones: ProjectMilestone[];
  tasks: ProjectTask[];
  requests: ProjectRequest[];
}

/**
 * Load a project with its milestones, tasks, and requests. Pass the caller's
 * RLS-scoped client: for clients, row-level security hides tasks that aren't
 * client-visible and projects from other organizations.
 */
export async function loadProjectBundle(
  supabase: SupabaseClient,
  projectId: string,
): Promise<ProjectBundle | null> {
  const [
    { data: project, error: projectError },
    { data: milestones },
    { data: tasks },
    { data: requests },
  ] = await Promise.all([
    supabase
      .from("projects")
      .select(projectSelectColumns)
      .eq("id", projectId)
      .maybeSingle(),
    supabase
      .from("project_milestones")
      .select(milestoneSelectColumns)
      .eq("project_id", projectId)
      .order("position"),
    supabase
      .from("project_tasks")
      .select(taskSelectColumns)
      .eq("project_id", projectId)
      .order("position"),
    supabase
      .from("project_requests")
      .select(requestSelectColumns)
      .eq("project_id", projectId)
      .order("position"),
  ]);

  if (projectError) {
    console.error("Project load error:", projectError);
  }

  if (!project) {
    return null;
  }

  return {
    project: project as Project,
    milestones: (milestones || []) as ProjectMilestone[],
    tasks: (tasks || []) as ProjectTask[],
    requests: (requests || []) as ProjectRequest[],
  };
}

export async function listOrganizationProjects(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select(projectSelectColumns)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Project list error:", error);
  }

  return (data || []) as Project[];
}
