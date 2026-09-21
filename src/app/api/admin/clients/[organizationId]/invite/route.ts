import { NextRequest, NextResponse } from "next/server";
import { requireApiAdminUser } from "@/lib/api-auth";
import { jsonError, jsonFromAuthError } from "@/lib/api-response";
import { inviteClientToOrganization } from "@/lib/crm-invites";
import { sendInviteSentNotification } from "@/lib/crm-notifications";
import { createAdminSupabaseClient } from "@/lib/supabase";

interface RouteParams {
  params: Promise<{ organizationId: string }>;
}

/** Send or resend portal access using the contact saved on the client record. */
export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    await requireApiAdminUser();
  } catch (error) {
    return jsonFromAuthError(error) || jsonError("Unauthorized", 401);
  }

  const { organizationId } = await params;
  const supabase = createAdminSupabaseClient();
  const { data: organization, error } = await supabase
    .from("organizations")
    .select("id, name, client_kind, primary_contact_name, primary_contact_email")
    .eq("id", organizationId)
    .maybeSingle();

  if (error) {
    console.error("Client invite lookup error:", error);
    return jsonError("Unable to load the client.", 500);
  }
  if (!organization) {
    return jsonError("Client not found.", 404);
  }

  const email = String(organization.primary_contact_email || "").trim();
  const fullName = String(organization.primary_contact_name || "").trim();
  if (!email || !fullName) {
    return jsonError("Add a primary contact name and email before sending an invite.");
  }

  try {
    const result = await inviteClientToOrganization({
      organizationId: organization.id as string,
      email,
      fullName,
      organizationName: organization.name as string,
    });

    await sendInviteSentNotification({
      organizationName: organization.name as string,
      clientEmail: email,
      clientType: organization.client_kind === "existing" ? "existing" : "new",
    }).catch((notificationError) => {
      console.error("Invite notification error:", notificationError);
    });

    return NextResponse.json({ ok: true, method: result.method });
  } catch (inviteError) {
    console.error("Deferred client invite error:", inviteError);
    return jsonError(
      inviteError instanceof Error
        ? inviteError.message
        : "Unable to send the client invite.",
      500,
    );
  }
}
