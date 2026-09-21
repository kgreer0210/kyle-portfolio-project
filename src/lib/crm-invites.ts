import { getSiteUrl } from "@/lib/crm";
import { sendPortalAccessLinkEmail } from "@/lib/crm-notifications";
import { createAdminSupabaseClient } from "@/lib/supabase";

/**
 * Portal invitations. Used when a client is created with "invite now" and
 * when an admin later sends or resends portal access from the client record.
 *
 * `inviteUserByEmail` only works for brand-new auth users. If the address is
 * already registered (an earlier invite that was never accepted, for example)
 * we fall back to a one-time magic link delivered through Resend, which lands
 * on the same /auth/callback handler and still routes never-activated users to
 * passkey/password setup.
 */

export type InviteMethod = "invite" | "magiclink";

export interface InviteClientArgs {
  organizationId: string;
  email: string;
  fullName: string;
  organizationName: string;
}

export interface InviteClientResult {
  userId: string;
  method: InviteMethod;
}

function isAlreadyRegisteredError(message: string | undefined): boolean {
  if (!message) return false;
  const normalized = message.toLowerCase();
  return (
    normalized.includes("already been registered") ||
    normalized.includes("already registered") ||
    normalized.includes("already exists")
  );
}

export async function inviteClientToOrganization(
  args: InviteClientArgs,
): Promise<InviteClientResult> {
  const adminSupabase = createAdminSupabaseClient();
  const redirectTo = new URL("/auth/callback", getSiteUrl()).toString();

  let userId: string | null = null;
  let method: InviteMethod = "invite";

  const { data: inviteData, error: inviteError } =
    await adminSupabase.auth.admin.inviteUserByEmail(args.email, {
      redirectTo,
      data: { full_name: args.fullName },
    });

  if (inviteError || !inviteData?.user?.id) {
    if (!isAlreadyRegisteredError(inviteError?.message)) {
      throw new Error(inviteError?.message || "Unable to send the client invite.");
    }

    const { data: linkData, error: linkError } =
      await adminSupabase.auth.admin.generateLink({
        type: "magiclink",
        email: args.email,
        options: { redirectTo },
      });

    if (linkError || !linkData?.user?.id || !linkData.properties?.action_link) {
      throw new Error(linkError?.message || "Unable to generate a sign-in link.");
    }

    userId = linkData.user.id;
    method = "magiclink";

    await sendPortalAccessLinkEmail({
      to: args.email,
      clientName: args.fullName,
      organizationName: args.organizationName,
      actionLink: linkData.properties.action_link,
    });
  } else {
    userId = inviteData.user.id;
  }

  const { error: profileError } = await adminSupabase.from("profiles").upsert(
    {
      id: userId,
      email: args.email,
      full_name: args.fullName,
      role: "client",
      status: "invited",
    },
    { onConflict: "id", ignoreDuplicates: true },
  );

  if (profileError) {
    console.error("Profile upsert error during invite:", profileError);
  }

  const { error: membershipError } = await adminSupabase
    .from("organization_members")
    .upsert(
      {
        organization_id: args.organizationId,
        user_id: userId,
        role: "owner",
      },
      { onConflict: "organization_id,user_id", ignoreDuplicates: true },
    );

  if (membershipError) {
    throw new Error(
      membershipError.message || "Unable to attach the invited user to the client.",
    );
  }

  return { userId, method };
}

export async function getOrganizationMemberSummary(organizationId: string) {
  const adminSupabase = createAdminSupabaseClient();
  const { data } = await adminSupabase
    .from("organization_members")
    .select("user_id, profiles(email, status)")
    .eq("organization_id", organizationId);

  const members = (data || []) as Array<{
    user_id: string;
    profiles?: { email?: string | null; status?: string | null } | null;
  }>;

  return {
    count: members.length,
    hasActiveMember: members.some((m) => m.profiles?.status === "active"),
    emails: members
      .map((m) => m.profiles?.email)
      .filter((email): email is string => Boolean(email)),
  };
}
