import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = createAdminSupabaseClient();
    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 },
      );
    }

    if (!UUID_REGEX.test(token)) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    const { data, error: selectError } = await supabaseAdmin
      .from("blog_subscribers")
      .select("id")
      .eq("unsubscribe_token", token)
      .limit(1)
      .single();

    if (selectError || !data) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 },
      );
    }

    const { error: deleteError } = await supabaseAdmin
      .from("blog_subscribers")
      .delete()
      .eq("unsubscribe_token", token);

    if (deleteError) {
      console.error("Supabase delete error:", deleteError);
      return NextResponse.json(
        { error: "Failed to unsubscribe. Please try again." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { message: "You have been unsubscribed successfully." },
      { status: 200 },
    );
  } catch (error) {
    console.error("Unsubscribe error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again later." },
      { status: 500 },
    );
  }
}
