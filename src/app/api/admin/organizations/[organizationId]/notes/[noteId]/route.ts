import { NextRequest, NextResponse } from "next/server";
import { requireApiAdminUser } from "@/lib/api-auth";
import { jsonError, jsonFromAuthError } from "@/lib/api-response";
import { createAdminSupabaseClient } from "@/lib/supabase";

interface RouteParams {
  params: Promise<{
    organizationId: string;
    noteId: string;
  }>;
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    await requireApiAdminUser();
  } catch (error) {
    return jsonFromAuthError(error) || jsonError("Unauthorized", 401);
  }

  try {
    const { organizationId, noteId } = await params;
    const adminSupabase = createAdminSupabaseClient();

    const { data: note, error: noteLookupError } = await adminSupabase
      .from("organization_notes")
      .select("id")
      .eq("id", noteId)
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (noteLookupError) {
      console.error("Organization note lookup error:", noteLookupError);
      return jsonError("Unable to load the note.", 500);
    }

    if (!note) {
      return jsonError("Note not found.", 404);
    }

    const { error: deleteError } = await adminSupabase
      .from("organization_notes")
      .delete()
      .eq("id", noteId);

    if (deleteError) {
      console.error("Organization note delete error:", deleteError);
      return jsonError("Unable to delete the note.", 500);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Organization note delete route error:", error);
    return jsonError("An unexpected error occurred while deleting the note.", 500);
  }
}
