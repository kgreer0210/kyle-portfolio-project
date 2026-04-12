import { NextResponse } from "next/server";
import { requireApiAuthenticatedUser } from "@/lib/api-auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const { user } = await requireApiAuthenticatedUser();
    const admin = createAdminSupabaseClient();

    const { data, error } = await admin
      .schema("webauthn")
      .from("credentials")
      .select("id, friendly_name, device_type, backed_up, aaguid, created_at, last_used_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[passkey/credentials GET]", error);
      return NextResponse.json({ error: "Failed to fetch credentials" }, { status: 500 });
    }

    return NextResponse.json({ credentials: data });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[passkey/credentials GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
