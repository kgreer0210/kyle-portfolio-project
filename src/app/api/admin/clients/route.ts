import { NextRequest, NextResponse } from "next/server";
import { requireApiAdminUser } from "@/lib/api-auth";
import { jsonError, jsonFromAuthError } from "@/lib/api-response";
import {
  getSiteUrl,
  normalizeEmail,
  onboardingSteps,
  slugify,
} from "@/lib/crm";
import { sendInviteSentNotification } from "@/lib/crm-notifications";
import { createAdminSupabaseClient } from "@/lib/supabase";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

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
      notes?: string;
      clientType?: "new" | "existing";
    };

    const organizationName = body.organizationName?.trim() || "";
    const primaryContactName = body.primaryContactName?.trim() || "";
    const primaryContactEmail = normalizeEmail(body.primaryContactEmail || "");
    const notes = body.notes?.trim() || null;
    const clientType = body.clientType === "existing" ? "existing" : "new";
    const slug = slugify(body.slug?.trim() || organizationName);

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
    const redirectTo = new URL("/auth/callback", getSiteUrl()).toString();
    const { data: inviteData, error: inviteError } =
      await adminSupabase.auth.admin.inviteUserByEmail(primaryContactEmail, {
        redirectTo,
        data: {
          full_name: primaryContactName,
        },
      });

    if (inviteError || !inviteData.user?.id) {
      console.error("CRM invite error:", inviteError);
      return jsonError(
        inviteError?.message || "Unable to send the client invite.",
        400,
      );
    }

    const userId = inviteData.user.id;
    const { data: organization, error: organizationError } = await adminSupabase
      .from("organizations")
      .insert({
        name: organizationName,
        slug,
        client_kind: clientType === "existing" ? "legacy" : "new",
        primary_contact_name: primaryContactName,
        primary_contact_email: primaryContactEmail,
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

    const onboardingMode =
      clientType === "existing" ? "skipped_legacy" : "standard";
    const onboardingStatus =
      clientType === "existing" ? "skipped_legacy" : "not_started";

    await adminSupabase.from("profiles").upsert(
      {
        id: userId,
        email: primaryContactEmail,
        full_name: primaryContactName,
        role: "client",
        status: "invited",
      },
      { onConflict: "id" },
    );

    const { error: membershipError } = await adminSupabase
      .from("organization_members")
      .insert({
        organization_id: organization.id,
        user_id: userId,
        role: "owner",
      });

    if (membershipError) {
      console.error("Membership creation error:", membershipError);
      return jsonError(
        membershipError.message || "Unable to attach the invited user to the client.",
        400,
      );
    }

    const { error: onboardingError } = await adminSupabase
      .from("client_onboardings")
      .insert({
        organization_id: organization.id,
        mode: onboardingMode,
        status: onboardingStatus,
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

    await sendInviteSentNotification({
      organizationName: organization.name,
      clientEmail: primaryContactEmail,
      clientType: clientType === "existing" ? "existing" : "new",
    }).catch((notificationError) => {
      console.error("Invite notification error:", notificationError);
    });

    return NextResponse.json({ organizationId: organization.id }, { status: 201 });
  } catch (error) {
    console.error("Create client route error:", error);
    return jsonError("An unexpected error occurred while creating the client.", 500);
  }
}
