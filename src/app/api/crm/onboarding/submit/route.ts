import { NextRequest, NextResponse } from "next/server";
import { requireApiClientUser } from "@/lib/api-auth";
import { jsonError, jsonFromAuthError } from "@/lib/api-response";
import { onboardingSteps } from "@/lib/crm";
import { sendOnboardingSubmittedNotification } from "@/lib/crm-notifications";
import { createAdminSupabaseClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  let context;

  try {
    context = await requireApiClientUser();
  } catch (error) {
    return jsonFromAuthError(error) || jsonError("Unauthorized", 401);
  }

  try {
    const body = (await request.json()) as {
      organizationId?: string;
      completedSteps?: string[];
    };

    if (!body.organizationId || body.organizationId !== context.membership.organization_id) {
      return jsonError("You do not have access to this onboarding record.", 403);
    }

    const validStepKeys = new Set(onboardingSteps.map((step) => step.key));
    const completedSteps = Array.from(
      new Set((body.completedSteps || []).filter((step) => validStepKeys.has(step))),
    );

    const adminSupabase = createAdminSupabaseClient();
    const { data: onboarding, error: onboardingLookupError } = await adminSupabase
      .from("client_onboardings")
      .select("mode, status, started_at")
      .eq("organization_id", context.membership.organization_id)
      .maybeSingle();

    if (onboardingLookupError) {
      console.error("Onboarding lookup error:", onboardingLookupError);
      return jsonError("Unable to load onboarding.", 500);
    }

    if (onboarding?.mode === "skipped_legacy") {
      return jsonError("Legacy clients do not need onboarding submission.", 400);
    }

    if (completedSteps.length === 0) {
      return jsonError("Complete at least one onboarding step before submitting.");
    }

    const { error: updateError } = await adminSupabase
      .from("client_onboardings")
      .update({
        status: "submitted",
        current_step: onboardingSteps[onboardingSteps.length - 1]?.key || "review-and-submit",
        completed_steps: completedSteps,
        submitted_at: new Date().toISOString(),
        started_at: onboarding?.started_at || new Date().toISOString(),
      })
      .eq("organization_id", context.membership.organization_id);

    if (updateError) {
      console.error("Onboarding submit error:", updateError);
      return jsonError("Unable to submit onboarding.", 500);
    }

    await sendOnboardingSubmittedNotification({
      organizationId: context.membership.organization_id,
      organizationName: context.membership.organizations?.name || "Unknown organization",
      submittedByEmail: context.profile.email,
    }).catch((notificationError) => {
      console.error("Onboarding notification error:", notificationError);
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Onboarding submit route error:", error);
    return jsonError("An unexpected error occurred while submitting onboarding.", 500);
  }
}
