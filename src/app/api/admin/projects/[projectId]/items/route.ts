import { NextRequest, NextResponse } from "next/server";
import { requireApiAdminUser } from "@/lib/api-auth";
import { jsonError, jsonFromAuthError } from "@/lib/api-response";
import { firstIssueMessage } from "@/lib/projectDraft";
import {
  createItemSchema,
  projectItemTables,
  toItemInsert,
  type CreateItemInput,
} from "@/lib/projectItems";
import { createAdminSupabaseClient } from "@/lib/supabase";

interface RouteParams {
  params: Promise<{
    projectId: string;
  }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await requireApiAdminUser();
  } catch (error) {
    return jsonFromAuthError(error) || jsonError("Unauthorized", 401);
  }

  const { projectId } = await params;

  let input: CreateItemInput;
  try {
    const parsed = createItemSchema.safeParse(await request.json());
    if (!parsed.success) {
      return jsonError(firstIssueMessage(parsed.error));
    }
    input = parsed.data;
  } catch {
    return jsonError("Invalid JSON");
  }

  const adminSupabase = createAdminSupabaseClient();
  const { data: project, error: projectError } = await adminSupabase
    .from("projects")
    .select("id, organization_id")
    .eq("id", projectId)
    .maybeSingle();

  if (projectError) {
    console.error("Project lookup error:", projectError);
    return jsonError("Unable to load the project.", 500);
  }

  if (!project) {
    return jsonError("Project not found.", 404);
  }

  const table = projectItemTables[input.type];
  let positionQuery = adminSupabase
    .from(table)
    .select("position")
    .eq("project_id", projectId)
    .order("position", { ascending: false })
    .limit(1);

  if (input.type === "task") {
    positionQuery = input.milestone_id
      ? positionQuery.eq("milestone_id", input.milestone_id)
      : positionQuery.is("milestone_id", null);
  }

  const { data: last } = await positionQuery.maybeSingle();
  const nextPosition = ((last as { position?: number } | null)?.position ?? -1) + 1;

  // The composite FK on project_tasks rejects a milestone from another project.
  const { data: item, error } = await adminSupabase
    .from(table)
    .insert(
      toItemInsert(input, project.id as string, project.organization_id as string, nextPosition),
    )
    .select("id")
    .single();

  if (error || !item) {
    console.error(`Project ${input.type} insert error:`, error);
    return jsonError(`Unable to add the ${input.type}.`, 400);
  }

  return NextResponse.json({ id: item.id }, { status: 201 });
}
