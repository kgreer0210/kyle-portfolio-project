import { NextRequest, NextResponse } from "next/server";
import { requireApiAdminUser } from "@/lib/api-auth";
import { jsonError, jsonFromAuthError } from "@/lib/api-response";
import { isBillingType } from "@/lib/crm";
import { createAdminSupabaseClient } from "@/lib/supabase";

interface RouteParams {
  params: Promise<{
    organizationId: string;
  }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await requireApiAdminUser();
  } catch (error) {
    return jsonFromAuthError(error) || jsonError("Unauthorized", 401);
  }

  try {
    const { organizationId } = await params;
    const body = (await request.json()) as {
      billing_type?: string | null;
    };

    const updates: { billing_type?: string | null } = {};

    if (body.billing_type !== undefined) {
      if (body.billing_type === null || body.billing_type === "") {
        updates.billing_type = null;
      } else if (isBillingType(body.billing_type)) {
        updates.billing_type = body.billing_type;
      } else {
        return jsonError("Invalid billing type.");
      }
    }

    if (Object.keys(updates).length === 0) {
      return jsonError("Nothing to update.");
    }

    const adminSupabase = createAdminSupabaseClient();
    const { data: organization, error: lookupError } = await adminSupabase
      .from("organizations")
      .select("id")
      .eq("id", organizationId)
      .maybeSingle();

    if (lookupError) {
      console.error("Organization lookup error:", lookupError);
      return jsonError("Unable to load the organization.", 500);
    }

    if (!organization) {
      return jsonError("Organization not found.", 404);
    }

    const { error: updateError } = await adminSupabase
      .from("organizations")
      .update(updates)
      .eq("id", organization.id);

    if (updateError) {
      console.error("Organization update error:", updateError);
      return jsonError("Unable to update the organization.", 500);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Organization route error:", error);
    return jsonError(
      "An unexpected error occurred while updating the organization.",
      500,
    );
  }
}
