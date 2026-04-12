import type { User } from "@supabase/supabase-js";
import type { CrmProfile, ProfileRole, ProfileStatus } from "@/types/crm";
import { isAdminEmail, normalizeEmail } from "@/lib/crm";
import { sendInviteAcceptedNotification } from "@/lib/crm-notifications";
import { createAdminSupabaseClient } from "@/lib/supabase";

export async function syncAuthenticatedProfile(user: User): Promise<CrmProfile> {
  const email = normalizeEmail(user.email ?? "");

  if (!email) {
    throw new Error("Authenticated user is missing an email address.");
  }

  const supabase = createAdminSupabaseClient();
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, status")
    .eq("id", user.id)
    .maybeSingle();

  const role: ProfileRole =
    (existingProfile?.role as ProfileRole | undefined) ||
    (isAdminEmail(email) ? "admin" : "client");

  const previousStatus = existingProfile?.status as ProfileStatus | undefined;
  const status: ProfileStatus =
    previousStatus === "invited" ? "active" : previousStatus || "active";

  const fullName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : existingProfile?.full_name || email.split("@")[0];

  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        email,
        full_name: fullName,
        role,
        status,
      },
      { onConflict: "id" },
    )
    .select("id, email, full_name, role, status, created_at, updated_at")
    .single();

  if (error || !data) {
    throw error || new Error("Unable to sync CRM profile.");
  }

  if (previousStatus === "invited" && status === "active" && role === "client") {
    const { data: membership } = await supabase
      .from("organization_members")
      .select("organization_id, organizations(name)")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    const organizationName = (
      membership as { organizations?: { name?: string | null } | null } | null
    )?.organizations?.name;

    await sendInviteAcceptedNotification({
      organizationName: organizationName || undefined,
      clientEmail: email,
      clientName: fullName,
    }).catch((notificationError) => {
      console.error("Invite accepted notification error:", notificationError);
    });
  }

  return data as CrmProfile;
}
