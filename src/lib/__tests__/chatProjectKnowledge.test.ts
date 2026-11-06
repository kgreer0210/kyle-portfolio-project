import { describe, expect, it } from "vitest";
import {
  buildProjectKnowledge,
  selectKnowledgeProjects,
} from "@/lib/chatProjectKnowledge";
import type { Project } from "@/types";

function project(overrides: Partial<Project> = {}): Project {
  return {
    id: "sample",
    title: "Sample Project",
    description: "A sample site.",
    image: "/sample.png",
    technologies: ["Next.js"],
    status: "completed",
    ...overrides,
  };
}

describe("project knowledge from the portfolio", () => {
  it("covers the published portfolio projects, including both IDX realtor sites", () => {
    const text = buildProjectKnowledge();

    for (const title of [
      "Dexter Gordy Realtor",
      "Lisa Dunn Real Estate",
      "Lexi's Fresh Slate Cleanings",
      "Mid-State Baptist Association",
      "Mise AI",
    ]) {
      expect(text).toContain(`## ${title}`);
    }
  });

  it("uses the exact Lexi's Fresh Slate Cleanings title", () => {
    const text = buildProjectKnowledge();
    expect(text).toContain("Lexi's Fresh Slate Cleanings");
    expect(text).not.toMatch(/Lexi's Fresh Slate Cleaning(?!s)/);
  });

  it("leaves out coming-soon, in-progress, and planned projects", () => {
    const list = [
      project({ id: "a", title: "Live One" }),
      project({ id: "b", title: "Teaser", status: "coming-soon" }),
      project({ id: "c", title: "Underway", status: "in-progress" }),
      project({ id: "d", title: "Someday", status: "planned" }),
    ];

    const text = buildProjectKnowledge(list);

    expect(text).toContain("Live One");
    expect(text).not.toContain("Teaser");
    expect(text).not.toContain("Underway");
    expect(text).not.toContain("Someday");
    expect(selectKnowledgeProjects(list).map((p) => p.id)).toEqual(["a"]);
  });

  it("follows changes to the project data", () => {
    const before = [project({ id: "a", title: "Alpha Site" })];
    const after = [
      project({ id: "a", title: "Alpha Site" }),
      project({ id: "b", title: "Beta Portal", description: "A new portal." }),
    ];

    expect(buildProjectKnowledge(before)).not.toContain("Beta Portal");
    expect(buildProjectKnowledge(after)).toContain("Beta Portal");
    expect(buildProjectKnowledge(after.slice(1))).not.toContain("Alpha Site");
  });

  it("never includes screenshot captions, feature bullets, or the challenge text", () => {
    const text = buildProjectKnowledge([
      project({
        challenge: "SECRET-CHALLENGE-TEXT",
        backendShowcase: {
          available: true,
          description: "SHOWCASE-DESCRIPTION",
          screenshots: [
            {
              id: "s",
              title: "SCREENSHOT-TITLE",
              description: "SCREENSHOT-DESCRIPTION",
              image: "/s.png",
              features: ["SCREENSHOT-FEATURE"],
            },
          ],
        },
      }),
    ]);

    for (const leaked of [
      "SECRET-CHALLENGE-TEXT",
      "SHOWCASE-DESCRIPTION",
      "SCREENSHOT-TITLE",
      "SCREENSHOT-DESCRIPTION",
      "SCREENSHOT-FEATURE",
    ]) {
      expect(text).not.toContain(leaked);
    }
  });

  it("does not carry screenshot content from the real portfolio", () => {
    const text = buildProjectKnowledge();
    expect(text).not.toContain("Map-based search that starts in Middle Georgia");
    expect(text).not.toContain("/projects/");
  });

  it("bounds the number of projects and the length of each field", () => {
    const many = Array.from({ length: 30 }, (_, i) =>
      project({ id: `p${i}`, title: `Project ${i}`, description: "x".repeat(2000) }),
    );

    const text = buildProjectKnowledge(many);

    expect(text.match(/^## /gm)).toHaveLength(12);
    expect(text.length).toBeLessThan(12 * 1200);
  });

  it("tells the assistant not to name projects when there are none", () => {
    expect(buildProjectKnowledge([])).toMatch(/Do not name any past project/);
  });
});
