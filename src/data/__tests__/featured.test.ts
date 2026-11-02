import { describe, expect, it } from "vitest";
import {
  FEATURED_PROJECT_IDS,
  getFeaturedProjects,
  projects,
} from "../projects";

describe("featured projects", () => {
  it("returns Dexter first and Lexi second", () => {
    expect(getFeaturedProjects().map((project) => project.id)).toEqual([
      "dexter-gordy-realtor",
      "lexisFreshSlateCleanings",
    ]);
  });

  it("only lists ids that exist in projects", () => {
    const ids = projects.map((project) => project.id);
    for (const id of FEATURED_PROJECT_IDS) {
      expect(ids).toContain(id);
    }
  });
});
