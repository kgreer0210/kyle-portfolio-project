import { NextRequest, NextResponse } from "next/server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import type {
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
} from "@simplewebauthn/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { webAuthnConfig } from "@/lib/webauthn/config";
import {
  consumeChallengeCookie,
  clearChallengeCookie,
} from "@/lib/webauthn/challenge-cookie";

export async function POST(request: NextRequest) {
  try {
    const expectedChallenge = await consumeChallengeCookie();
    if (!expectedChallenge) {
      return NextResponse.json(
        { error: "Challenge missing or expired" },
        { status: 400 },
      );
    }

    const body: AuthenticationResponseJSON = await request.json();
    const admin = createAdminSupabaseClient();

    // Look up stored credential by ID
    const { data: storedCred, error: credError } = await admin
      .schema("webauthn")
      .from("credentials")
      .select("*")
      .eq("credential_id", body.id)
      .single();

    if (credError || !storedCred) {
      return NextResponse.json({ error: "Credential not found" }, { status: 400 });
    }

    const verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: webAuthnConfig.origin,
      expectedRPID: webAuthnConfig.rpID,
      credential: {
        id: storedCred.credential_id,
        publicKey: Buffer.from(storedCred.public_key, "base64url"),
        counter: storedCred.counter,
        transports: (storedCred.transports ?? undefined) as AuthenticatorTransportFuture[] | undefined,
      },
    });

    const response = NextResponse.json(
      verification.verified ? { verified: true } : { verified: false },
    );
    clearChallengeCookie(response);

    if (!verification.verified) {
      return response;
    }

    // Update counter + last_used_at to prevent replay attacks
    await admin
      .schema("webauthn")
      .from("credentials")
      .update({
        counter: verification.authenticationInfo.newCounter,
        last_used_at: new Date().toISOString(),
      })
      .eq("credential_id", body.id);

    // Fetch the user's email so we can generate a magic-link token
    const { data: userData, error: userError } =
      await admin.auth.admin.getUserById(storedCred.user_id);

    if (userError || !userData?.user?.email) {
      console.error("[passkey/authenticate/verify] getUserById error:", userError);
      return NextResponse.json({ error: "Failed to load user" }, { status: 500 });
    }

    // Generate a single-use magic-link token — no email is sent, we use the
    // hashed_token directly to exchange for a real Supabase session server-side.
    const { data: linkData, error: linkError } =
      await admin.auth.admin.generateLink({
        type: "magiclink",
        email: userData.user.email,
      });

    if (linkError || !linkData?.properties?.hashed_token) {
      console.error("[passkey/authenticate/verify] generateLink error:", linkError);
      return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
    }

    // Exchange the token for a live Supabase session; the SSR client writes
    // the access + refresh tokens into httpOnly cookies automatically.
    const serverClient = await createServerSupabaseClient();
    const { error: verifyError } = await serverClient.auth.verifyOtp({
      token_hash: linkData.properties.hashed_token,
      type: "magiclink",
    });

    if (verifyError) {
      console.error("[passkey/authenticate/verify] verifyOtp error:", verifyError);
      return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
    }

    // Determine redirect based on profile role
    const { data: profile } = await serverClient
      .from("profiles")
      .select("role")
      .eq("id", storedCred.user_id)
      .single();

    const redirectTo = profile?.role === "admin" ? "/admin" : "/portal";
    return NextResponse.json({ verified: true, redirectTo });
  } catch (err) {
    console.error("[passkey/authenticate/verify]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
