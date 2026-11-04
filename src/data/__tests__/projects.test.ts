import { existsSync } from "node:fs";
import { join } from "node:path";
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

  it("lists Lisa Dunn Real Estate as a completed project after the first one", () => {
    const index = projects.findIndex(
      (project) => project.id === "lisa-dunn-real-estate",
    );
    expect(index).toBeGreaterThan(0);
    expect(projects[index].status).toBe("completed");
    expect(isComingSoonProject(projects[index])).toBe(false);
    expect(projects[index].liveUrl).toBe("https://lisardunnrealtor.com");
  });

  it("points every Lisa Dunn screenshot at an existing file", () => {
    const lisa = projects.find(
      (project) => project.id === "lisa-dunn-real-estate",
    );
    const images = [
      lisa?.image,
      ...(lisa?.backendShowcase?.screenshots.map((shot) => shot.image) ?? []),
    ];
    expect(images).toHaveLength(5);
    for (const image of images) {
      expect(existsSync(join(process.cwd(), "public", image ?? ""))).toBe(true);
    }
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

  it("are the only entries left out of the default published list", () => {
    expect(getPublishedProjects().map((project) => project.id)).toEqual(
      projects
        .filter((project) => !isComingSoonProject(project))
        .map((project) => project.id),
    );
  });
});
