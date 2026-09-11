import { NextRequest, NextResponse } from "next/server";
import { requireApiClientUser } from "@/lib/api-auth";
import { jsonError, jsonFromAuthError } from "@/lib/api-response";
import {
  computeCompletedSteps,
  sanitizeAnswers,
} from "@/lib/onboardingFlow";
import {
  loadOnboardingContext,
  saveOnboardingAnswers,
} from "@/lib/onboardingServer";
import { createAdminSupabaseClient } from "@/lib/supabase";
import type { OnboardingAnswers } from "@/types/crm";

interface SaveBody {
  organizationId?: string;
  /** New shape: answers for every step the client has touched. */
  responses?: unknown;
  /** Legacy single-step shape, still accepted. */
  stepKey?: string;
  response?: unknown;
  currentStep?: string;
}

function collectIncoming(body: SaveBody): unknown {
  if (body.responses && typeof body.responses === "object") {
    return body.responses;
  }
  if (body.stepKey && body.response && typeof body.response === "object") {
    return { [body.stepKey]: body.response };
  }
  return {};
}

export async function POST(request: NextRequest) {
  let context;

  try {
    context = await requireApiClientUser();
  } catch (error) {
    return jsonFromAuthError(error) || jsonError("Unauthorized", 401);
  }

  try {
    const body = (await request.json()) as SaveBody;
    const organizationId = context.membership.organization_id;

    if (!body.organizationId || body.organizationId !== organizationId) {
      return jsonError("You do not have access to this onboarding record.", 403);
    }

    const onboardingContext = await loadOnboardingContext(organizationId);
    if (!onboardingContext) {
      return jsonError("Unable to load onboarding.", 500);
    }

    const { onboarding, steps, savedAnswers } = onboardingContext;

    if (
      onboarding?.status === "submitted" ||
      onboarding?.status === "completed" ||
      onboarding?.mode === "skipped_legacy"
    ) {
      return jsonError("This onboarding flow is locked.", 400);
    }

    if (!onboardingContext.isReadyForClient) {
      return jsonError("Your onboarding isn't ready yet. Kyle is still preparing it.", 400);
    }

    const validKeys = new Set(steps.map((step) => step.key));
    const currentStep = body.currentStep?.trim() || body.stepKey?.trim() || "";
    if (currentStep && !validKeys.has(currentStep)) {
      return jsonError("Invalid onboarding step.");
    }

    const sanitized = sanitizeAnswers(steps, collectIncoming(body), savedAnswers);
    const saveError = await saveOnboardingAnswers(organizationId, sanitized);
    if (saveError) {
      return jsonError(saveError, 500);
    }

    const mergedAnswers: OnboardingAnswers = { ...savedAnswers, ...sanitized };
    const completedSteps = computeCompletedSteps(steps, mergedAnswers);
    const nextStatus =
      onboarding?.status === "reopened" ? "reopened" : "in_progress";

    const adminSupabase = createAdminSupabaseClient();
    const { error: updateError } = await adminSupabase
      .from("client_onboardings")
      .upsert(
        {
          organization_id: organizationId,
          mode: onboarding?.mode || "standard",
          status: nextStatus,
          current_step: currentStep || onboarding?.current_step || steps[0].key,
          completed_steps: completedSteps,
          started_at: onboarding?.started_at || new Date().toISOString(),
        },
        { onConflict: "organization_id" },
      );

    if (updateError) {
      console.error("Onboarding update error:", updateError);
      return jsonError("Unable to update onboarding progress.", 500);
    }

    return NextResponse.json({
      ok: true,
      completedSteps,
      savedSteps: Object.keys(sanitized),
    });
  } catch (error) {
    console.error("Onboarding save route error:", error);
    return jsonError("An unexpected error occurred while saving onboarding.", 500);
  }
}
