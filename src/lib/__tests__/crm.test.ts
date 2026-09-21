import { describe, expect, it } from "vitest";
import { pickUniqueSlug, slugify } from "@/lib/crm";

describe("slugify", () => {
  it("lowercases and collapses non-alphanumerics into dashes", () => {
    expect(slugify("  Acme Plumbing & Heating, LLC ")).toBe(
      "acme-plumbing-heating-llc",
    );
  });

  it("returns an empty string when nothing usable remains", () => {
    expect(slugify("!!!")).toBe("");
  });
});

describe("pickUniqueSlug", () => {
  it("returns the base when it is free", () => {
    expect(pickUniqueSlug("acme", ["acme-co"])).toBe("acme");
  });

  it("appends the first free numeric suffix", () => {
    expect(pickUniqueSlug("acme", ["acme"])).toBe("acme-2");
    expect(pickUniqueSlug("acme", ["acme", "acme-2", "acme-3"])).toBe("acme-4");
  });

  it("fills gaps in the suffix sequence", () => {
    expect(pickUniqueSlug("acme", ["acme", "acme-3"])).toBe("acme-2");
  });
});
