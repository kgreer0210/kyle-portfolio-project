import { after, NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { validWebhook } from "@/lib/project-context/github";
import { contextEnabled } from "@/lib/project-context/schema";
import {
  enqueueSource,
  processContextJobs,
  sourceRowSchema,
} from "@/lib/project-context/server";
export const runtime = "nodejs";
export const maxDuration = 120;
const payloadSchema = z.object({
  action: z.string().optional(),
  ref: z.string().optional(),
  installation: z.object({ id: z.number() }).optional(),
  repository: z.object({ full_name: z.string() }).optional(),
  repositories_removed: z.array(z.object({ full_name: z.string() })).optional(),
});
export async function POST(req: NextRequest) {
  if (!contextEnabled())
    return NextResponse.json({ error: "Disabled" }, { status: 503 });
  const raw = await req.text();
  if (raw.length > 1000000)
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  if (
    !validWebhook(
      raw,
      req.headers.get("x-hub-signature-256"),
      process.env.GITHUB_CONTEXT_WEBHOOK_SECRET,
    )
  )
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  let payload;
  try {
    payload = payloadSchema.parse(JSON.parse(raw));
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const installationId = payload.installation?.id;
  if (!installationId) return NextResponse.json({ ok: true });
  const db = createAdminSupabaseClient();
  const event = req.headers.get("x-github-event");
  const { data: rows, error } = await db
    .from("project_context_sources")
    .select("*")
    .eq("kind", "github")
    .contains("config", { installation_id: installationId });
  if (error)
    return NextResponse.json({ error: "Context unavailable" }, { status: 503 });
  if (
    event === "installation" &&
    ["deleted", "suspend", "unsuspend"].includes(payload.action || "")
  ) {
    const status =
      payload.action === "deleted"
        ? "removed"
        : payload.action === "suspend"
          ? "suspended"
          : "active";
    await db
      .from("github_app_installations")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("installation_id", installationId);
    if (status !== "active")
      for (const row of rows || [])
        await db
          .from("project_context_sources")
          .update({ enabled: false, revision: row.revision + 1 })
          .eq("id", row.id);
  }
  if (event === "installation_repositories")
    for (const row of rows || [])
      if (
        payload.repositories_removed?.some(
          (r) => r.full_name.toLowerCase() === row.locator.toLowerCase(),
        )
      )
        await db
          .from("project_context_sources")
          .update({ enabled: false, revision: row.revision + 1 })
          .eq("id", row.id);
  if (event === "push")
    for (const row of rows || []) {
      const source = sourceRowSchema.parse(row);
      if (
        source.enabled &&
        source.locator.toLowerCase() ===
          payload.repository?.full_name.toLowerCase() &&
        payload.ref === `refs/heads/${source.config.branch || "main"}`
      ) {
        await enqueueSource(
          source,
          "webhook",
          req.headers.get("x-github-delivery"),
        );
      }
    }
  after(() => processContextJobs());
  return NextResponse.json({ ok: true });
}
