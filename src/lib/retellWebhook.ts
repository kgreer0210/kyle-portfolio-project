import { createHmac, timingSafeEqual } from "crypto";

// Retell signs webhook requests with an HMAC-SHA256 scheme. The
// `X-Retell-Signature` header has the form `v=<timestamp>,d=<digest>`, where
// <digest> is the hex HMAC of (raw request body + timestamp) keyed by the
// Retell API key, and <timestamp> must fall within a freshness window.
//
// retell-sdk v4 shipped this as the static `Retell.verify(body, apiKey,
// signature)` helper; v5 removed it. This reproduces that helper's exact
// behaviour so webhook verification keeps working without the SDK.

const FIVE_MINUTES_MS = 5 * 60 * 1000;

export function verifyRetellSignature(
  body: string,
  apiKey: string,
  signature: string | null,
): boolean {
  if (!signature) return false;

  const match = /v=(\d+),d=(.*)/.exec(signature);
  if (!match) return false;

  const timestamp = Number(match[1]);
  const digest = match[2];

  if (Math.abs(Date.now() - timestamp) > FIVE_MINUTES_MS) return false;

  const expected = createHmac("sha256", apiKey)
    .update(body + timestamp)
    .digest("hex");

  // Constant-time compare. timingSafeEqual throws on differing byte lengths, and
  // `digest` is request-supplied, so compare the decoded Buffer byte lengths
  // (string length miscounts any multibyte input) before calling it.
  const expectedBuf = Buffer.from(expected);
  const digestBuf = Buffer.from(digest);
  if (expectedBuf.length !== digestBuf.length) return false;
  return timingSafeEqual(expectedBuf, digestBuf);
}

// Retell's post-call analysis sets `is_spam` (a boolean custom field configured
// on the agent) for robocalls and other junk. Only a real boolean `true` counts,
// so a missing or malformed field still notifies rather than dropping a lead.
export function isSpamCall(customAnalysisData: unknown): boolean {
  if (!customAnalysisData || typeof customAnalysisData !== "object") {
    return false;
  }
  return (customAnalysisData as Record<string, unknown>).is_spam === true;
}
