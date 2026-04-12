import { NextResponse } from "next/server";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { requireApiAuthenticatedUser } from "@/lib/api-auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { webAuthnConfig } from "@/lib/webauthn/config";
import { setChallengeCookie } from "@/lib/webauthn/challenge-cookie";

export async function POST() {
  try {
    const { user } = await requireApiAuthenticatedUser();
    const admin = createAdminSupabaseClient();

    // Fetch existing credentials so we can exclude them (prevent re-registering same device)
    const { data: existing } = await admin
      .schema("webauthn")
      .from("credentials")
      .select("credential_id, transports")
      .eq("user_id", user.id);

    const options = await generateRegistrationOptions({
      rpID: webAuthnConfig.rpID,
      rpName: webAuthnConfig.rpName,
      userName: user.email ?? user.id,
      userDisplayName: user.email ?? user.id,
      attestationType: "none",
      excludeCredentials: (existing ?? []).map((c) => ({
        id: c.credential_id,
        transports: c.transports ?? undefined,
      })),
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "preferred",
      },
    });

    const response = NextResponse.json(options);
    setChallengeCookie(response, options.challenge);
    return response;
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[passkey/register/options]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
