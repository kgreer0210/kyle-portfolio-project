import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getDefaultRouteForRole } from "@/lib/crm";
import { syncAuthenticatedProfile } from "@/lib/profile-sync";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");
  const fallbackNext = next && next.startsWith("/") ? next : undefined;

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=Missing+auth+code", request.url));
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

  const profile = await syncAuthenticatedProfile(user);
  const destination = fallbackNext || getDefaultRouteForRole(profile.role);

  return NextResponse.redirect(new URL(destination, request.url));
}
