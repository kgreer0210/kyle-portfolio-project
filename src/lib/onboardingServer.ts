import { createAdminSupabaseClient } from "@/lib/supabase";
import {
  buildOnboardingSteps,
  normalizePlan,
  type KnownClientInfo,
} from "@/lib/onboardingFlow";
import type {
  OnboardingAnswers,
  OnboardingRecord,
  OnboardingStepDefinition,
} from "@/types/crm";

/**
 * Server-only helper: loads everything needed to render or validate an
 * organization's onboarding — the onboarding row (with plan columns), the
 * organization's known contact details, the generated step definitions, and
 * the saved answers. Uses the service-role client; callers must already have
 * authorized access to the organization.
 */

export interface OnboardingOrganizationInfo {
  id: string;
  name: string;
  primary_contact_name: string | null;
  primary_contact_email: string | null;
  website_url: string | null;
  client_kind: string | null;
  billing_type: string | null;
}

export interface OnboardingContext {
  organization: OnboardingOrganizationInfo;
  onboarding: OnboardingRecord | null;
  steps: OnboardingStepDefinition[];
  savedAnswers: OnboardingAnswers;
  known: KnownClientInfo;
  /** True once the admin has prepared and sent a v2 plan, or for legacy v1 rows that already have activity. */
  isReadyForClient: boolean;
}

export const onboardingSelectColumns =
  "status, mode, flow_version, project_type, project_summary, plan, plan_updated_at, plan_sent_at, current_step, completed_steps, started_at, submitted_at, reviewed_at";

export function toOnboardingRecord(row: unknown): OnboardingRecord | null {
  if (!row || typeof row !== "object") return null;
  const raw = row as Record<string, unknown>;
  return {
    status: (raw.status as OnboardingRecord["status"]) ?? "not_started",
    mode: (raw.mode as OnboardingRecord["mode"]) ?? "standard",
    flow_version: (raw.flow_version as OnboardingRecord["flow_version"]) ?? "v1",
    project_type: (raw.project_type as OnboardingRecord["project_type"]) ?? null,
    project_summary: (raw.project_summary as string | null) ?? null,
    plan: raw.plan ? normalizePlan(raw.plan) : null,
    plan_updated_at: (raw.plan_updated_at as string | null) ?? null,
    plan_sent_at: (raw.plan_sent_at as string | null) ?? null,
    current_step: (raw.current_step as string | null) ?? null,
    completed_steps: (raw.completed_steps as string[] | null) ?? [],
    started_at: (raw.started_at as string | null) ?? null,
    submitted_at: (raw.submitted_at as string | null) ?? null,
    reviewed_at: (raw.reviewed_at as string | null) ?? null,
  };
}

export function toAnswerMap(
  rows: Array<{ step_key: string; response: unknown }> | null | undefined,
): OnboardingAnswers {
  const map: OnboardingAnswers = {};
  for (const row of rows ?? []) {
    const response = row.response;
    if (response && typeof response === "object" && !Array.isArray(response)) {
      const clean: Record<string, string> = {};
      for (const [key, value] of Object.entries(response as Record<string, unknown>)) {
        if (typeof value === "string") clean[key] = value;
      }
      map[row.step_key] = clean;
    }
  }
  return map;
}

export function isOnboardingReadyForClient(
  onboarding: OnboardingRecord | null,
  savedAnswers: OnboardingAnswers,
): boolean {
  if (!onboarding) return false;
  if (onboarding.mode === "skipped_legacy") return true;
  if (onboarding.flow_version === "v2") {
    return Boolean(onboarding.plan_sent_at);
  }
  // Legacy v1: only usable if the client already has activity. Fresh
  // not_started rows wait for an admin-prepared plan.
  return onboarding.status !== "not_started" || Object.keys(savedAnswers).length > 0;
}

export function buildStepsForRecord(
  onboarding: OnboardingRecord | null,
  known: KnownClientInfo,
): OnboardingStepDefinition[] {
  return buildOnboardingSteps({
    flowVersion: onboarding?.flow_version ?? "v1",
    projectType: onboarding?.project_type ?? null,
    plan: onboarding?.plan ?? null,
    projectSummary: onboarding?.project_summary ?? null,
    known,
  });
}

export async function loadOnboardingContext(
  organizationId: string,
): Promise<OnboardingContext | null> {
  const supabase = createAdminSupabaseClient();

  const [{ data: organization, error: orgError }, { data: onboardingRow }, { data: responses }] =
    await Promise.all([
      supabase
        .from("organizations")
        .select(
          "id, name, primary_contact_name, primary_contact_email, website_url, client_kind, billing_type",
        )
        .eq("id", organizationId)
        .maybeSingle(),
      supabase
        .from("client_onboardings")
        .select(onboardingSelectColumns)
        .eq("organization_id", organizationId)
        .maybeSingle(),
      supabase
        .from("onboarding_step_responses")
        .select("step_key, response")
        .eq("organization_id", organizationId),
    ]);

  if (orgError || !organization) {
    return null;
  }

  const onboarding = toOnboardingRecord(onboardingRow);
  const savedAnswers = toAnswerMap(
    responses as Array<{ step_key: string; response: unknown }> | null,
  );
  const known: KnownClientInfo = {
    organizationName: organization.name,
    contactName: organization.primary_contact_name,
    contactEmail: organization.primary_contact_email,
    websiteUrl: organization.website_url,
  };

  return {
    organization: organization as OnboardingOrganizationInfo,
    onboarding,
    steps: buildStepsForRecord(onboarding, known),
    savedAnswers,
    known,
    isReadyForClient: isOnboardingReadyForClient(onboarding, savedAnswers),
  };
}

/** Upserts one row per step. Returns an error message on failure. */
export async function saveOnboardingAnswers(
  organizationId: string,
  answers: OnboardingAnswers,
): Promise<string | null> {
  const supabase = createAdminSupabaseClient();
  const rows = Object.entries(answers).map(([stepKey, response]) => ({
    organization_id: organizationId,
    step_key: stepKey,
    response,
  }));

  if (rows.length === 0) return null;

  const { error } = await supabase
    .from("onboarding_step_responses")
    .upsert(rows, { onConflict: "organization_id,step_key" });

  if (error) {
    console.error("Onboarding response save error:", error);
    return "Unable to save your answers.";
  }
  return null;
}
