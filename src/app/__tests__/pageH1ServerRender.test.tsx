// @vitest-environment jsdom
import type { ComponentType } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";

const route = vi.hoisted(() => ({ pathname: "/", projectId: "" }));
vi.mock("next/navigation", () => ({
  usePathname: () => route.pathname,
  useParams: () => ({ projectId: route.projectId }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@next/third-parties/google", () => ({ sendGAEvent: vi.fn() }));

import AboutClient from "../about/AboutClient";
import ContactClient from "../contact/ContactClient";
import IdxClient from "../idx/IdxClient";
import ProjectDetailClient from "../projects/[projectId]/ProjectDetailClient";
import ProjectsClient from "../projects/ProjectsClient";
import ServicesClient from "../services/ServicesClient";
import WebsiteDesignMiddleGeorgiaClient from "../website-design-middle-georgia/WebsiteDesignMiddleGeorgiaClient";
import { projects } from "../../data/projects";

const HIDDEN_STYLE = /opacity:\s*0(?![.\d])|visibility:\s*hidden|display:\s*none/;

const PAGES: Array<{
  name: string;
  pathname: string;
  projectId?: string;
  Page: ComponentType;
}> = [
  { name: "/services", pathname: "/services", Page: ServicesClient },
  { name: "/about", pathname: "/about", Page: AboutClient },
  { name: "/contact", pathname: "/contact", Page: ContactClient },
  { name: "/projects", pathname: "/projects", Page: ProjectsClient },
  {
    name: "/projects/[projectId]",
    pathname: `/projects/${projects[0].id}`,
    projectId: projects[0].id,
    Page: ProjectDetailClient,
  },
  { name: "/idx", pathname: "/idx", Page: IdxClient },
  {
    name: "/website-design-middle-georgia",
    pathname: "/website-design-middle-georgia",
    Page: WebsiteDesignMiddleGeorgiaClient,
  },
];

describe("page H1s in server HTML", () => {
  it.each(PAGES)(
    "$name paints its H1 immediately: no hidden style on the H1 or any ancestor",
    ({ pathname, projectId, Page }) => {
      route.projectId = projectId ?? "";
      const doc = serverDocument(Page, pathname);
      const h1s = doc.querySelectorAll("h1");
      expect(h1s).toHaveLength(1);
      expect(h1s[0].textContent?.trim()).not.toBe("");

      expectVisible(h1s[0]);
    },
  );
});

function expectVisible(target: Element) {
  for (let el: Element | null = target; el; el = el.parentElement) {
    const style = el.getAttribute("style") ?? "";
    expect(style, `<${el.tagName.toLowerCase()}> style`).not.toMatch(
      HIDDEN_STYLE,
    );
    expect(el.hasAttribute("hidden")).toBe(false);
  }
}

function serverDocument(Page: ComponentType, pathname: string) {
  route.pathname = pathname;
  const html = renderToString(<Page />);
  return new DOMParser().parseFromString(html, "text/html");
}

describe("mobile LCP elements in server HTML", () => {
  it("/about paints the Who I am copy without a reveal", () => {
    const doc = serverDocument(AboutClient, "/about");
    const heading = [...doc.querySelectorAll("h2")].find(
      (h) => h.textContent === "Who I am",
    );
    expect(heading).toBeDefined();
    const paragraph = heading!.parentElement!.querySelector("p");
    expect(paragraph).not.toBeNull();
    expectVisible(paragraph!);
  });

  it("/projects paints the first row of cards and loads the first image eagerly", () => {
    const doc = serverDocument(ProjectsClient, "/projects");
    const images = doc.querySelectorAll("img");
    expect(images.length).toBeGreaterThan(1);
    expectVisible(images[0]);
    expectVisible(images[1]);
    expect(images[0].getAttribute("loading")).not.toBe("lazy");
    expect(images[0].getAttribute("fetchpriority")).toBe("high");
  });
});
