import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAdminUser } from "@/lib/api-auth";
import { jsonError, jsonFromAuthError } from "@/lib/api-response";
import { inviteClientToOrganization } from "@/lib/crm-invites";
import { sendInviteSentNotification } from "@/lib/crm-notifications";
import {
  ProjectCreateError,
  createProjectFromDraft,
  type CreateProjectTarget,
} from "@/lib/projectCreate";
import {
  draftClientSchema,
  firstIssueMessage,
  projectDraftSchema,
} from "@/lib/projectDraft";
import {
  buildProjectSowPath,
  isPendingSowPath,
  sowBucket,
} from "@/lib/sowStorage";
import { createAdminSupabaseClient } from "@/lib/supabase";

const createBodySchema = z
  .object({
    organizationId: z.uuid().optional(),
    client: draftClientSchema.optional(),
    draft: projectDraftSchema,
    invite: z.boolean().default(false),
    sow: z
      .object({
        storagePath: z.string().refine(isPendingSowPath, "Invalid SOW upload path."),
        fileName: z.string().trim().min(1).max(255),
        // Raw model output from /api/admin/sow/extract, kept for reference.
        extraction: z
          .record(z.string(), z.unknown())
          .refine((value) => JSON.stringify(value).length <= 500_000, "Extraction is too large."),
        model: z.string().max(100).nullable(),
      })
      .optional(),
  })
  .refine((body) => Boolean(body.organizationId) !== Boolean(body.client), {
    message: "Choose an existing client or enter new client details.",
  });

export async function POST(request: NextRequest) {
  try {
    await requireApiAdminUser();
  } catch (error) {
    return jsonFromAuthError(error) || jsonError("Unauthorized", 401);
  }

  let body: z.infer<typeof createBodySchema>;
  try {
    const parsed = createBodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return jsonError(firstIssueMessage(parsed.error));
    }
    body = parsed.data;
  } catch {
    return jsonError("Invalid JSON");
  }

  const target: CreateProjectTarget = body.client
    ? { kind: "new", client: body.client }
    : { kind: "existing", organizationId: body.organizationId as string };

  const adminSupabase = createAdminSupabaseClient();

  try {
    const result = await createProjectFromDraft(
      adminSupabase,
      target,
      body.draft,
      body.sow,
    );

    if (body.sow) {
      // Move the file out of pending/ so the cleanup job never touches it.
      // A failed move is not fatal: project_sow still points at the file.
      const finalPath = buildProjectSowPath(
        result.organizationId,
        result.projectId,
        body.sow.storagePath,
      );
      const { error: moveError } = await adminSupabase.storage
        .from(sowBucket)
        .move(body.sow.storagePath, finalPath);

      if (moveError) {
        console.error("SOW move error:", moveError);
      } else {
        await adminSupabase
          .from("project_sow")
          .update({ storage_path: finalPath })
          .eq("project_id", result.projectId);
      }
    }

    let invited = false;
    let inviteError: string | null = null;

    if (body.invite && body.client) {
      try {
        await inviteClientToOrganization({
          organizationId: result.organizationId,
          email: body.client.contact_email,
          fullName: body.client.contact_name,
          organizationName: result.organizationName,
        });
        invited = true;
        await sendInviteSentNotification({
          organizationName: result.organizationName,
          clientEmail: body.client.contact_email,
          clientType: "new",
        }).catch((notificationError) => {
          console.error("Invite notification error:", notificationError);
        });
      } catch (error) {
        console.error("Project create invite error:", error);
        inviteError =
          error instanceof Error ? error.message : "Unable to send the invite.";
      }
    }

    return NextResponse.json(
      {
        organizationId: result.organizationId,
        projectId: result.projectId,
        invited,
        inviteError,
      },
      { status: inviteError ? 207 : 201 },
    );
  } catch (error) {
    if (error instanceof ProjectCreateError) {
      return jsonError(error.message, error.status);
    }
    console.error("Project create route error:", error);
    return jsonError("An unexpected error occurred while creating the project.", 500);
  }
}
