import { cache } from "react";
import { redirect } from "next/navigation";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { CrmProfile, OrganizationMembership } from "@/types/crm";
import { createServerSupabaseClient } from "@/lib/supabase";
import { syncAuthenticatedProfile } from "@/lib/profile-sync";

interface AuthContext {
  supabase: SupabaseClient;
  user: User;
  profile: CrmProfile;
}

export const getRouteAuthContext = cache(async (): Promise<AuthContext | null> => {
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
});

export async function requireAuthenticatedUser(): Promise<AuthContext> {
  const context = await getRouteAuthContext();

  if (!context) {
    redirect("/login");
  }

  return context;
}

export async function requireAdminUser(): Promise<AuthContext> {
  const context = await requireAuthenticatedUser();

  if (context.profile.role !== "admin") {
    redirect("/portal");
  }

  return context;
}

export async function requireClientUser(): Promise<AuthContext> {
  const context = await requireAuthenticatedUser();

  if (context.profile.role !== "client") {
    redirect(context.profile.role === "admin" ? "/admin" : "/login");
  }

  return context;
}

export async function getPrimaryOrganizationMembership(
  userId: string,
  supabase: SupabaseClient,
): Promise<OrganizationMembership | null> {
  const { data, error } = await supabase
    .from("organization_members")
    .select(
      "organization_id, role, organizations(id, name, slug, client_kind, primary_contact_name, primary_contact_email, notes, created_at, updated_at)",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as unknown as OrganizationMembership;
}
