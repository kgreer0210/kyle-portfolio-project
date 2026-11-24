// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { CONSULT_CALL_URL, EMAIL_HREF, PHONE_HREF } from "@/data/contact";

vi.mock("motion/react", () => import("@/test/motionMock"));
vi.mock("next/navigation", () => ({
  usePathname: () => "/website-design-middle-georgia",
}));
vi.mock("@/lib/analytics", () => ({
  trackBookCallClick: vi.fn(),
  trackPhoneClick: vi.fn(),
  trackEmailClick: vi.fn(),
  trackMessageClick: vi.fn(),
}));

import {
  trackBookCallClick,
  trackEmailClick,
  trackMessageClick,
  trackPhoneClick,
} from "@/lib/analytics";
import WebsiteDesignMiddleGeorgiaClient from "../WebsiteDesignMiddleGeorgiaClient";

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe("/website-design-middle-georgia page", () => {
  it("labels every contact-form CTA Send me a message", () => {
    const { container } = render(<WebsiteDesignMiddleGeorgiaClient />);
    expect(screen.queryByText(/Use the contact form|Contact me/)).toBeNull();
    const formLinks = container.querySelectorAll('a[href="/contact"]');
    expect(formLinks.length).toBe(2);
    formLinks.forEach((a) => expect(a).toHaveTextContent("Send me a message"));
  });

  it("tracks every Send me a message click as message_click from local_landing", () => {
    const { container } = render(<WebsiteDesignMiddleGeorgiaClient />);
    const formLinks = container.querySelectorAll('a[href="/contact"]');
    formLinks.forEach((a) => fireEvent.click(a));
    expect(trackMessageClick).toHaveBeenCalledTimes(formLinks.length);
    for (const call of vi.mocked(trackMessageClick).mock.calls) {
      expect(call).toEqual(["local_landing"]);
    }
  });

  it("tracks Calendly, phone, and email clicks as local_landing", () => {
    const { container } = render(<WebsiteDesignMiddleGeorgiaClient />);
    const groups = [
      [CONSULT_CALL_URL, trackBookCallClick],
      [PHONE_HREF, trackPhoneClick],
      [EMAIL_HREF, trackEmailClick],
    ] as const;
    for (const [href, fn] of groups) {
      const links = container.querySelectorAll(`a[href="${href}"]`);
      expect(links.length).toBeGreaterThan(0);
      links.forEach((a) => fireEvent.click(a));
      expect(fn).toHaveBeenCalledTimes(links.length);
      for (const call of vi.mocked(fn).mock.calls) {
        expect(call).toEqual(["local_landing"]);
      }
    }
  });

  it("makes no sold-data claims about Dexter's site", () => {
    const { container } = render(<WebsiteDesignMiddleGeorgiaClient />);
    expect(container.textContent).not.toMatch(/\bsold\b|recent sales/i);
    expect(container.textContent).not.toMatch(/real-?time/i);
  });

  it("never nests a button inside a link", () => {
    const { container } = render(<WebsiteDesignMiddleGeorgiaClient />);
    expect(container.querySelector("a button")).toBeNull();
  });
});
