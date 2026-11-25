import { describe, expect, it } from "vitest";
import { FLOATING_CLEARANCE } from "../floatingControls";

// The browser layout check (e2e/footer-layout.spec.ts) measures the real
// gap and overlap. This guards the class string in CI, which has no browsers.
describe("FLOATING_CLEARANCE", () => {
  const classes = FLOATING_CLEARANCE.split(/\s+/);

  it("reserves room for the floating stack below md", () => {
    expect(classes).toContain("pb-[calc(8.25rem+env(safe-area-inset-bottom))]");
    expect(classes).toContain("sm:pb-[calc(8.75rem+env(safe-area-inset-bottom))]");
  });

  it("keeps only the safe-area inset from md up, so there is no gap below the footer", () => {
    const md = classes.filter((c) => c.startsWith("md:pb-") || c.startsWith("lg:pb-") || c.startsWith("xl:pb-"));
    expect(md).toEqual(["md:pb-[env(safe-area-inset-bottom)]"]);
  });
});
