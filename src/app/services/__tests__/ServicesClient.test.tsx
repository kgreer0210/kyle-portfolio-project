// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { CONSULT_CALL_URL } from "@/data/contact";

vi.mock("motion/react", () => import("@/test/motionMock"));
vi.mock("next/navigation", () => ({ usePathname: () => "/services" }));
vi.mock("@/lib/analytics", () => ({ trackBookCallClick: vi.fn() }));

import { trackBookCallClick } from "@/lib/analytics";
import ServicesClient from "../ServicesClient";

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe("/services page", () => {
  it("offers Book a 30-min call first and Send me a message second", () => {
    render(<ServicesClient />);
    const call = screen.getByRole("link", { name: /Book a 30-min call/ });
    const message = screen.getByRole("link", { name: "Send me a message" });
    expect(call).toHaveAttribute("href", CONSULT_CALL_URL);
    expect(message).toHaveAttribute("href", "/contact");
    expect(
      call.compareDocumentPosition(message) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    fireEvent.click(call);
    expect(trackBookCallClick).toHaveBeenCalledWith("services");
  });

  it("drops the old consult label", () => {
    render(<ServicesClient />);
    expect(screen.queryByText(/Free Consult/i)).toBeNull();
  });

  it("never nests a button inside a link", () => {
    const { container } = render(<ServicesClient />);
    expect(container.querySelector("a button")).toBeNull();
    expect(container.querySelector("button")).toBeNull();
  });
});
