import { describe, expect, it } from "vitest";
import { IDX_SUBJECT, idxPublicCopy } from "@/data/idx";
import { resolveContactSubject } from "@/lib/idxContact";

const publicCopy = idxPublicCopy.join("\n");

describe("IDX public copy", () => {
  it("keeps the approved offering language", () => {
    expect(publicCopy).toContain("Custom IDX for Central Georgia agents");
    expect(publicCopy).toContain(
      "An approved IDX vendor for Central Georgia MLS.",
    );
    expect(publicCopy).toContain("Contact for pricing");
    expect(publicCopy).toContain("Talk to us about IDX for your site");
    expect(publicCopy).toContain("every 15 minutes");
    expect(publicCopy).toContain(
      "Your participating broker opts in in writing.",
    );
  });

  it("does not make prohibited MLS claims", () => {
    const forbidden = [
      /\bGAMLS\b/i,
      /(?<!Central )Georgia MLS/i,
      /real-?time/i,
      /sold data/i,
      /home valuation/i,
      /full[- ]MLS/i,
      /endors/i,
      /partner/i,
      /\blicensed\b/i,
      /MLS member/i,
      /\$\s?\d/,
    ];

    for (const pattern of forbidden) {
      expect(publicCopy).not.toMatch(pattern);
    }
  });

  it("uses broker only for the client's broker", () => {
    const brokerSentences = publicCopy
      .split(/(?<=[.!?])\s+/)
      .filter((sentence) => /broker/i.test(sentence));

    expect(brokerSentences.length).toBeGreaterThan(0);
    for (const sentence of brokerSentences) {
      expect(sentence.toLowerCase()).toMatch(/your (participating )?broker/);
      expect(sentence).not.toMatch(/KYGR/i);
    }
  });
});

describe("resolveContactSubject", () => {
  const services = ["Website Development", "Tech Stack Review"];

  it("accepts IDX and existing service subjects", () => {
    expect(resolveContactSubject("IDX", services)).toBe(IDX_SUBJECT);
    expect(resolveContactSubject(" Website Development ", services)).toBe(
      "Website Development",
    );
    expect(resolveContactSubject("General Inquiry", services)).toBe(
      "General Inquiry",
    );
  });

  it("drops unknown subjects", () => {
    expect(resolveContactSubject(undefined, services)).toBe("");
    expect(resolveContactSubject("  ", services)).toBe("");
    expect(resolveContactSubject("Georgia MLS", services)).toBe("");
  });
});
