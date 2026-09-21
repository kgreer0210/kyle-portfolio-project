import type { SupabaseClient } from "@supabase/supabase-js";
import { pickUniqueSlug, slugify } from "@/lib/crm";
import {
  buildProjectRows,
  type DraftClient,
  type ProjectDraft,
} from "@/lib/projectDraft";

export interface SowAttachment {
  storagePath: string;
  fileName: string;
  extraction: unknown;
  model: string | null;
}

export type CreateProjectTarget =
  | { kind: "existing"; organizationId: string }
  | { kind: "new"; client: DraftClient };

export interface CreateProjectResult {
  organizationId: string;
  organizationName: string;
  projectId: string;
  createdOrganization: boolean;
}

export class ProjectCreateError extends Error {
  constructor(
    message: string,
    readonly status = 500,
  ) {
    super(message);
    this.name = "ProjectCreateError";
  }
}

async function resolveUniqueSlug(supabase: SupabaseClient, name: string) {
  const base = slugify(name) || "client";
  const { data, error } = await supabase
    .from("organizations")
    .select("slug")
    .like("slug", `${base}%`);

  if (error) {
    throw new ProjectCreateError("Unable to check existing client slugs.");
  }

  return pickUniqueSlug(
    base,
    (data || []).map((row) => (row as { slug: string }).slug),
  );
}

/**
 * Create (optionally) the organization, then the project and its milestones,
 * tasks, requests, and SOW record. Supabase has no multi-statement
 * transactions over REST, so a failure after the first insert deletes what
 * was created and lets FK cascades remove the children.
 *
 * Pass the service-role client.
 */
export async function createProjectFromDraft(
  supabase: SupabaseClient,
  target: CreateProjectTarget,
  draft: ProjectDraft,
  sow?: SowAttachment,
): Promise<CreateProjectResult> {
  let organizationId: string;
  let organizationName: string;
  let createdOrganization = false;

  if (target.kind === "existing") {
    const { data: organization, error } = await supabase
      .from("organizations")
      .select("id, name")
      .eq("id", target.organizationId)
      .maybeSingle();

    if (error) {
      throw new ProjectCreateError("Unable to load the client.");
    }
    if (!organization) {
      throw new ProjectCreateError("Client not found.", 404);
    }

    organizationId = organization.id as string;
    organizationName = organization.name as string;
  } else {
    const slug = await resolveUniqueSlug(supabase, target.client.organization_name);
    const { data: organization, error } = await supabase
      .from("organizations")
      .insert({
        name: target.client.organization_name,
        slug,
        client_kind: "new",
        primary_contact_name: target.client.contact_name,
        primary_contact_email: target.client.contact_email,
        website_url: target.client.website_url,
        billing_type: target.client.billing_type,
        notes: target.client.notes,
      })
      .select("id, name")
      .single();

    if (error || !organization) {
      console.error("Organization creation error:", error);
      throw new ProjectCreateError(
        error?.message || "Unable to create the client organization.",
        400,
      );
    }

    organizationId = organization.id as string;
    organizationName = organization.name as string;
    createdOrganization = true;
  }

  let projectId: string | null = null;

  async function rollback() {
    if (createdOrganization) {
      await supabase.from("organizations").delete().eq("id", organizationId);
    } else if (projectId) {
      await supabase.from("projects").delete().eq("id", projectId);
    }
  }

  try {
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert({
        organization_id: organizationId,
        title: draft.project.title,
        summary: draft.project.summary,
        status: "active",
        start_date: draft.project.start_date,
        target_date: draft.project.target_date,
        contract_amount: draft.project.contract_amount,
        deposit_percent: draft.project.deposit_percent,
      })
      .select("id")
      .single();

    if (projectError || !project) {
      throw new ProjectCreateError(
        projectError?.message || "Unable to create the project.",
      );
    }

    projectId = project.id as string;
    const rows = buildProjectRows(projectId, organizationId, draft);

    const steps: Array<[string, Record<string, unknown>[] | Record<string, unknown>]> = [
      ["project_milestones", rows.milestones],
      ["project_tasks", rows.tasks],
      ["project_requests", rows.requests],
    ];

    if (sow) {
      steps.push([
        "project_sow",
        {
          project_id: projectId,
          organization_id: organizationId,
          storage_path: sow.storagePath,
          file_name: sow.fileName,
          extraction: { ...(sow.extraction as object), out_of_scope: draft.out_of_scope },
          model: sow.model,
        },
      ]);
    } else if (draft.out_of_scope.length > 0) {
      steps.push([
        "project_sow",
        {
          project_id: projectId,
          organization_id: organizationId,
          storage_path: null,
          file_name: null,
          extraction: { out_of_scope: draft.out_of_scope },
          model: null,
        },
      ]);
    }

    for (const [table, values] of steps) {
      if (Array.isArray(values) && values.length === 0) continue;
      const { error } = await supabase.from(table).insert(values);
      if (error) {
        console.error(`Project create: ${table} insert error:`, error);
        throw new ProjectCreateError(`Unable to save ${table.replace("project_", "")}.`);
      }
    }
  } catch (error) {
    await rollback().catch((rollbackError) => {
      console.error("Project create rollback error:", rollbackError);
    });
    throw error instanceof ProjectCreateError
      ? error
      : new ProjectCreateError("Unable to create the project.");
  }

  return { organizationId, organizationName, projectId, createdOrganization };
}
