// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import Testimonials from "../Testimonials";

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

    fireEvent.click(screen.getByRole("button", { name: "Go to testimonial 1 of 4" }));
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
    expect(slides.map((slide) => slide.hidden)).toEqual([true, false, true, true]);

    const next = screen.getByRole("button", { name: "Next testimonial" });
    const track = container.querySelector('[aria-live="polite"]')!;
    expect(
      next.compareDocumentPosition(track) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});
