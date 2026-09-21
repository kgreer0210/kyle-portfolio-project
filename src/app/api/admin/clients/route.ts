import { NextRequest, NextResponse } from "next/server";
import { requireApiAdminUser } from "@/lib/api-auth";
import { jsonError, jsonFromAuthError } from "@/lib/api-response";
import { normalizeEmail, pickUniqueSlug, slugify } from "@/lib/crm";
import { inviteClientToOrganization } from "@/lib/crm-invites";
import { sendInviteSentNotification } from "@/lib/crm-notifications";
import { createAdminSupabaseClient } from "@/lib/supabase";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Create a client without a project (contact details only). Projects are
 * created separately, usually from a SOW. The organization is inserted before
 * any invite goes out so a failed insert never leaves an orphan auth user.
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
      primaryContactName?: string;
      primaryContactEmail?: string;
      websiteUrl?: string;
      notes?: string;
      sendInviteNow?: boolean;
    };

    const organizationName = body.organizationName?.trim() || "";
    const primaryContactName = body.primaryContactName?.trim() || "";
    const primaryContactEmail = normalizeEmail(body.primaryContactEmail || "");
    const websiteUrl = body.websiteUrl?.trim() || null;
    const notes = body.notes?.trim() || null;
    const baseSlug = slugify(organizationName);

    if (!organizationName || !primaryContactName || !primaryContactEmail) {
      return jsonError("Organization name, contact name, and contact email are required.");
    }

    if (!isValidEmail(primaryContactEmail)) {
      return jsonError("Primary contact email is invalid.");
    }

    if (!baseSlug) {
      return jsonError("Organization name must include letters or numbers.");
    }

    const adminSupabase = createAdminSupabaseClient();
    const { data: existingSlugs } = await adminSupabase
      .from("organizations")
      .select("slug")
      .like("slug", `${baseSlug}%`);
    const slug = pickUniqueSlug(
      baseSlug,
      (existingSlugs || []).map((row) => (row as { slug: string }).slug),
    );

    const { data: organization, error: organizationError } = await adminSupabase
      .from("organizations")
      .insert({
        name: organizationName,
        slug,
        client_kind: "new",
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

    if (!body.sendInviteNow) {
      return NextResponse.json(
        { organizationId: organization.id, invited: false },
        { status: 201 },
      );
    }

    try {
      await inviteClientToOrganization({
        organizationId: organization.id,
        email: primaryContactEmail,
        fullName: primaryContactName,
        organizationName: organization.name,
      });
    } catch (inviteError) {
      console.error("CRM invite error:", inviteError);
      return NextResponse.json(
        {
          organizationId: organization.id,
          invited: false,
          error:
            inviteError instanceof Error
              ? inviteError.message
              : "Client created, but the invite could not be sent.",
        },
        { status: 207 },
      );
    }

    await sendInviteSentNotification({
      organizationName: organization.name,
      clientEmail: primaryContactEmail,
      clientType: "new",
    }).catch((notificationError) => {
      console.error("Invite notification error:", notificationError);
    });

    return NextResponse.json(
      { organizationId: organization.id, invited: true },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create client route error:", error);
    return jsonError("An unexpected error occurred while creating the client.", 500);
  }
}
