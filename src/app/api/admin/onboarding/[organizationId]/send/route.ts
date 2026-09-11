import { NextRequest, NextResponse } from "next/server";
import { requireApiAdminUser } from "@/lib/api-auth";
import { jsonError, jsonFromAuthError } from "@/lib/api-response";
import {
  getOrganizationMemberSummary,
  inviteClientToOrganization,
} from "@/lib/crm-invites";
import {
  sendOnboardingReadyNotification,
  sendOnboardingSentAdminNotification,
} from "@/lib/crm-notifications";
import { createAdminSupabaseClient } from "@/lib/supabase";

interface RouteParams {
  params: Promise<{ organizationId: string }>;
}

/**
 * Sends a prepared onboarding to the client.
 *
 * - No portal member yet → send the portal invitation (the existing invite
 *   mechanism). Accepting it lands them in the prepared onboarding.
 * - Member exists → email them that onboarding is ready.
 *
 * Either way `plan_sent_at` is stamped, which is what unlocks the flow in the
 * portal.
 */
export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    await requireApiAdminUser();
  } catch (error) {
    return jsonFromAuthError(error) || jsonError("Unauthorized", 401);
  }

  try {
    const { organizationId } = await params;
    const adminSupabase = createAdminSupabaseClient();

    const [{ data: organization }, { data: onboarding }] = await Promise.all([
      adminSupabase
        .from("organizations")
        .select("id, name, primary_contact_name, primary_contact_email")
        .eq("id", organizationId)
        .maybeSingle(),
      adminSupabase
        .from("client_onboardings")
        .select("status, mode, flow_version, project_type, plan_sent_at")
        .eq("organization_id", organizationId)
        .maybeSingle(),
    ]);

    if (!organization || !onboarding) {
      return jsonError("Client or onboarding record not found.", 404);
    }

    if (onboarding.flow_version !== "v2" || !onboarding.project_type) {
      return jsonError("Save the onboarding plan before sending it.");
    }

    if (onboarding.status === "submitted" || onboarding.status === "completed") {
      return jsonError("This onboarding has already been submitted.");
    }

    const contactEmail = organization.primary_contact_email?.trim();
    if (!contactEmail) {
      return jsonError("This client has no primary contact email on file.");
    }

    const members = await getOrganizationMemberSummary(organizationId);
    let method: "invite" | "magiclink" | "ready_email";

    if (members.count === 0) {
      const result = await inviteClientToOrganization({
        organizationId,
        email: contactEmail,
        fullName: organization.primary_contact_name || contactEmail,
        organizationName: organization.name,
      });
      method = result.method;
    } else {
      const recipients = members.emails.length > 0 ? members.emails : [contactEmail];
      await sendOnboardingReadyNotification({
        to: recipients,
        clientName: organization.primary_contact_name,
        organizationName: organization.name,
      });
      method = "ready_email";
    }

    const now = new Date().toISOString();
    const { error: updateError } = await adminSupabase
      .from("client_onboardings")
      .update({ plan_sent_at: now })
      .eq("organization_id", organizationId);

    if (updateError) {
      console.error("Onboarding send stamp error:", updateError);
      return jsonError("Sent, but unable to record the send time.", 500);
    }

    await sendOnboardingSentAdminNotification({
      organizationName: organization.name,
      clientEmail: contactEmail,
      method,
    }).catch((notificationError) => {
      console.error("Onboarding sent notification error:", notificationError);
    });

    return NextResponse.json({ ok: true, method, sentAt: now, isResend: Boolean(onboarding.plan_sent_at) });
  } catch (error) {
    console.error("Admin onboarding send route error:", error);
    return jsonError(
      error instanceof Error ? error.message : "An unexpected error occurred while sending onboarding.",
      500,
    );
  }
}
