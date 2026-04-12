import { NextRequest, NextResponse } from "next/server";
import { requireApiClientUser } from "@/lib/api-auth";
import { jsonError, jsonFromAuthError } from "@/lib/api-response";
import { onboardingSteps } from "@/lib/crm";
import { createAdminSupabaseClient } from "@/lib/supabase";

function sanitizeStepResponse(
  stepKey: string,
  value: unknown,
): Record<string, string> {
  const step = onboardingSteps.find((entry) => entry.key === stepKey);

  if (!step || typeof value !== "object" || value === null || Array.isArray(value)) {
    return {};
  }

  const source = value as Record<string, unknown>;
  return Object.fromEntries(
    step.fields.map((field) => {
      const fieldValue = source[field.key];
      return [
        field.key,
        typeof fieldValue === "string" ? fieldValue.trim().slice(0, 5000) : "",
      ];
    }),
  );
}

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
      stepKey?: string;
      response?: unknown;
      currentStep?: string;
      completedSteps?: string[];
    };

    if (!body.organizationId || body.organizationId !== context.membership.organization_id) {
      return jsonError("You do not have access to this onboarding record.", 403);
    }

    const stepKey = body.stepKey?.trim() || "";
    const currentStep = body.currentStep?.trim() || stepKey;
    const validKeys = new Set(onboardingSteps.map((step) => step.key));

    if (!validKeys.has(stepKey) || !validKeys.has(currentStep)) {
      return jsonError("Invalid onboarding step.");
    }

    const adminSupabase = createAdminSupabaseClient();
    const { data: onboarding, error: onboardingLookupError } = await adminSupabase
      .from("client_onboardings")
      .select("status, mode, started_at")
      .eq("organization_id", context.membership.organization_id)
      .maybeSingle();

    if (onboardingLookupError) {
      console.error("Onboarding lookup error:", onboardingLookupError);
      return jsonError("Unable to load onboarding.", 500);
    }

    if (
      onboarding?.status === "submitted" ||
      onboarding?.status === "completed" ||
      onboarding?.mode === "skipped_legacy"
    ) {
      return jsonError("This onboarding flow is locked.", 400);
    }

    const completedSteps = Array.from(
      new Set(
        (body.completedSteps || []).filter((entry) => validKeys.has(entry)).concat(stepKey),
      ),
    );
    const sanitizedResponse = sanitizeStepResponse(stepKey, body.response);

    const { error: responseError } = await adminSupabase
      .from("onboarding_step_responses")
      .upsert(
        {
          organization_id: context.membership.organization_id,
          step_key: stepKey,
          response: sanitizedResponse,
        },
        { onConflict: "organization_id,step_key" },
      );

    if (responseError) {
      console.error("Onboarding response save error:", responseError);
      return jsonError("Unable to save the onboarding step.", 500);
    }

    const { error: updateError } = await adminSupabase
      .from("client_onboardings")
      .upsert(
        {
          organization_id: context.membership.organization_id,
          mode: onboarding?.mode || "standard",
          status: "in_progress",
          current_step: currentStep,
          completed_steps: completedSteps,
          started_at: onboarding?.started_at || new Date().toISOString(),
        },
        { onConflict: "organization_id" },
      );

    if (updateError) {
      console.error("Onboarding update error:", updateError);
      return jsonError("Unable to update onboarding progress.", 500);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Onboarding save route error:", error);
    return jsonError("An unexpected error occurred while saving onboarding.", 500);
  }
}
