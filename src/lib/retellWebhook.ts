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

  // Constant-time compare; timingSafeEqual requires equal-length buffers.
  if (expected.length !== digest.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(digest));
}
