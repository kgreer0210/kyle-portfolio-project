import { NextRequest, NextResponse } from "next/server";
import { requireApiAdminUser } from "@/lib/api-auth";
import { jsonError, jsonFromAuthError } from "@/lib/api-response";
import { onboardingSteps } from "@/lib/crm";
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
    const body = (await request.json()) as { status?: string };
    const status = body.status;

    if (status !== "completed" && status !== "reopened") {
      return jsonError("Invalid onboarding status.");
    }

    const adminSupabase = createAdminSupabaseClient();
    const { data: onboarding, error: lookupError } = await adminSupabase
      .from("client_onboardings")
      .select("organization_id")
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (lookupError) {
      console.error("Onboarding lookup error:", lookupError);
      return jsonError("Unable to load onboarding.", 500);
    }

    if (!onboarding) {
      return jsonError("Onboarding record not found.", 404);
    }

    const now = new Date().toISOString();
    const updatePayload =
      status === "completed"
        ? {
            status,
            reviewed_at: now,
          }
        : {
            status,
            reviewed_at: now,
            current_step: onboardingSteps[0]?.key || "account-setup",
          };

    const { error: updateError } = await adminSupabase
      .from("client_onboardings")
      .update(updatePayload)
      .eq("organization_id", organizationId);

    if (updateError) {
      console.error("Onboarding update error:", updateError);
      return jsonError("Unable to update onboarding.", 500);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Admin onboarding status route error:", error);
    return jsonError("An unexpected error occurred while updating onboarding.", 500);
  }
}
