// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { CONSULT_CALL_URL } from "@/data/contact";

vi.mock("motion/react", () => import("@/test/motionMock"));
vi.mock("next/navigation", () => ({ usePathname: () => "/about" }));
vi.mock("@/lib/analytics", () => ({ trackBookCallClick: vi.fn() }));

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

  it("speaks in first person about where it is headed", () => {
    render(<AboutClient />);
    expect(
      screen.getByRole("heading", { level: 2, name: "Where I’m headed" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Where we/)).toBeNull();
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

  it("has a first-person meta description", () => {
    expect(metadata.description).toBe(
      "I’m Kyle Greer, founder of KYGR Solutions: a husband, father, and man of faith who turns the ideas people carry around into software that makes their lives easier.",
    );
  });
});
