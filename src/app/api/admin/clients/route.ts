import { NextRequest, NextResponse } from "next/server";
import { requireApiAdminUser } from "@/lib/api-auth";
import { jsonError, jsonFromAuthError } from "@/lib/api-response";
import { normalizeEmail, onboardingSteps, slugify } from "@/lib/crm";
import { inviteClientToOrganization } from "@/lib/crm-invites";
import { sendInviteSentNotification } from "@/lib/crm-notifications";
import { createAdminSupabaseClient } from "@/lib/supabase";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Creates a client organization.
 *
 * New clients are created WITHOUT a portal invitation by default: the invite
 * goes out from "Prepare onboarding" once the project-specific onboarding is
 * ready, so the client never lands on an empty or generic questionnaire. Pass
 * `sendInviteNow: true` to keep the old invite-immediately behavior. Existing
 * (legacy) clients are always invited immediately since they skip onboarding.
 */
export async function POST(request: NextRequest) {
  try {
    await requireApiAdminUser();
  } catch (error) {
    return jsonFromAuthError(error) || jsonError("Unauthorized", 401);
  }

  try {
    const body = (await request.json()) as {
      organizationName?: string;
      slug?: string;
      primaryContactName?: string;
      primaryContactEmail?: string;
      websiteUrl?: string;
      notes?: string;
      clientType?: "new" | "existing";
      sendInviteNow?: boolean;
    };

    const organizationName = body.organizationName?.trim() || "";
    const primaryContactName = body.primaryContactName?.trim() || "";
    const primaryContactEmail = normalizeEmail(body.primaryContactEmail || "");
    const websiteUrl = body.websiteUrl?.trim() || null;
    const notes = body.notes?.trim() || null;
    const clientType = body.clientType === "existing" ? "existing" : "new";
    const slug = slugify(body.slug?.trim() || organizationName);
    const sendInviteNow = clientType === "existing" ? true : body.sendInviteNow === true;

    if (!organizationName || !primaryContactName || !primaryContactEmail) {
      return jsonError("Organization name, contact name, and contact email are required.");
    }

    if (!isValidEmail(primaryContactEmail)) {
      return jsonError("Primary contact email is invalid.");
    }

    if (!slug) {
      return jsonError("A valid slug is required.");
    }

    const adminSupabase = createAdminSupabaseClient();
    const { data: organization, error: organizationError } = await adminSupabase
      .from("organizations")
      .insert({
        name: organizationName,
        slug,
        client_kind: clientType === "existing" ? "legacy" : "new",
        primary_contact_name: primaryContactName,
        primary_contact_email: primaryContactEmail,
        website_url: websiteUrl,
        notes,
      })
      .select("id, name")
      .single();

    if (organizationError || !organization) {
      console.error("Organization creation error:", organizationError);
      return jsonError(
        organizationError?.message || "Unable to create the client organization.",
        400,
      );
    }

    const onboardingMode = clientType === "existing" ? "skipped_legacy" : "standard";
    const onboardingStatus = clientType === "existing" ? "skipped_legacy" : "not_started";

    const { error: onboardingError } = await adminSupabase
      .from("client_onboardings")
      .insert({
        organization_id: organization.id,
        mode: onboardingMode,
        status: onboardingStatus,
        flow_version: "v1",
        current_step:
          clientType === "existing"
            ? onboardingSteps[onboardingSteps.length - 1]?.key || "review-and-submit"
            : onboardingSteps[0]?.key || "account-setup",
        started_at: clientType === "existing" ? new Date().toISOString() : null,
      });

    if (onboardingError) {
      console.error("Onboarding creation error:", onboardingError);
      return jsonError(
        onboardingError.message || "Unable to initialize onboarding for this client.",
        400,
      );
    }

    let invited = false;

    if (sendInviteNow) {
      try {
        await inviteClientToOrganization({
          organizationId: organization.id,
          email: primaryContactEmail,
          fullName: primaryContactName,
          organizationName: organization.name,
        });
        invited = true;
      } catch (inviteError) {
        console.error("CRM invite error:", inviteError);
        return NextResponse.json(
          {
            organizationId: organization.id,
            invited: false,
            error:
              inviteError instanceof Error
                ? `Client created, but the invite failed: ${inviteError.message}`
                : "Client created, but the invite failed.",
          },
          { status: 207 },
        );
      }

      await sendInviteSentNotification({
        organizationName: organization.name,
        clientEmail: primaryContactEmail,
        clientType,
      }).catch((notificationError) => {
        console.error("Invite notification error:", notificationError);
      });
    }

    return NextResponse.json(
      { organizationId: organization.id, invited },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create client route error:", error);
    return jsonError("An unexpected error occurred while creating the client.", 500);
  }
}
