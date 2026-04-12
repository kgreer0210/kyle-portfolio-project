import { createHmac, timingSafeEqual } from "crypto";
import type { NextResponse } from "next/server";
import { cookies } from "next/headers";

const COOKIE_NAME = "webauthn_challenge";
const COOKIE_MAX_AGE = 300; // 5 minutes

function getSecret(): Buffer {
  const secret = process.env.WEBAUTHN_CHALLENGE_SECRET;
  if (!secret) throw new Error("WEBAUTHN_CHALLENGE_SECRET env var is not set");
  return Buffer.from(secret, "hex");
}

function sign(challenge: string): string {
  const sig = createHmac("sha256", getSecret()).update(challenge).digest("hex");
  return `${sig}.${challenge}`;
}

function verify(value: string): string | null {
  const dotIndex = value.indexOf(".");
  if (dotIndex === -1) return null;

  const sig = value.slice(0, dotIndex);
  const challenge = value.slice(dotIndex + 1);

  const expectedSig = createHmac("sha256", getSecret())
    .update(challenge)
    .digest("hex");

  const sigBuf = Buffer.from(sig, "hex");
  const expectedBuf = Buffer.from(expectedSig, "hex");

  if (sigBuf.length !== expectedBuf.length) return null;
  if (!timingSafeEqual(sigBuf, expectedBuf)) return null;

  return challenge;
}

/** Set the signed challenge cookie on a NextResponse. */
export function setChallengeCookie(response: NextResponse, challenge: string): void {
  response.cookies.set(COOKIE_NAME, sign(challenge), {
    httpOnly: true,
    sameSite: "strict",
    path: "/api/auth/passkey",
    maxAge: COOKIE_MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });
}

/**
 * Read + verify the challenge cookie from the incoming request.
 * Returns the raw challenge string, or null if missing/invalid/expired.
 */
export async function consumeChallengeCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
  if (!cookie) return null;
  return verify(cookie.value);
}

/** Attach a cookie-clearing header to a NextResponse. */
export function clearChallengeCookie(response: NextResponse): void {
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "strict",
    path: "/api/auth/passkey",
    maxAge: 0,
    secure: process.env.NODE_ENV === "production",
  });
}
