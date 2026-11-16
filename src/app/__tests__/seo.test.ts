import { describe, expect, it, vi } from "vitest";
import robots from "../robots";
import sitemap from "../sitemap";
import { metadata as rootMetadata } from "../layout";
import { metadata as homeMetadata } from "../page";
import { metadata as aboutMetadata } from "../about/page";
import { metadata as servicesMetadata } from "../services/page";
import { metadata as projectsMetadata } from "../projects/page";
import { metadata as contactMetadata } from "../contact/page";
import { metadata as idxMetadata } from "../idx/page";
import { generateMetadata as projectMetadata } from "../projects/[projectId]/page";
import { projects, isComingSoonProject } from "@/data/projects";
import { CANONICAL_SITE_URL } from "@/lib/siteUrl";

// The root layout pulls in global CSS, Google fonts, and the client shell,
// none of which matter for its exported metadata.
vi.mock("../globals.css", () => ({}));
vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "" }),
  Geist_Mono: () => ({ variable: "" }),
}));
vi.mock("@/components/AppShell", () => ({ default: () => null }));

describe("canonical host", () => {
  it("is the www origin", () => {
    expect(CANONICAL_SITE_URL).toBe("https://www.kygrsolutions.com");
  });

  it("uses www for every sitemap URL", () => {
    const urls = sitemap().map((entry) => entry.url);
    expect(urls.length).toBeGreaterThan(0);
    for (const url of urls) {
      expect(url.startsWith("https://www.kygrsolutions.com")).toBe(true);
    }
    expect(urls).toContain("https://www.kygrsolutions.com");
    expect(urls).toContain("https://www.kygrsolutions.com/about");
  });

  it("points robots at the www sitemap", () => {
    expect(robots().sitemap).toBe("https://www.kygrsolutions.com/sitemap.xml");
  });

  it("sets metadataBase and openGraph.url to www", () => {
    expect(String(rootMetadata.metadataBase)).toBe(
      "https://www.kygrsolutions.com/",
    );
    expect(rootMetadata.openGraph?.url).toBe("https://www.kygrsolutions.com");
  });

  it("does not set a canonical on the root layout (it would leak to private pages)", () => {
    expect(rootMetadata.alternates).toBeUndefined();
  });
});

describe("self-referencing canonicals", () => {
  it.each([
    ["/", homeMetadata],
    ["/about", aboutMetadata],
    ["/services", servicesMetadata],
    ["/projects", projectsMetadata],
    ["/contact", contactMetadata],
    ["/idx", idxMetadata],
  ])("%s declares its own canonical", (path, metadata) => {
    expect(metadata.alternates?.canonical).toBe(path);
  });

  it("project detail pages declare their own canonical", async () => {
    const project = projects.find((p) => !isComingSoonProject(p));
    expect(project).toBeDefined();
    const metadata = await projectMetadata({
      params: Promise.resolve({ projectId: project!.id }),
    });
    expect(metadata.alternates?.canonical).toBe(`/projects/${project!.id}`);
  });

  it("unknown project ids get no canonical", async () => {
    const metadata = await projectMetadata({
      params: Promise.resolve({ projectId: "does-not-exist" }),
    });
    expect(metadata.alternates).toBeUndefined();
  });
});
