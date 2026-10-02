import { after, NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAdminUser } from "@/lib/api-auth";
import { jsonError, jsonFromAuthError } from "@/lib/api-response";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { validatePublicUrl } from "@/lib/project-context/web";
import { contextEnabled, sourceSchema } from "@/lib/project-context/schema";
import {
  githubConfigured,
  verifyRepository,
} from "@/lib/project-context/github";
import {
  enqueueSource,
  processContextJobs,
  sourceRowSchema,
} from "@/lib/project-context/server";
export const runtime = "nodejs";
export const maxDuration = 120;
type Params = { params: Promise<{ projectId: string }> };
async function projectContext(params: Params) {
  await requireApiAdminUser();
  if (!contextEnabled()) throw new Error("DISABLED");
  const { projectId } = await params.params;
  const db = createAdminSupabaseClient();
  const { data } = await db
    .from("projects")
    .select("id,organization_id")
    .eq("id", projectId)
    .maybeSingle();
  if (!data) throw new Error("NOT_FOUND");
  return { db, project: data };
}
function failure(error: unknown) {
  return (
    jsonFromAuthError(error) ||
    jsonError(
      error instanceof Error && error.message === "DISABLED"
        ? "Project context is disabled."
        : error instanceof Error && error.message === "NOT_FOUND"
          ? "Project not found."
          : "Unable to update context. Check the source configuration.",
      error instanceof Error && error.message === "NOT_FOUND" ? 404 : 400,
    )
  );
}
export async function GET(_req: NextRequest, params: Params) {
  try {
    const { db, project } = await projectContext(params);
    const { data: sources, error } = await db
      .from("project_context_sources")
      .select("*")
      .eq("project_id", project.id)
      .order("created_at");
    if (error)
      return jsonError(
        "Context tables are not available. Apply the context migrations to your test database.",
        503,
      );
    const { data: runs } = await db
      .from("project_context_sync_runs")
      .select(
        "id,source_id,status,last_error,coverage,source_version,created_at",
      )
      .eq("project_id", project.id)
      .order("created_at", { ascending: false })
      .limit(100);
    const activeIds = (sources || []).flatMap((s) =>
      s.active_run_id ? [s.active_run_id] : [],
    );
    const { data: entries } = activeIds.length
      ? await db
          .from("project_context_entries")
          .select("id,source_id,title,content,locator,audience,observed_at")
          .in("run_id", activeIds)
      : { data: [] };
    return NextResponse.json({
      sources: sources || [],
      runs: runs || [],
      entries: entries || [],
      githubConfigured: githubConfigured(),
    });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(req: NextRequest, params: Params) {
  try {
    const { db, project } = await projectContext(params);
    const parsed = sourceSchema.safeParse(await req.json());
    if (!parsed.success)
      return jsonError(parsed.error.issues[0]?.message || "Invalid source.");
    const source = parsed.data;
    if (source.kind === "website") validatePublicUrl(source.locator);
    if (source.kind === "github") {
      if (!githubConfigured())
        return jsonError("Configure the read-only GitHub App first.", 503);
      await verifyRepository(source.config.installation_id, source.locator);
      const { error } = await db.from("github_app_installations").upsert({
        installation_id: source.config.installation_id,
        account_login: source.locator.split("/")[0],
        status: "active",
      });
      if (error) throw error;
    }
    const { data, error } = await db
      .from("project_context_sources")
      .insert({
        ...source,
        project_id: project.id,
        organization_id: project.organization_id,
      })
      .select("*")
      .single();
    if (error) throw error;
    await enqueueSource(sourceRowSchema.parse(data));
    after(() => processContextJobs());
    return NextResponse.json({ id: data.id }, { status: 201 });
  } catch (e) {
    return failure(e);
  }
}
export async function PATCH(req: NextRequest, params: Params) {
  try {
    const { db, project } = await projectContext(params);
    const body = z
      .object({
        id: z.uuid(),
        action: z.enum(["refresh", "toggle", "edit"]),
        enabled: z.boolean().optional(),
        source: sourceSchema.optional(),
      })
      .safeParse(await req.json());
    if (!body.success) return jsonError("Invalid source action.");
    const { data } = await db
      .from("project_context_sources")
      .select("*")
      .eq("id", body.data.id)
      .eq("project_id", project.id)
      .single();
    if (!data) return jsonError("Source not found.", 404);
    let source = sourceRowSchema.parse(data);
    if (body.data.action === "toggle" || body.data.action === "edit") {
      if (
        body.data.action === "edit" &&
        (!body.data.source ||
          body.data.source.kind !== "manual" ||
          source.kind !== "manual")
      )
        return jsonError(
          "Only workflow notes can be edited. Reconnect other sources to change their location.",
        );
      const { data: updated, error } = await db
        .from("project_context_sources")
        .update({
          ...(body.data.action === "edit"
            ? body.data.source
            : { enabled: body.data.enabled ?? !source.enabled }),
          revision: source.revision + 1,
          active_run_id: null,
        })
        .eq("id", source.id)
        .eq("revision", source.revision)
        .select("*")
        .single();
      if (error) return jsonError("Source changed. Reload and try again.", 409);
      source = sourceRowSchema.parse(updated);
      await db
        .from("project_context_sync_runs")
        .update({
          status: "failed",
          last_error: "Source configuration changed.",
        })
        .eq("source_id", source.id)
        .in("status", ["queued", "running"]);
    }
    if (source.enabled) {
      await enqueueSource(source);
      after(() => processContextJobs());
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
export async function DELETE(req: NextRequest, params: Params) {
  try {
    const { db, project } = await projectContext(params);
    const id = z.uuid().safeParse(req.nextUrl.searchParams.get("id"));
    if (!id.success) return jsonError("Invalid source.");
    const { error } = await db
      .from("project_context_sources")
      .delete()
      .eq("id", id.data)
      .eq("project_id", project.id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
