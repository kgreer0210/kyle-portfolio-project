// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";

const sendGAEvent = vi.hoisted(() => vi.fn());

vi.mock("@next/third-parties/google", () => ({ sendGAEvent }));

import {
  trackBookCallClick,
  trackEmailClick,
  trackLead,
  trackPhoneClick,
} from "../analytics";

function visit(path: string) {
  window.history.replaceState(null, "", path);
}

beforeEach(() => {
  sendGAEvent.mockClear();
  visit("/");
});

describe("trackLead", () => {
  it("sends generate_lead with the subject and CTA location", () => {
    trackLead({ subject: "New website", ctaLocation: "contact_page" });

    expect(sendGAEvent).toHaveBeenCalledTimes(1);
    expect(sendGAEvent).toHaveBeenCalledWith("event", "generate_lead", {
      subject: "New website",
      cta_location: "contact_page",
    });
  });
});

describe("CTA click events", () => {
  it("sends book_call_click with the CTA location", () => {
    trackBookCallClick("hero");

    expect(sendGAEvent).toHaveBeenCalledTimes(1);
    expect(sendGAEvent).toHaveBeenCalledWith("event", "book_call_click", {
      cta_location: "hero",
    });
  });

  it("sends phone_click with the CTA location", () => {
    trackPhoneClick("mobile_menu");

    expect(sendGAEvent).toHaveBeenCalledTimes(1);
    expect(sendGAEvent).toHaveBeenCalledWith("event", "phone_click", {
      cta_location: "mobile_menu",
    });
  });

  it("sends email_click with the CTA location", () => {
    trackEmailClick("footer");

    expect(sendGAEvent).toHaveBeenCalledTimes(1);
    expect(sendGAEvent).toHaveBeenCalledWith("event", "email_click", {
      cta_location: "footer",
    });
  });
});

describe("excluded paths", () => {
  it.each([
    "/admin",
    "/admin/clients/abc",
    "/portal",
    "/portal/tickets/123",
    "/login",
    "/auth/callback",
    "/reset-password",
  ])("sends nothing on %s", (path) => {
    visit(path);

    trackLead({ subject: "Help", ctaLocation: "contact_page" });
    trackBookCallClick("header");
    trackPhoneClick("footer");
    trackEmailClick("footer");

    expect(sendGAEvent).not.toHaveBeenCalled();
  });
});

describe("a broken gtag", () => {
  it("never throws into the action being tracked", () => {
    sendGAEvent.mockImplementationOnce(() => {
      throw new Error("gtag blocked");
    });
    expect(() =>
      trackLead({ subject: "New website", ctaLocation: "contact_page" }),
    ).not.toThrow();
  });
});
