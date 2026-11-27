// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { CONSULT_CALL_URL } from "@/data/contact";

vi.mock("motion/react", () => import("@/test/motionMock"));
vi.mock("next/navigation", () => ({ usePathname: () => "/about" }));
vi.mock("@/lib/analytics", () => ({
  trackBookCallClick: vi.fn(),
  trackMessageClick: vi.fn(),
}));

import { trackBookCallClick } from "@/lib/analytics";
import AboutClient from "../AboutClient";
import { metadata } from "../page";

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe("/about page", () => {
  it("has one H1 followed by the H2 Who I am", () => {
    render(<AboutClient />);
    const headings = screen.getAllByRole("heading");
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(headings[0].tagName).toBe("H1");
    expect(headings[1].tagName).toBe("H2");
    expect(headings[1]).toHaveTextContent("Who I am");
  });

  it("shows the How I work and What I care about sections with their cards", () => {
    render(<AboutClient />);
    const h2s = screen
      .getAllByRole("heading", { level: 2 })
      .map((h) => h.textContent);
    expect(h2s).toEqual([
      "Who I am",
      "How I work",
      "What I care about",
      "Got an idea you’ve been carrying around?",
    ]);
    const h3s = screen
      .getAllByRole("heading", { level: 3 })
      .map((h) => h.textContent);
    expect(h3s).toEqual([
      "You work directly with me.",
      "Built around your workflow.",
      "Plain English, no surprises.",
      "Still here after launch.",
      "Craftsmanship.",
      "Honesty.",
      "Lasting relationships.",
    ]);
  });

  it("speaks in first person in the Who I am copy", () => {
    render(<AboutClient />);
    expect(
      screen.getByText(/I’m Kyle Greer, a software developer based in Middle Georgia/),
    ).toBeInTheDocument();
    expect(screen.getByText(/stand behind the work long after launch/)).toBeInTheDocument();
  });

  it("no longer shows the retired About sections and stories", () => {
    const { container } = render(<AboutClient />);
    const text = container.textContent ?? "";
    for (const gone of [
      "Why I build",
      "Mission",
      "Where I’m headed",
      "Values",
      "$138,000",
      "nobody complained",
      "Fresh Slate",
      "Built with Purpose",
      "People Over Platforms",
      "Clarity & Craftsmanship",
      "Trust Through Partnership",
    ]) {
      expect(text).not.toContain(gone);
    }
    expect(text).not.toMatch(/\bwe\b|the team|real-time/i);
  });

  it("uses curly quotes, not straight ones, in body copy", () => {
    const { container } = render(<AboutClient />);
    expect(container.textContent).not.toMatch(/["']/);
  });

  it("offers Book a 30-min call first and Send me a message second", () => {
    render(<AboutClient />);
    const call = screen.getByRole("link", { name: /Book a 30-min call/ });
    const message = screen.getByRole("link", { name: "Send me a message" });
    expect(call).toHaveAttribute("href", CONSULT_CALL_URL);
    expect(call).toHaveAttribute("target", "_blank");
    expect(message).toHaveAttribute("href", "/contact");
    expect(
      call.compareDocumentPosition(message) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    fireEvent.click(call);
    expect(trackBookCallClick).toHaveBeenCalledWith("about");
  });

  it("never nests a button inside a link", () => {
    const { container } = render(<AboutClient />);
    expect(container.querySelector("a button")).toBeNull();
  });

  it("has a first-person meta description with typographic quotes", () => {
    expect(metadata.description).not.toMatch(/["']/);
    expect(metadata.description).toBe(
      "I’m Kyle Greer, a Middle Georgia software developer and founder of KYGR Solutions. I build custom websites and web apps for small businesses, realtors, and organizations, and I stand behind the work long after launch.",
    );
  });
});
