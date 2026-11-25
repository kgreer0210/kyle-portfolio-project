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
  it("lists Level Up Media Outlet first and Dexter Gordy Realtor second", () => {
    expect(projects[0].id).toBe("level-up-media-outlet");
    expect(projects[1].id).toBe("dexter-gordy-realtor");
  });

  it("keeps the existing projects in their original order", () => {
    expect(projects.map((project) => project.id)).toEqual([
      "level-up-media-outlet",
      "dexter-gordy-realtor",
      "mise-ai",
      "lisa-dunn-real-estate",
      "lexisFreshSlateCleanings",
      "f3-warner-robins",
      "mid-state-baptist-association",
    ]);
  });

  it("lists Level Up Media Outlet as a completed project", () => {
    const levelUp = projects.find(
      (project) => project.id === "level-up-media-outlet",
    );
    expect(levelUp?.status).toBe("completed");
    expect(levelUp?.liveUrl).toBe("https://levelupmediaoutlet.com");
  });

  it("points every Level Up Media Outlet image at an existing file", () => {
    const levelUp = projects.find(
      (project) => project.id === "level-up-media-outlet",
    );
    const images = [
      levelUp?.image,
      ...(levelUp?.backendShowcase?.screenshots.map((shot) => shot.image) ??
        []),
    ];
    expect(images).toHaveLength(4);
    for (const image of images) {
      expect(image).toMatch(/^\/projects\/level-up-media-outlet\/[a-z0-9-]+\.png$/);
      expect(existsSync(join(process.cwd(), "public", image ?? ""))).toBe(true);
    }
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

/** Every visible string in a project, including its showcase screenshots. */
function projectCopy(project: Project): string {
  const showcase = project.backendShowcase;
  return [
    project.title,
    project.description,
    project.role,
    project.challenge,
    project.outcome,
    project.idxLink?.text,
    project.idxLink?.linkLabel,
    showcase?.title,
    showcase?.subtitle,
    showcase?.description,
    ...(showcase?.screenshots.flatMap((shot) => [
      shot.title,
      shot.description,
      ...shot.features,
    ]) ?? []),
  ]
    .filter(Boolean)
    .join("\n");
}

describe("project copy", () => {
  it.each(projects.map((project) => [project.id, project] as const))(
    "%s makes no sold-data claims",
    (_id, project) => {
      expect(projectCopy(project)).not.toMatch(/\bsold\b|recent sales/i);
    },
  );

  it.each(projects.map((project) => [project.id, project] as const))(
    "%s implies no MLS endorsement",
    (_id, project) => {
      expect(projectCopy(project)).not.toMatch(/MLS approved|approved the site/i);
    },
  );

  it.each(projects.map((project) => [project.id, project] as const))(
    "%s never says real-time",
    (_id, project) => {
      expect(projectCopy(project)).not.toMatch(/real-?time/i);
    },
  );

  it("keeps prices, the owner's name, and contact details out of Level Up copy", () => {
    const levelUp = projects.find((p) => p.id === "level-up-media-outlet");
    expect(levelUp).toBeDefined();
    const copy = projectCopy(levelUp!);
    expect(copy).not.toContain("$");
    expect(copy).not.toMatch(/nelson/i);
    expect(copy).not.toMatch(/doppler/i);
    // No phone numbers or street addresses.
    expect(copy).not.toMatch(/\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/);
    expect(copy).not.toMatch(
      /\d+\s+\w+(\s\w+)*\s(street|st|avenue|ave|road|rd|drive|dr|lane|ln|boulevard|blvd|way|court|ct|highway|hwy)\b/i,
    );
  });

  it("labels the Level Up phone screenshot Mobile friendly", () => {
    const levelUp = projects.find((p) => p.id === "level-up-media-outlet");
    const titles = levelUp?.backendShowcase?.screenshots.map((s) => s.title);
    expect(titles).toContain("Mobile friendly");
    expect(projectCopy(levelUp!)).not.toMatch(/phone view/i);
  });

  it("keeps photo counts out of Level Up copy", () => {
    const levelUp = projects.find((p) => p.id === "level-up-media-outlet");
    const copy = projectCopy(levelUp!);
    expect(copy).not.toContain("49");
    expect(copy).not.toMatch(/\d+[\s-]+(sports\s+)?photos?\b/i);
    expect(copy).toContain("browse a collection of sports photos");
    const portfolio = levelUp?.backendShowcase?.screenshots.find(
      (s) => s.id === "portfolio",
    );
    expect(portfolio?.description).toBe(
      "The public portfolio gallery holds a collection of sports photos from football, softball, basketball, and baseball.",
    );
    expect(portfolio?.features).toContain("Collection of sports photos");
  });

  it("describes Dexter's site with plain listings wording", () => {
    const dexter = projects.find((p) => p.id === "dexter-gordy-realtor");
    expect(dexter?.description).toMatch(/featured listings/);
  });

  it("describes Lisa's IDX setup neutrally under CGMLS rules", () => {
    const lisa = projects.find((p) => p.id === "lisa-dunn-real-estate");
    expect(lisa?.outcome).toMatch(/set up for IDX listings under CGMLS rules/);
  });
});
