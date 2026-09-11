import { NextRequest, NextResponse } from "next/server";
import { requireApiAdminUser } from "@/lib/api-auth";
import { jsonError, jsonFromAuthError } from "@/lib/api-response";
import { V2_STEP_KEYS } from "@/lib/onboardingFlow";
import {
  isProjectType,
  isRequestedItemStatus,
  requestedItemDefinitions,
} from "@/lib/onboardingPresets";
import { createAdminSupabaseClient } from "@/lib/supabase";
import type {
  CustomRequestedItem,
  OnboardingKnownInfo,
  OnboardingPlan,
  RequestedItemSelection,
} from "@/types/crm";

interface RouteParams {
  params: Promise<{ organizationId: string }>;
}

const MAX_TEXT = 2000;

function cleanText(value: unknown, max = MAX_TEXT): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function slugKey(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

function parsePlan(raw: unknown): { plan: OnboardingPlan; error?: string } {
  const source =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};

  const deliverables = Array.isArray(source.deliverables)
    ? source.deliverables
        .map((entry) => cleanText(entry, 300))
        .filter(Boolean)
        .slice(0, 20)
    : [];

  const requestedItems: Record<string, RequestedItemSelection> = {};
  const rawItems =
    source.requestedItems && typeof source.requestedItems === "object"
      ? (source.requestedItems as Record<string, unknown>)
      : {};

  const customItems: CustomRequestedItem[] = [];
  const rawCustom = Array.isArray(source.customItems) ? source.customItems : [];
  const customKeys = new Set<string>();
  for (const entry of rawCustom.slice(0, 10)) {
    if (!entry || typeof entry !== "object") continue;
    const item = entry as Record<string, unknown>;
    const label = cleanText(item.label, 120);
    if (!label) continue;
    const key = `custom_${slugKey(cleanText(item.key, 60) || label) || customItems.length}`;
    if (customKeys.has(key) || requestedItemDefinitions[key]) continue;
    customKeys.add(key);
    customItems.push({
      key,
      label,
      question: cleanText(item.question, 300) || label,
    });
  }

  for (const [key, value] of Object.entries(rawItems)) {
    if (!requestedItemDefinitions[key] && !customKeys.has(key)) continue;
    if (!value || typeof value !== "object") continue;
    const selection = value as Record<string, unknown>;
    if (!isRequestedItemStatus(selection.status)) {
      return { plan: { deliverables, requestedItems, customItems, knownInfo: {} }, error: `Invalid status for ${key}.` };
    }
    const note = cleanText(selection.note, 500);
    requestedItems[key] = note ? { status: selection.status, note } : { status: selection.status };
  }

  const rawKnown =
    source.knownInfo && typeof source.knownInfo === "object"
      ? (source.knownInfo as Record<string, unknown>)
      : {};
  const knownInfo: OnboardingKnownInfo = {};
  const knownKeys: Array<keyof OnboardingKnownInfo> = [
    "existingUrl",
    "domainName",
    "supportCoverage",
    "contactPhone",
    "contactTitle",
  ];
  for (const key of knownKeys) {
    const value = cleanText(rawKnown[key], 500);
    if (value) knownInfo[key] = value;
  }

  return { plan: { deliverables, requestedItems, customItems, knownInfo } };
}

/** Saves (creates or updates) the admin-prepared onboarding plan. */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await requireApiAdminUser();
  } catch (error) {
    return jsonFromAuthError(error) || jsonError("Unauthorized", 401);
  }

  try {
    const { organizationId } = await params;
    const body = (await request.json()) as {
      projectType?: unknown;
      projectSummary?: unknown;
      plan?: unknown;
      websiteUrl?: unknown;
    };

    if (!isProjectType(body.projectType)) {
      return jsonError("Choose a project type.");
    }

    const { plan, error: planError } = parsePlan(body.plan);
    if (planError) {
      return jsonError(planError);
    }
    const projectSummary = cleanText(body.projectSummary, 4000) || null;

    const adminSupabase = createAdminSupabaseClient();
    const [{ data: onboarding, error: lookupError }, { count: responseCount }] =
      await Promise.all([
        adminSupabase
          .from("client_onboardings")
          .select("status, mode, flow_version")
          .eq("organization_id", organizationId)
          .maybeSingle(),
        adminSupabase
          .from("onboarding_step_responses")
          .select("*", { count: "exact", head: true })
          .eq("organization_id", organizationId),
      ]);

    if (lookupError) {
      console.error("Onboarding lookup error:", lookupError);
      return jsonError("Unable to load onboarding.", 500);
    }

    if (!onboarding) {
      return jsonError("Onboarding record not found.", 404);
    }

    if (onboarding.mode === "skipped_legacy") {
      return jsonError("Legacy clients skip onboarding, so there is nothing to prepare.");
    }

    if (onboarding.status === "submitted" || onboarding.status === "completed") {
      return jsonError("This onboarding has already been submitted. Reopen it before changing the plan.");
    }

    const isLegacyInProgress =
      onboarding.flow_version !== "v2" &&
      (onboarding.status !== "not_started" || (responseCount ?? 0) > 0);

    if (isLegacyInProgress) {
      return jsonError(
        "This client already started the original questionnaire. Their existing answers are kept; a prepared plan can't replace them.",
      );
    }

    const now = new Date().toISOString();
    const { error: updateError } = await adminSupabase
      .from("client_onboardings")
      .update({
        flow_version: "v2",
        project_type: body.projectType,
        project_summary: projectSummary,
        plan,
        plan_updated_at: now,
        current_step:
          onboarding.flow_version === "v2" ? undefined : V2_STEP_KEYS.contact,
      })
      .eq("organization_id", organizationId);

    if (updateError) {
      console.error("Onboarding plan save error:", updateError);
      return jsonError("Unable to save the onboarding plan.", 500);
    }

    const websiteUrl = cleanText(body.websiteUrl, 500);
    if (typeof body.websiteUrl === "string") {
      await adminSupabase
        .from("organizations")
        .update({ website_url: websiteUrl || null })
        .eq("id", organizationId);
    }

    return NextResponse.json({ ok: true, plan, planUpdatedAt: now });
  } catch (error) {
    console.error("Admin onboarding plan route error:", error);
    return jsonError("An unexpected error occurred while saving the plan.", 500);
  }
}
