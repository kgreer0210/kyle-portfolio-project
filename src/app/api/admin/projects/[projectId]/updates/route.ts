import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAdminUser } from "@/lib/api-auth";
import { jsonError, jsonFromAuthError } from "@/lib/api-response";
import { sendProjectUpdateEmail } from "@/lib/crm-notifications";
import { createAdminSupabaseClient } from "@/lib/supabase";

interface RouteParams {
  params: Promise<{
    projectId: string;
  }>;
}

const bodySchema = z.object({
  body: z.string().trim().min(1, "Write the update first.").max(5000),
});

/** Send a project update: save it (portal shows it) and email org members. */
export async function POST(request: NextRequest, { params }: RouteParams) {
  let context;
  try {
    context = await requireApiAdminUser();
  } catch (error) {
    return jsonFromAuthError(error) || jsonError("Unauthorized", 401);
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message || "Invalid request body");
  }

  const { projectId } = await params;
  const supabase = createAdminSupabaseClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id, organization_id, title")
    .eq("id", projectId)
    .maybeSingle();

  if (!project) {
    return jsonError("Project not found.", 404);
  }

  const { error } = await supabase.from("project_updates").insert({
    project_id: project.id,
    organization_id: project.organization_id,
    body: parsed.data.body,
    created_by: context.user.id,
  });

  if (error) {
    console.error("Project update insert error:", error);
    return jsonError("Unable to save the update.", 500);
  }

  const recipients = await sendProjectUpdateEmail({
    organizationId: project.organization_id as string,
    projectTitle: project.title as string,
    body: parsed.data.body,
  }).catch((sendError) => {
    console.error("Project update email error:", sendError);
    return -1;
  });

  return NextResponse.json(
    { ok: true, emailed: recipients > 0, recipients: Math.max(recipients, 0) },
    { status: 201 },
  );
}
