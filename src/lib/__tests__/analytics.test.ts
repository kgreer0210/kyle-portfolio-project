import { describe, expect, it } from "vitest";
import { gaDisableKey, isAnalyticsExcludedPath } from "../analytics";

describe("isAnalyticsExcludedPath", () => {
  it.each([
    "/admin",
    "/admin/clients/abc/projects/new",
    "/portal",
    "/portal/tickets/123",
    "/login",
    "/auth/callback",
    "/reset-password",
  ])("excludes %s", (path) => {
    expect(isAnalyticsExcludedPath(path)).toBe(true);
  });

  it.each([
    "/",
    "/about",
    "/contact",
    "/idx",
    "/projects",
    "/projects/some-project",
    "/services",
    "/website-design-middle-georgia",
    "/administrator",
    "/portals",
    "/login-help",
  ])("keeps %s", (path) => {
    expect(isAnalyticsExcludedPath(path)).toBe(false);
  });

  it("treats a missing pathname as public", () => {
    expect(isAnalyticsExcludedPath(null)).toBe(false);
    expect(isAnalyticsExcludedPath("")).toBe(false);
  });
});

describe("gaDisableKey", () => {
  it("uses Google's documented opt-out key format", () => {
    expect(gaDisableKey("G-TEST123")).toBe("ga-disable-G-TEST123");
  });
});
