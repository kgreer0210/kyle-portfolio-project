import { describe, expect, it } from "vitest";
import { testimonials } from "../testimonials";

describe("testimonials", () => {
  it("keeps Lexi first and lists the Google reviews in order", () => {
    expect(testimonials.map((t) => t.name)).toEqual([
      "Alexis Baker",
      "Dexter Gordy",
      "Lisa Rodriguez Dunn",
      "Nick Morgan",
    ]);
    expect(new Set(testimonials.map((t) => t.id)).size).toBe(
      testimonials.length,
    );
  });

  it("keeps quotes verbatim with no embedded quotation marks", () => {
    const lisa = testimonials.find((t) => t.name === "Lisa Rodriguez Dunn");
    const nick = testimonials.find((t) => t.name === "Nick Morgan");
    expect(Array.isArray(lisa?.quote) && lisa.quote).toHaveLength(3);
    const lisaLast = Array.isArray(lisa?.quote) ? lisa.quote[2] : "";
    expect(lisaLast).toContain("impressed with  his");
    expect(lisaLast.endsWith("made a difference")).toBe(true);
    expect(nick?.role).toBeUndefined();
    expect(nick?.quote).toContain("update.  Kyle");
    for (const t of testimonials.slice(1)) {
      const text = Array.isArray(t.quote) ? t.quote.join(" ") : t.quote;
      expect(text).not.toMatch(/^["“]|["”]$/);
    }
  });
});
