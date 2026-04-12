import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { syncAuthenticatedProfile } from "@/lib/profile-sync";

export async function POST() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const profile = await syncAuthenticatedProfile(user);
    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Profile sync error:", error);
    return NextResponse.json(
      { error: "Unable to load your CRM profile." },
      { status: 500 },
    );
  }
}
