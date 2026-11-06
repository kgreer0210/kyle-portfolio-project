import { describe, expect, it, vi } from "vitest";
import {
  getPublicTurnstileSiteKey,
  getTurnstileConfig,
  parseAllowedHostnames,
  TURNSTILE_VERIFY_URL,
  verifyTurnstileToken,
} from "@/lib/turnstile";

const secret = "test-secret";
const allowedHostnames = ["kygrsolutions.com", "www.kygrsolutions.com"];

function cloudflare(body: unknown, init: ResponseInit = { status: 200 }) {
  return vi.fn<typeof fetch>(async () => Response.json(body, init));
}

function verify(fetchImpl: typeof fetch, token: string | null = "tok") {
  return verifyTurnstileToken({
    token,
    secret,
    allowedHostnames,
    fetchImpl,
    timeoutMs: 50,
  });
}

describe("getTurnstileConfig", () => {
  const full = {
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: "site",
    TURNSTILE_SECRET_KEY: "secret",
    TURNSTILE_ALLOWED_HOSTNAMES: "kygrsolutions.com, www.kygrsolutions.com",
  };

  it("is enabled only when site key, secret, and hostnames are all present", () => {
    expect(getTurnstileConfig(full)).toEqual({
      enabled: true,
      secret: "secret",
      allowedHostnames: ["kygrsolutions.com", "www.kygrsolutions.com"],
    });
  });

  it("bypasses, with a reason, when anything is missing", () => {
    expect(getTurnstileConfig({})).toEqual({
      enabled: false,
      reason: "missing-site-key",
    });
    expect(
      getTurnstileConfig({ ...full, NEXT_PUBLIC_TURNSTILE_SITE_KEY: "" }),
    ).toEqual({ enabled: false, reason: "missing-site-key" });
    expect(
      getTurnstileConfig({ ...full, TURNSTILE_SECRET_KEY: undefined }),
    ).toEqual({ enabled: false, reason: "missing-secret" });
    expect(
      getTurnstileConfig({ ...full, TURNSTILE_ALLOWED_HOSTNAMES: " , " }),
    ).toEqual({ enabled: false, reason: "missing-hostnames" });
  });
});

describe("getPublicTurnstileSiteKey", () => {
  const full = {
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: "site-123",
    TURNSTILE_SECRET_KEY: "secret",
    TURNSTILE_ALLOWED_HOSTNAMES: "kygrsolutions.com",
  };

  it("hands the browser the site key only when the server will verify", () => {
    expect(getPublicTurnstileSiteKey(full)).toBe("site-123");
  });

  it.each([
    ["the secret", { ...full, TURNSTILE_SECRET_KEY: undefined }],
    ["the hostname list", { ...full, TURNSTILE_ALLOWED_HOSTNAMES: "" }],
    ["every server value", { NEXT_PUBLIC_TURNSTILE_SITE_KEY: "site-123" }],
  ])("hides the site key when the server is missing %s", (_label, env) => {
    expect(getPublicTurnstileSiteKey(env)).toBeUndefined();
  });

  it("never returns a secret", () => {
    expect(getPublicTurnstileSiteKey(full)).not.toContain("secret");
  });
});

describe("parseAllowedHostnames", () => {
  it("lower-cases, trims, and de-duplicates exact hostnames", () => {
    expect(parseAllowedHostnames(" KYGRsolutions.com,kygrsolutions.com ,localhost")).toEqual([
      "kygrsolutions.com",
      "localhost",
    ]);
  });

  it("drops wildcards, schemes, ports, and paths instead of widening the list", () => {
    expect(
      parseAllowedHostnames(
        "*.vercel.app,https://kygrsolutions.com,kygrsolutions.com:3000,kygrsolutions.com/chat,ok.example.com",
      ),
    ).toEqual(["ok.example.com"]);
  });
});

describe("verifyTurnstileToken", () => {
  it("accepts a successful token for the chat action on an allowed hostname", async () => {
    const fetchImpl = cloudflare({
      success: true,
      action: "chat",
      hostname: "WWW.kygrsolutions.com",
    });

    await expect(verify(fetchImpl)).resolves.toEqual({ status: "verified" });
  });

  it("posts the secret, token, and client IP to siteverify", async () => {
    const fetchImpl = cloudflare({ success: true, action: "chat", hostname: "kygrsolutions.com" });

    await verifyTurnstileToken({
      token: "tok",
      secret,
      allowedHostnames,
      remoteIp: "203.0.113.9",
      fetchImpl,
    });

    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe(TURNSTILE_VERIFY_URL);
    const sent = init?.body as URLSearchParams;
    expect(sent.get("secret")).toBe(secret);
    expect(sent.get("response")).toBe("tok");
    expect(sent.get("remoteip")).toBe("203.0.113.9");
  });

  it("rejects a missing, blank, or oversized token without calling Cloudflare", async () => {
    const fetchImpl = cloudflare({ success: true });

    expect(await verify(fetchImpl, null)).toEqual({ status: "rejected", reason: "missing-token" });
    expect(await verify(fetchImpl, "   ")).toEqual({ status: "rejected", reason: "missing-token" });
    expect(await verify(fetchImpl, "x".repeat(3000))).toEqual({
      status: "rejected",
      reason: "invalid-token",
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("rejects a replayed, expired, or malformed token", async () => {
    for (const code of ["timeout-or-duplicate", "invalid-input-response"]) {
      const fetchImpl = cloudflare({ success: false, "error-codes": [code] });
      expect(await verify(fetchImpl)).toEqual({ status: "rejected", reason: "invalid-token" });
    }
  });

  it("rejects a token minted for another action", async () => {
    const fetchImpl = cloudflare({ success: true, action: "login", hostname: "kygrsolutions.com" });
    expect(await verify(fetchImpl)).toEqual({ status: "rejected", reason: "wrong-action" });
  });

  it("rejects a hostname that is not on the exact allowlist", async () => {
    for (const hostname of ["evil.com", "kygrsolutions.com.evil.com", "preview-abc.vercel.app", undefined]) {
      const fetchImpl = cloudflare({ success: true, action: "chat", hostname });
      expect(await verify(fetchImpl)).toEqual({ status: "rejected", reason: "wrong-hostname" });
    }
  });

  it("reports unavailable, never an error, when Cloudflare cannot be reached", async () => {
    const down = vi.fn<typeof fetch>(async () => {
      throw new TypeError("fetch failed");
    });
    expect(await verify(down)).toEqual({ status: "unavailable", reason: "network" });

    const serverError = cloudflare({}, { status: 503 });
    expect(await verify(serverError)).toEqual({ status: "unavailable", reason: "bad-response" });

    const garbage = vi.fn<typeof fetch>(async () => new Response("<html>", { status: 200 }));
    expect(await verify(garbage)).toEqual({ status: "unavailable", reason: "bad-response" });

    const internal = cloudflare({ success: false, "error-codes": ["internal-error"] });
    expect(await verify(internal)).toEqual({ status: "unavailable", reason: "bad-response" });
  });

  it("times out a hung siteverify call", async () => {
    const hang = vi.fn<typeof fetch>(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            const error = new Error("aborted");
            error.name = "AbortError";
            reject(error);
          });
        }),
    );

    expect(await verify(hang)).toEqual({ status: "unavailable", reason: "timeout" });
  });

  it("treats a rejected server secret as our misconfiguration, not the visitor's fault", async () => {
    const fetchImpl = cloudflare({ success: false, "error-codes": ["invalid-input-secret"] });
    expect(await verify(fetchImpl)).toEqual({ status: "unavailable", reason: "misconfigured" });
  });
});
