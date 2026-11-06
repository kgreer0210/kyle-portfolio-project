import { describe, expect, it } from "vitest";
import { buildSystemPrompt } from "@/lib/chatKnowledge";
import type { Project } from "@/types";

const base = { messageCount: 1 };

function sample(title: string): Project {
  return {
    id: title,
    title,
    description: `${title} description.`,
    image: "/x.png",
    technologies: ["Next.js"],
    status: "completed",
  };
}

describe("system prompt project knowledge", () => {
  it("names the current portfolio projects from projects.ts", () => {
    const prompt = buildSystemPrompt(base);
    for (const title of [
      "Dexter Gordy Realtor",
      "Lisa Dunn Real Estate",
      "Lexi's Fresh Slate Cleanings",
      "Mid-State Baptist Association",
      "Mise AI",
    ]) {
      expect(prompt).toContain(title);
    }
  });

  it("gets every project name from the portfolio data, not the Markdown", () => {
    const prompt = buildSystemPrompt({ ...base, projects: [] });
    for (const name of ["Dexter", "Lisa Dunn", "Lexi", "Mid-State", "Mise"]) {
      expect(prompt).not.toContain(name);
    }
  });

  it("follows changes to the portfolio", () => {
    const prompt = buildSystemPrompt({ ...base, projects: [sample("Zeta Works")] });
    expect(prompt).toContain("Zeta Works");
    expect(prompt).not.toContain("Dexter Gordy Realtor");
  });

  it("no longer claims an in-progress realtor phone agent", () => {
    const prompt = buildSystemPrompt(base);
    expect(prompt).not.toMatch(/AI phone assistant/i);
    expect(prompt).not.toMatch(/realtor AI/i);
    expect(prompt).not.toMatch(/answers her (initial )?(client )?calls/i);
    expect(prompt).not.toMatch(/currently in progress/i);
    expect(prompt).toMatch(/Voice and phone agents are something I can build/);
  });
});

describe("system prompt copy rules", () => {
  const prompt = buildSystemPrompt(base);

  it("includes Kyle's direct line and no other phone number", () => {
    expect(prompt).toContain("(478) 777-1266");
    const phones = prompt.match(/\(\d{3}\) \d{3}-\d{4}/g) ?? [];
    expect(new Set(phones)).toEqual(new Set(["(478) 777-1266"]));
  });

  it("never contains a dollar amount", () => {
    expect(prompt).not.toMatch(/\$\s?\d/);
  });

  it("only mentions 'real-time' as something never to say", () => {
    const lines = prompt.split("\n").filter((line) => /real[- ]time/i.test(line));
    expect(lines.length).toBeGreaterThan(0);
    for (const line of lines) {
      expect(line).toMatch(/\b(never|do not|don't)\b/i);
    }
  });

  it("keeps the IDX guardrails", () => {
    expect(prompt).toContain("Georgia MLS (GAMLS)");
    expect(prompt).toContain("Central Georgia MLS (CGMLS)");
    expect(prompt).toMatch(/Never claim an MLS endorses KYGR/);
    expect(prompt).toMatch(/never use or describe MLS logos/);
    expect(prompt).toMatch(/Never imply KYGR or a client owns the listing data/);
    expect(prompt).toMatch(/never claim the IDX search includes sold data/);
    expect(prompt).toMatch(/Never quote an IDX price/);
    expect(prompt).toMatch(/never describe what a screenshot shows/);
    expect(prompt).toMatch(/never make traffic, performance, or results claims/);
  });

  it("allows naming only the published IDX sites, not a stale static list", () => {
    expect(prompt).toMatch(/name the IDX sites listed in the Projects section/);
    expect(prompt).toMatch(/never invent another IDX client/);
  });

  it("does not contradict itself about naming IDX client sites", () => {
    expect(prompt).not.toMatch(/name an IDX client/i);
    expect(prompt).not.toMatch(/Do not invent a client showcase/i);
  });

  it("keeps the no-price and answer-first rules", () => {
    expect(prompt).toMatch(/Never quote a price/);
    expect(prompt).toMatch(/ANSWER FIRST/);
    expect(prompt).toMatch(/Never ask more than one question per message/);
  });
});

describe("system prompt contact capture state", () => {
  it("lets the assistant ask once, as its only question, when asked to", () => {
    const prompt = buildSystemPrompt({ ...base, askForContact: true });
    expect(prompt).toContain("ASK NOW");
    expect(prompt).toMatch(/your one question this message/);
    expect(prompt).toMatch(/Name gathering: not in this message/);
  });

  it("forbids asking before the guard allows it", () => {
    const prompt = buildSystemPrompt({ ...base, askForContact: false });
    expect(prompt).not.toContain("ASK NOW");
    expect(prompt).toMatch(/Do NOT ask for an email or phone number yet/);
  });

  it("never asks when contact is already on file, and never contains the values", () => {
    const prompt = buildSystemPrompt({
      ...base,
      askForContact: true,
      hasEmail: true,
    });
    expect(prompt).not.toContain("ASK NOW");
    expect(prompt).toMatch(/Contact details on file: email\. Do NOT ask/);
    expect(prompt).not.toMatch(/@\w+\.\w+/);
  });
});
