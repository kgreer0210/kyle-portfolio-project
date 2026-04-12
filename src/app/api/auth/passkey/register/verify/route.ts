import { NextRequest, NextResponse } from "next/server";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import type { RegistrationResponseJSON } from "@simplewebauthn/server";
import { requireApiAuthenticatedUser } from "@/lib/api-auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { webAuthnConfig } from "@/lib/webauthn/config";
import {
  consumeChallengeCookie,
  clearChallengeCookie,
} from "@/lib/webauthn/challenge-cookie";

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireApiAuthenticatedUser();

    const expectedChallenge = await consumeChallengeCookie();
    if (!expectedChallenge) {
      return NextResponse.json(
        { error: "Challenge missing or expired" },
        { status: 400 },
      );
    }

    const body: RegistrationResponseJSON = await request.json();

    const verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: webAuthnConfig.origin,
      expectedRPID: webAuthnConfig.rpID,
    });

    const response = NextResponse.json({ verified: verification.verified });
    clearChallengeCookie(response);

    if (!verification.verified || !verification.registrationInfo) {
      return response;
    }

    const { credential, credentialDeviceType, credentialBackedUp, aaguid } =
      verification.registrationInfo;

    const admin = createAdminSupabaseClient();
    const { error } = await admin
      .schema("webauthn")
      .from("credentials")
      .insert({
        user_id: user.id,
        credential_id: credential.id,
        public_key: Buffer.from(credential.publicKey).toString("base64url"),
        counter: credential.counter,
        device_type: credentialDeviceType,
        backed_up: credentialBackedUp,
        transports: credential.transports ?? null,
        aaguid: aaguid ?? null,
      });

    if (error) {
      console.error("[passkey/register/verify] DB insert error:", error);
      return NextResponse.json({ error: "Failed to save credential" }, { status: 500 });
    }

    return response;
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[passkey/register/verify]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
