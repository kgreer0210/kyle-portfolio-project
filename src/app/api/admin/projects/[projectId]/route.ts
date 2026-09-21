import { NextRequest, NextResponse } from "next/server";
import { requireApiAdminUser } from "@/lib/api-auth";
import { jsonError, jsonFromAuthError } from "@/lib/api-response";
import { firstIssueMessage } from "@/lib/projectDraft";
import { onlyProvided, projectPatchSchema } from "@/lib/projectItems";
import { createAdminSupabaseClient } from "@/lib/supabase";

interface RouteParams {
  params: Promise<{
    projectId: string;
  }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await requireApiAdminUser();
  } catch (error) {
    return jsonFromAuthError(error) || jsonError("Unauthorized", 401);
  }

  const { projectId } = await params;

  let updates: Record<string, unknown>;
  try {
    const raw: unknown = await request.json();
    const parsed = projectPatchSchema.safeParse(raw);
    if (!parsed.success) {
      return jsonError(firstIssueMessage(parsed.error));
    }
    updates = Object.fromEntries(
      Object.entries(onlyProvided(parsed.data, raw)).filter(
        ([, value]) => value !== undefined,
      ),
    );
  } catch {
    return jsonError("Invalid JSON");
  }

  if (Object.keys(updates).length === 0) {
    return jsonError("Nothing to update.");
  }

  const adminSupabase = createAdminSupabaseClient();
  const { data, error } = await adminSupabase
    .from("projects")
    .update(updates)
    .eq("id", projectId)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Project update error:", error);
    return jsonError("Unable to update the project.", 500);
  }

  if (!data) {
    return jsonError("Project not found.", 404);
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    await requireApiAdminUser();
  } catch (error) {
    return jsonFromAuthError(error) || jsonError("Unauthorized", 401);
  }

  const { projectId } = await params;
  const adminSupabase = createAdminSupabaseClient();
  const { data: sow } = await adminSupabase
    .from("project_sow")
    .select("storage_path")
    .eq("project_id", projectId)
    .maybeSingle();

  const { error } = await adminSupabase.from("projects").delete().eq("id", projectId);

  if (error) {
    console.error("Project delete error:", error);
    return jsonError("Unable to delete the project.", 500);
  }

  if (sow?.storage_path) {
    await adminSupabase.storage
      .from("sow-documents")
      .remove([sow.storage_path as string])
      .catch((storageError: unknown) => {
        console.error("SOW file delete error:", storageError);
      });
  }

  return NextResponse.json({ ok: true });
}
