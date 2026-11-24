import { describe, expect, it, vi } from "vitest";
import { idxOffering } from "@/data/idx";
import {
  IDX_PAGE_DESCRIPTION,
  IDX_PAGE_H1,
  IDX_PAGE_TITLE,
  IDX_PAGE_TWITTER_TITLE,
  idxFaqs,
  idxPageCopy,
  idxPageExtraFeatures,
} from "@/data/idxPage";
import { metadata } from "../../app/idx/page";
import { CANONICAL_SITE_URL } from "@/lib/siteUrl";

vi.mock("../../app/idx/IdxClient", () => ({ default: () => null }));

const copy = idxPageCopy.join("\n");

describe("/idx metadata", () => {
  it("uses the approved title, description, and H1", () => {
    expect(metadata.title).toBe("Custom IDX for Georgia MLS Agents");
    expect(IDX_PAGE_DESCRIPTION).toBe(
      "Approved IDX vendor for Georgia MLS and Central Georgia MLS. Branded property search on your own domain, including one search across both feeds.",
    );
    expect(metadata.description).toBe(IDX_PAGE_DESCRIPTION);
    expect(IDX_PAGE_H1).toBe(
      "Custom IDX for Georgia MLS and Central Georgia MLS agents",
    );
  });

  it("keeps a self-referencing relative canonical and openGraph url", () => {
    expect(metadata.alternates?.canonical).toBe("/idx");
    expect(metadata.openGraph?.url).toBe("/idx");
  });

  it("sets twitter copy to match the page title and description", () => {
    expect(IDX_PAGE_TWITTER_TITLE).toBe(
      "Custom IDX for Georgia MLS Agents | KYGR Solutions",
    );
    const twitter = metadata.twitter as Record<string, unknown>;
    expect(twitter.title).toBe(IDX_PAGE_TWITTER_TITLE);
    expect(twitter.description).toBe(IDX_PAGE_DESCRIPTION);
    expect(twitter.card).toBe("summary_large_image");
  });
});

describe("/idx page copy", () => {
  it("does not make prohibited MLS claims", () => {
    const forbidden = [
      /real-?time/i,
      /sold/i,
      /home valuation/i,
      /full[- ]MLS/i,
      /endors/i,
      /MLS approved|approved the site/i,
      /partner/i,
      /\blicensed\b/i,
      /MLS member/i,
      /\$\s?\d/,
      /opts in/i,
      /\bwe\b|\bwe're\b|\bwe'll\b|\bwe've\b|\bour\b/i,
      /\bhome base\b/i,
      /https:\/\/kygrsolutions\.com/,
    ];
    for (const pattern of forbidden) {
      expect(copy).not.toMatch(pattern);
    }
  });

  it("states the confirmed broker-form wording", () => {
    expect(copy).toContain(
      "Your broker signs a form approving your website, I keep it on file for MLS audits, and I handle that paperwork.",
    );
  });

  it("never describes Kyle or KYGR as a broker", () => {
    const sentences = copy.split(/\n|(?<=[.!?])\s+/);
    for (const sentence of sentences.filter((s) => /broker/i.test(s))) {
      expect(sentence).not.toMatch(/KYGR|I am a broker|I'm a broker/i);
    }
  });

  it("keeps Lisa Dunn's site Central Georgia MLS only", () => {
    expect(copy).toContain("Central Georgia MLS only");
    for (const sentence of copy.split(/\n|(?<=[.!?])\s+/)) {
      if (/Lisa/.test(sentence) && /Georgia MLS/.test(sentence)) {
        expect(sentence).toMatch(/Central Georgia MLS/);
        expect(sentence).not.toMatch(/Georgia MLS and Central/i);
        expect(sentence.replace(/not both/i, "")).not.toMatch(/both/i);
      }
    }
  });

  it("keeps page-only extras out of the shared offering", () => {
    for (const extra of idxPageExtraFeatures) {
      expect(idxOffering.features as readonly string[]).not.toContain(extra);
    }
  });

  it("has first-person FAQ answers for the three answer-ready questions first", () => {
    expect(idxFaqs.slice(0, 3).map((f) => f.question)).toEqual([
      "Do I need a custom IDX if Georgia MLS already gives me a website?",
      "Can one website search both Georgia MLS and Central Georgia MLS?",
      "What is IDX for realtors?",
    ]);
    expect(CANONICAL_SITE_URL).toBe("https://www.kygrsolutions.com");
    expect(IDX_PAGE_TITLE.length).toBeGreaterThan(0);
  });
});

describe("/idx FAQ links", () => {
  it("never use a raw URL path as text", () => {
    for (const faq of idxFaqs) {
      expect(faq.answer).not.toMatch(/\s\/[a-z-]+/);
    }
  });

  it("link the Middle Georgia page with descriptive text found in the answer", () => {
    const faq = idxFaqs.find((f) => "link" in f && f.link);
    expect(faq).toBeDefined();
    const link = (faq as { link: { text: string; href: string } }).link;
    expect(link.href).toBe("/website-design-middle-georgia");
    expect(link.text).toMatch(/website design/i);
    expect(faq!.answer).toContain(link.text);
  });
});
