import { NextRequest, NextResponse } from "next/server";
import { requireApiAdminUser } from "@/lib/api-auth";
import { jsonError, jsonFromAuthError } from "@/lib/api-response";
import { firstIssueMessage } from "@/lib/projectDraft";
import {
  patchItemSchema,
  projectItemTables,
  projectItemTypes,
  toItemUpdate,
  type PatchItemInput,
  type ProjectItemType,
} from "@/lib/projectItems";
import { createAdminSupabaseClient } from "@/lib/supabase";

interface RouteParams {
  params: Promise<{
    projectId: string;
    itemId: string;
  }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await requireApiAdminUser();
  } catch (error) {
    return jsonFromAuthError(error) || jsonError("Unauthorized", 401);
  }

  const { projectId, itemId } = await params;

  let patch: PatchItemInput;
  let raw: unknown;
  try {
    raw = await request.json();
    const parsed = patchItemSchema.safeParse(raw);
    if (!parsed.success) {
      return jsonError(firstIssueMessage(parsed.error));
    }
    patch = parsed.data;
  } catch {
    return jsonError("Invalid JSON");
  }

  const update = toItemUpdate(patch, raw);
  if (Object.keys(update).length === 0) {
    return jsonError("Nothing to update.");
  }

  const adminSupabase = createAdminSupabaseClient();
  const { data, error } = await adminSupabase
    .from(projectItemTables[patch.type])
    .update(update)
    .eq("id", itemId)
    .eq("project_id", projectId)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error(`Project ${patch.type} update error:`, error);
    return jsonError(`Unable to update the ${patch.type}.`, 400);
  }

  if (!data) {
    return jsonError("Item not found.", 404);
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await requireApiAdminUser();
  } catch (error) {
    return jsonFromAuthError(error) || jsonError("Unauthorized", 401);
  }

  const { projectId, itemId } = await params;
  const type = request.nextUrl.searchParams.get("type");

  if (!type || !(projectItemTypes as readonly string[]).includes(type)) {
    return jsonError("Invalid item type.");
  }

  const adminSupabase = createAdminSupabaseClient();
  const { error } = await adminSupabase
    .from(projectItemTables[type as ProjectItemType])
    .delete()
    .eq("id", itemId)
    .eq("project_id", projectId);

  if (error) {
    console.error(`Project ${type} delete error:`, error);
    return jsonError(`Unable to delete the ${type}.`, 500);
  }

  return NextResponse.json({ ok: true });
}
