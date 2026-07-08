import { NextRequest, NextResponse } from "next/server";
import { requireApiAdminUser } from "@/lib/api-auth";
import { jsonError, jsonFromAuthError } from "@/lib/api-response";
import { createAdminSupabaseClient } from "@/lib/supabase";

interface RouteParams {
  params: Promise<{
    organizationId: string;
  }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  let context;

  try {
    context = await requireApiAdminUser();
  } catch (error) {
    return jsonFromAuthError(error) || jsonError("Unauthorized", 401);
  }

  try {
    const { organizationId } = await params;
    const payload = (await request.json()) as { body?: string };
    const body = (payload.body || "").trim();

    if (!body) {
      return jsonError("A note is required.");
    }

    if (body.length > 5000) {
      return jsonError("Notes must be 5000 characters or fewer.");
    }

    const adminSupabase = createAdminSupabaseClient();
    const { data: organization, error: organizationError } = await adminSupabase
      .from("organizations")
      .select("id")
      .eq("id", organizationId)
      .maybeSingle();

    if (organizationError) {
      console.error("Organization lookup error:", organizationError);
      return jsonError("Unable to load the organization.", 500);
    }

    if (!organization) {
      return jsonError("Organization not found.", 404);
    }

    const { error: insertError } = await adminSupabase
      .from("organization_notes")
      .insert({
        organization_id: organizationId,
        author_id: context.user.id,
        body,
      });

    if (insertError) {
      console.error("Organization note insert error:", insertError);
      return jsonError("Unable to save the note.", 500);
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Organization note route error:", error);
    return jsonError("An unexpected error occurred while saving the note.", 500);
  }
}
