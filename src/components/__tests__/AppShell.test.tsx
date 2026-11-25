// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

// The WebGL background and the chat widget are out of scope here.
vi.mock("@/Particles/Particles", () => ({
  default: () => null,
  homepageParticleProps: {},
}));
vi.mock("@/components/ChatWidget", () => ({
  default: () => <button type="button">Chat</button>,
}));
vi.mock("@/components", () => ({
  Header: () => (
    <header>
      <a href="#top">Home</a>
    </header>
  ),
  Footer: () => <footer>Footer</footer>,
  BackToTop: () => <button type="button">Back to top</button>,
}));

import { useReducedMotionConfig } from "motion/react";
import AppShell from "../AppShell";

function MotionProbe() {
  return <p>{useReducedMotionConfig() ? "reduced" : "full"} motion</p>;
}

const FOCUSABLE = "a[href], button, input, select, textarea, [tabindex]";
const LANDMARKS = "header, nav, main, footer, aside, section[aria-label], [role]";

afterEach(cleanup);

function renderShell() {
  return render(
    <AppShell>
      <div>
        <h1>Page</h1>
      </div>
    </AppShell>,
  );
}

describe("AppShell", () => {
  it("makes a Skip to content link the first focusable element, targeting the main content", () => {
    const { container } = renderShell();
    const first = container.querySelector(FOCUSABLE);
    expect(first).toBe(screen.getByRole("link", { name: "Skip to content" }));

    const targetId = first!.getAttribute("href")!.replace(/^#/, "");
    expect(targetId).toBe("main-content");
    const target = document.getElementById(targetId);
    expect(target).not.toBeNull();
    // The skip target is the page's one <main> landmark, focusable for Safari.
    expect(target!.tagName).toBe("MAIN");
    expect(target).toHaveAttribute("tabindex", "-1");
    expect(target).toBe(screen.getByRole("main"));
  });

  it("renders exactly one <main>, with no nested <main> elements", () => {
    const { container } = renderShell();
    expect(container.querySelectorAll("main")).toHaveLength(1);
    expect(container.querySelector("main main")).toBeNull();
  });

  it("keeps floating controls inside a landmark", () => {
    renderShell();
    for (const name of ["Chat", "Back to top"]) {
      expect(screen.getByRole("button", { name }).closest(LANDMARKS)).not.toBeNull();
    }
  });

  it("makes public motion follow the visitor's reduced-motion setting", () => {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: query.startsWith("(prefers-reduced-motion"),
      media: query,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
    }));
    render(
      <AppShell>
        <div>
          <MotionProbe />
        </div>
      </AppShell>,
    );
    expect(screen.getByText("reduced motion")).toBeInTheDocument();
    vi.unstubAllGlobals();
  });
});
