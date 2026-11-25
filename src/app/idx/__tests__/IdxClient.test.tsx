// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { CONSULT_CALL_URL, EMAIL_HREF, PHONE_HREF } from "@/data/contact";

vi.mock("motion/react", () => import("@/test/motionMock"));
vi.mock("next/navigation", () => ({ usePathname: () => "/idx" }));
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
import IdxClient from "../IdxClient";

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe("/idx page", () => {
  it("links the Middle Georgia page from the FAQ with descriptive text", () => {
    const { container } = render(<IdxClient />);
    const faq = container.querySelector("details:last-of-type") as HTMLElement;
    const link = within(faq).getByRole("link", {
      name: "my website design page for Middle Georgia",
    });
    expect(link).toHaveAttribute("href", "/website-design-middle-georgia");
    expect(faq.textContent).not.toMatch(/ \/website-design-middle-georgia/);
  });

  it("labels its contact-form CTAs Send me a message", () => {
    render(<IdxClient />);
    const links = screen.getAllByRole("link", { name: "Send me a message" });
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link.getAttribute("href")).toMatch(/^\/contact/);
    }
  });

  it("tracks every Send me a message click as message_click from idx", () => {
    render(<IdxClient />);
    const links = screen.getAllByRole("link", { name: "Send me a message" });
    links.forEach((a) => fireEvent.click(a));
    expect(trackMessageClick).toHaveBeenCalledTimes(links.length);
    for (const call of vi.mocked(trackMessageClick).mock.calls) {
      expect(call).toEqual(["idx"]);
    }
  });

  it("tracks Calendly, phone, and email clicks as idx", () => {
    const { container } = render(<IdxClient />);
    const calls = container.querySelectorAll(`a[href="${CONSULT_CALL_URL}"]`);
    const phones = container.querySelectorAll(`a[href="${PHONE_HREF}"]`);
    const emails = container.querySelectorAll(`a[href="${EMAIL_HREF}"]`);
    expect(calls.length).toBeGreaterThan(0);
    expect(phones.length).toBeGreaterThan(0);
    expect(emails.length).toBeGreaterThan(0);

    calls.forEach((a) => fireEvent.click(a));
    phones.forEach((a) => fireEvent.click(a));
    emails.forEach((a) => fireEvent.click(a));

    expect(trackBookCallClick).toHaveBeenCalledTimes(calls.length);
    expect(trackPhoneClick).toHaveBeenCalledTimes(phones.length);
    expect(trackEmailClick).toHaveBeenCalledTimes(emails.length);
    for (const fn of [trackBookCallClick, trackPhoneClick, trackEmailClick]) {
      for (const call of vi.mocked(fn).mock.calls) expect(call).toEqual(["idx"]);
    }
  });

  it("never nests a button inside a link", () => {
    const { container } = render(<IdxClient />);
    expect(container.querySelector("a button")).toBeNull();
  });
});
