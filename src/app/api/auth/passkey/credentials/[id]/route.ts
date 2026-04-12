import { NextRequest, NextResponse } from "next/server";
import { requireApiAuthenticatedUser } from "@/lib/api-auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user } = await requireApiAuthenticatedUser();
    const { id } = await params;
    const { friendly_name }: { friendly_name: string } = await request.json();

    const admin = createAdminSupabaseClient();
    const { error } = await admin
      .schema("webauthn")
      .from("credentials")
      .update({ friendly_name })
      .eq("id", id)
      .eq("user_id", user.id); // scoped to current user

    if (error) {
      console.error("[passkey/credentials PATCH]", error);
      return NextResponse.json({ error: "Failed to update credential" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[passkey/credentials PATCH]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user } = await requireApiAuthenticatedUser();
    const { id } = await params;
    const admin = createAdminSupabaseClient();

    const { error } = await admin
      .schema("webauthn")
      .from("credentials")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id); // scoped to current user

    if (error) {
      console.error("[passkey/credentials DELETE]", error);
      return NextResponse.json({ error: "Failed to delete credential" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[passkey/credentials DELETE]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
