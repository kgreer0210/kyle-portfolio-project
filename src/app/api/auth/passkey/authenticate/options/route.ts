import { NextRequest, NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import type { AuthenticatorTransportFuture } from "@simplewebauthn/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { webAuthnConfig } from "@/lib/webauthn/config";
import { setChallengeCookie } from "@/lib/webauthn/challenge-cookie";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const email: string | undefined = body?.email;

    let allowCredentials: { id: string; transports?: AuthenticatorTransportFuture[] }[] | undefined;

    if (email) {
      const admin = createAdminSupabaseClient();

      // Look up user by email to populate allowCredentials (non-discoverable flow)
      const { data: userData } = await admin.auth.admin.listUsers();
      const matchedUser = userData?.users.find((u) => u.email === email);

      if (matchedUser) {
        const { data: creds } = await admin
          .schema("webauthn")
          .from("credentials")
          .select("credential_id, transports")
          .eq("user_id", matchedUser.id);

        if (creds && creds.length > 0) {
          allowCredentials = creds.map((c) => ({
            id: c.credential_id,
            transports: (c.transports ?? undefined) as AuthenticatorTransportFuture[] | undefined,
          }));
        }
      }
    }

    const options = await generateAuthenticationOptions({
      rpID: webAuthnConfig.rpID,
      userVerification: "preferred",
      allowCredentials,
    });

    const response = NextResponse.json(options);
    setChallengeCookie(response, options.challenge);
    return response;
  } catch (err) {
    console.error("[passkey/authenticate/options]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
