import { createHmac } from "crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { isSpamCall, verifyRetellSignature } from "@/lib/retellWebhook";

const apiKey = "test-api-key";
const body = JSON.stringify({ event: "call_ended", call: { call_id: "abc" } });

function sign(payload: string, timestamp: number, key = apiKey) {
  const digest = createHmac("sha256", key)
    .update(payload + timestamp)
    .digest("hex");
  return `v=${timestamp},d=${digest}`;
}

describe("verifyRetellSignature", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("accepts a fresh, correctly signed body", () => {
    expect(verifyRetellSignature(body, apiKey, sign(body, Date.now()))).toBe(
      true,
    );
  });

  it("rejects a missing or malformed header", () => {
    expect(verifyRetellSignature(body, apiKey, null)).toBe(false);
    expect(verifyRetellSignature(body, apiKey, "nonsense")).toBe(false);
  });

  it("rejects a tampered body or wrong key", () => {
    const signature = sign(body, Date.now());
    expect(verifyRetellSignature(`${body} `, apiKey, signature)).toBe(false);
    expect(verifyRetellSignature(body, "other-key", signature)).toBe(false);
  });

  it("rejects signatures outside the five-minute window", () => {
    vi.useFakeTimers();
    const now = new Date("2026-09-14T12:00:00Z").getTime();
    vi.setSystemTime(now);
    const stale = sign(body, now - 6 * 60 * 1000);
    expect(verifyRetellSignature(body, apiKey, stale)).toBe(false);
  });

  it("rejects a digest of the wrong length without throwing", () => {
    const timestamp = Date.now();
    expect(
      verifyRetellSignature(body, apiKey, `v=${timestamp},d=abcé`),
    ).toBe(false);
  });
});

describe("isSpamCall", () => {
  it("flags only a boolean true is_spam", () => {
    expect(isSpamCall({ is_spam: true })).toBe(true);
    expect(isSpamCall({ is_spam: false })).toBe(false);
    expect(isSpamCall({ is_spam: "true" })).toBe(false);
  });

  it("treats missing analysis data as not spam", () => {
    expect(isSpamCall(undefined)).toBe(false);
    expect(isSpamCall(null)).toBe(false);
    expect(isSpamCall({})).toBe(false);
  });
});
