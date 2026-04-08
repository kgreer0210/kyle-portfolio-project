import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getDefaultRouteForRole } from "@/lib/crm";
import { syncAuthenticatedProfile } from "@/lib/profile-sync";

type CallbackProfile = {
  role?: "admin" | "client";
  status?: "invited" | "active" | "disabled";
} | null;

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");
  const authType = requestUrl.searchParams.get("type");
  const fallbackNext = next && next.startsWith("/") ? next : undefined;

  if (!code) {
    const loginUrl = new URL("/login", request.url);

    if (fallbackNext) {
      loginUrl.searchParams.set("next", fallbackNext);
    }

    return NextResponse.redirect(loginUrl);
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL("/login?error=Unable+to+complete+sign+in", request.url),
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(
      new URL("/login?error=No+active+session+was+created", request.url),
    );
  }

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .maybeSingle();
  const callbackProfile = existingProfile as CallbackProfile;
  const role = callbackProfile?.role || "client";
  const destination = fallbackNext || getDefaultRouteForRole(role);
  const isInviteFlow =
    authType === "invite" || callbackProfile?.status === "invited";

  if (isInviteFlow) {
    const passwordSetupUrl = new URL("/reset-password", request.url);
    passwordSetupUrl.searchParams.set("mode", "invite");
    passwordSetupUrl.searchParams.set("next", destination);
    return NextResponse.redirect(passwordSetupUrl);
  }

  const profile = await syncAuthenticatedProfile(user);

  return NextResponse.redirect(
    new URL(fallbackNext || getDefaultRouteForRole(profile.role), request.url),
  );
}
