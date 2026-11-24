// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import axe from "axe-core";
import Testimonials from "../Testimonials";
import { GOOGLE_REVIEWS_URL } from "../../data/contact";

vi.mock("motion/react", () => ({
  motion: {
    section: "section",
    div: "div",
    h2: "h2",
    p: "p",
  },
}));

afterEach(cleanup);

describe("Testimonials", () => {
  it("supports single-finger swipes without treating multi-touch as a swipe", () => {
    const { container } = render(<Testimonials />);
    const track = container.querySelector('[aria-live="polite"]');
    const firstSlide = container.querySelector('[aria-label="1 of 4"]');
    const secondSlide = container.querySelector('[aria-label="2 of 4"]');

    expect(track).not.toBeNull();
    expect(firstSlide).toHaveAttribute("aria-hidden", "false");

    fireEvent.touchStart(track!, {
      touches: [{ clientX: 200, clientY: 100 }],
    });
    fireEvent.touchEnd(track!, {
      changedTouches: [{ clientX: 100, clientY: 100 }],
    });
    expect(secondSlide).toHaveAttribute("aria-hidden", "false");

    fireEvent.click(
      screen.getByRole("button", { name: "Go to testimonial 1 of 4" }),
    );
    fireEvent.touchStart(track!, {
      touches: [{ clientX: 100, clientY: 100 }],
    });
    fireEvent.touchStart(track!, {
      touches: [
        { clientX: 100, clientY: 100 },
        { clientX: 250, clientY: 100 },
      ],
    });
    fireEvent.touchEnd(track!, {
      changedTouches: [{ clientX: 250, clientY: 100 }],
    });
    expect(firstSlide).toHaveAttribute("aria-hidden", "false");
  });

  it("displays only the active slide and keeps controls before the card", () => {
    const { container } = render(<Testimonials />);
    const slides = Array.from(container.querySelectorAll("figure"));
    expect(slides).toHaveLength(4);
    expect(slides.filter((slide) => !slide.hidden)).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: "Next testimonial" }));
    expect(slides.map((slide) => slide.hidden)).toEqual([
      true,
      false,
      true,
      true,
    ]);

    const next = screen.getByRole("button", { name: "Next testimonial" });
    const track = container.querySelector('[aria-live="polite"]')!;
    expect(
      next.compareDocumentPosition(track) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("labels the section as Google reviews and links to all of them", () => {
    render(<Testimonials />);
    expect(
      screen.getByRole("heading", { level: 2, name: "Reviews from Google" }),
    ).toBeInTheDocument();
    const link = screen.getByRole("link", {
      name: /See all reviews on Google/,
    });
    expect(link).toHaveAttribute("href", GOOGLE_REVIEWS_URL);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
  });

  it("shows the excerpt first and the full review after expanding", () => {
    const { container } = render(<Testimonials />);
    const lexi = container.querySelector<HTMLElement>('[aria-label="1 of 4"]')!;
    const fullOnly = "it completely streamlined our daily operations";

    expect(lexi).toHaveTextContent("focus more on the strategic side");
    expect(lexi).not.toHaveTextContent(fullOnly);

    const toggle = screen.getByRole("button", { name: "Read the full review" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(lexi).toContainElement(toggle);

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(lexi).toHaveTextContent(fullOnly);
    expect(lexi).toHaveTextContent("grateful for his expertise and vision.");

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(lexi).not.toHaveTextContent(fullOnly);

    // Controls stay above the card whatever its height.
    const next = screen.getByRole("button", { name: "Next testimonial" });
    expect(
      next.compareDocumentPosition(lexi) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("shows reviews without an excerpt in full with no toggle", () => {
    const { container } = render(<Testimonials />);
    const dexter = container.querySelector<HTMLElement>(
      '[aria-label="2 of 4"]',
    )!;
    expect(dexter).toHaveTextContent(
      "I would highly recommend KYGR Solutions!",
    );
    expect(dexter.querySelector("button")).toBeNull();
  });

  it("uses one decorative quote device per card and no curly quotes", () => {
    const { container } = render(<Testimonials />);
    const slides = Array.from(container.querySelectorAll("figure"));
    for (const slide of slides) {
      const decorative = slide.querySelectorAll('svg[aria-hidden="true"]');
      expect(decorative).toHaveLength(1);
      expect(slide.querySelector("blockquote")?.textContent).not.toMatch(
        /[\u201C\u201D]/,
      );
    }
  });

  it("keeps the slide announcement without a role on figure", async () => {
    const { container } = render(<Testimonials />);
    for (const slide of Array.from(container.querySelectorAll("figure"))) {
      expect(slide).not.toHaveAttribute("role");
      expect(slide).toHaveAttribute("aria-roledescription", "slide");
    }
    const results = await axe.run(container, {
      runOnly: {
        type: "rule",
        values: [
          "aria-allowed-role",
          "aria-roledescription",
          "aria-allowed-attr",
        ],
      },
    });
    expect(results.violations).toEqual([]);
  });
});
