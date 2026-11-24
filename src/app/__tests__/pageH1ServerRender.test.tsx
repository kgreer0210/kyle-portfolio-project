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
      route.pathname = pathname;
      route.projectId = projectId ?? "";
      const html = renderToString(<Page />);
      const doc = new DOMParser().parseFromString(html, "text/html");
      const h1s = doc.querySelectorAll("h1");
      expect(h1s).toHaveLength(1);
      expect(h1s[0].textContent?.trim()).not.toBe("");

      for (let el: Element | null = h1s[0]; el; el = el.parentElement) {
        const style = el.getAttribute("style") ?? "";
        expect(style, `<${el.tagName.toLowerCase()}> style`).not.toMatch(
          HIDDEN_STYLE,
        );
        expect(el.hasAttribute("hidden")).toBe(false);
      }
    },
  );
});
