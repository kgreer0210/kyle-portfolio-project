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

import AppShell from "../AppShell";

const FOCUSABLE = "a[href], button, input, select, textarea, [tabindex]";
const LANDMARKS = "header, nav, main, footer, aside, section[aria-label], [role]";

afterEach(cleanup);

function renderShell() {
  return render(
    <AppShell>
      <main>
        <h1>Page</h1>
      </main>
    </AppShell>,
  );
}

describe("AppShell", () => {
  it("makes a Skip to content link the first focusable element, targeting the main content", () => {
    const { container } = renderShell();
    const first = container.querySelector(FOCUSABLE);
    expect(first).toBe(screen.getByRole("link", { name: "Skip to content" }));

    const targetId = first!.getAttribute("href")!.replace(/^#/, "");
    const target = document.getElementById(targetId);
    expect(target).not.toBeNull();
    expect(target!.querySelector("main")).not.toBeNull();
    expect(target).toHaveAttribute("tabindex", "-1");
  });

  it("keeps floating controls inside a landmark", () => {
    renderShell();
    for (const name of ["Chat", "Back to top"]) {
      expect(screen.getByRole("button", { name }).closest(LANDMARKS)).not.toBeNull();
    }
  });
});
