import { describe, expect, it } from "vitest";
import {
  getPublishedProjects,
  isComingSoonProject,
  projects,
} from "@/data/projects";
import type { Project } from "@/types";

const comingSoon: Project = {
  id: "placeholder",
  title: "Placeholder",
  description: "",
  image: "/projects/placeholder/hero.png",
  technologies: [],
  status: "coming-soon",
};

describe("projects data", () => {
  it("keeps Dexter Gordy Realtor first", () => {
    expect(projects[0].id).toBe("dexter-gordy-realtor");
  });

  it("has unique ids", () => {
    const ids = projects.map((project) => project.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("lists Lisa Dunn Real Estate as a coming-soon placeholder after the first project", () => {
    const index = projects.findIndex(
      (project) => project.id === "lisa-dunn-real-estate",
    );
    expect(index).toBeGreaterThan(0);
    expect(isComingSoonProject(projects[index])).toBe(true);
    expect(projects[index].liveUrl).toBeUndefined();
  });
});

describe("coming-soon projects", () => {
  it("are detected only by the coming-soon status", () => {
    expect(isComingSoonProject(comingSoon)).toBe(true);
    expect(isComingSoonProject({ ...comingSoon, status: "completed" })).toBe(
      false,
    );
    expect(isComingSoonProject({ ...comingSoon, status: undefined })).toBe(
      false,
    );
  });

  it("are excluded from published projects", () => {
    const live = { ...comingSoon, id: "live", status: "completed" as const };
    expect(getPublishedProjects([comingSoon, live])).toEqual([live]);
  });

  it("are excluded from the default published list", () => {
    const ids = getPublishedProjects().map((project) => project.id);
    expect(ids).not.toContain("lisa-dunn-real-estate");
    expect(ids[0]).toBe("dexter-gordy-realtor");
  });
});
