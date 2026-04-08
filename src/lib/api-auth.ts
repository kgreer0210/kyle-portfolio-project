import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { CrmProfile, OrganizationMembership } from "@/types/crm";
import { getPrimaryOrganizationMembership } from "@/lib/auth";
import { syncAuthenticatedProfile } from "@/lib/profile-sync";
import { createServerSupabaseClient } from "@/lib/supabase";

interface ApiAuthContext {
  supabase: SupabaseClient;
  user: User;
  profile: CrmProfile;
}

export async function getApiAuthContext(): Promise<ApiAuthContext | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const profile = await syncAuthenticatedProfile(user);

  return {
    supabase,
    user,
    profile,
  };
}

export async function requireApiAuthenticatedUser(): Promise<ApiAuthContext> {
  const context = await getApiAuthContext();

  if (!context) {
    throw new Error("UNAUTHORIZED");
  }

  return context;
}

export async function requireApiAdminUser(): Promise<ApiAuthContext> {
  const context = await requireApiAuthenticatedUser();

  if (context.profile.role !== "admin") {
    throw new Error("FORBIDDEN");
  }

  return context;
}

export async function requireApiClientUser(): Promise<
  ApiAuthContext & { membership: OrganizationMembership }
> {
  const context = await requireApiAuthenticatedUser();

  if (context.profile.role !== "client") {
    throw new Error("FORBIDDEN");
  }

  const membership = await getPrimaryOrganizationMembership(
    context.user.id,
    context.supabase,
  );

  if (!membership) {
    throw new Error("NO_ORGANIZATION");
  }

  return {
    ...context,
    membership,
  };
}
