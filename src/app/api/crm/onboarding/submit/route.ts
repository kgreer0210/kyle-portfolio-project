import { NextRequest, NextResponse } from "next/server";
import { requireApiClientUser } from "@/lib/api-auth";
import { jsonError, jsonFromAuthError } from "@/lib/api-response";
import { sendOnboardingSubmittedNotification } from "@/lib/crm-notifications";
import {
  computeCompletedSteps,
  sanitizeAnswers,
  validateSubmission,
} from "@/lib/onboardingFlow";
import {
  loadOnboardingContext,
  saveOnboardingAnswers,
} from "@/lib/onboardingServer";
import { createAdminSupabaseClient } from "@/lib/supabase";
import type { OnboardingAnswers } from "@/types/crm";

/**
 * Saves every answer the client sends and submits in one request, so nothing
 * typed on an earlier step can be lost between "save" and "submit". Submission
 * marks the onboarding `submitted`; it never marks a project ready — that stays
 * an admin decision on the review page.
 */
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
      responses?: unknown;
    };
    const organizationId = context.membership.organization_id;

    if (!body.organizationId || body.organizationId !== organizationId) {
      return jsonError("You do not have access to this onboarding record.", 403);
    }

    const onboardingContext = await loadOnboardingContext(organizationId);
    if (!onboardingContext) {
      return jsonError("Unable to load onboarding.", 500);
    }

    const { onboarding, steps, savedAnswers } = onboardingContext;

    if (onboarding?.mode === "skipped_legacy") {
      return jsonError("Legacy clients do not need onboarding submission.", 400);
    }

    if (onboarding?.status === "submitted" || onboarding?.status === "completed") {
      return jsonError("This onboarding has already been submitted.", 400);
    }

    if (!onboardingContext.isReadyForClient) {
      return jsonError("Your onboarding isn't ready yet. Kyle is still preparing it.", 400);
    }

    const sanitized = sanitizeAnswers(steps, body.responses ?? {}, savedAnswers);
    const saveError = await saveOnboardingAnswers(organizationId, sanitized);
    if (saveError) {
      return jsonError(saveError, 500);
    }

    const mergedAnswers: OnboardingAnswers = { ...savedAnswers, ...sanitized };
    const missing = validateSubmission(steps, mergedAnswers);

    if (missing.length > 0) {
      return NextResponse.json(
        {
          error: "A few required answers are still missing.",
          missing,
        },
        { status: 400 },
      );
    }

    const completedSteps = computeCompletedSteps(steps, mergedAnswers);
    const lastStep = steps[steps.length - 1]?.key || "review";

    const adminSupabase = createAdminSupabaseClient();
    const { error: updateError } = await adminSupabase
      .from("client_onboardings")
      .update({
        status: "submitted",
        current_step: lastStep,
        completed_steps: completedSteps,
        submitted_at: new Date().toISOString(),
        started_at: onboarding?.started_at || new Date().toISOString(),
      })
      .eq("organization_id", organizationId);

    if (updateError) {
      console.error("Onboarding submit error:", updateError);
      return jsonError("Unable to submit onboarding.", 500);
    }

    await sendOnboardingSubmittedNotification({
      organizationId,
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
