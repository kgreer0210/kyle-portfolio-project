// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createElement, type ReactNode } from "react";

const sendGAEvent = vi.hoisted(() => vi.fn());

vi.mock("@next/third-parties/google", () => ({ sendGAEvent }));

vi.mock("next/navigation", () => ({ usePathname: () => "/contact" }));

// Render motion.* as the plain element, dropping animation-only props.
vi.mock("motion/react", () => {
  const strip = new Set([
    "initial",
    "animate",
    "exit",
    "transition",
    "whileHover",
    "whileTap",
    "whileInView",
    "viewport",
  ]);
  const motion = new Proxy(
    {},
    {
      get:
        (_target, tag: string) =>
        ({ children, ...props }: { children?: ReactNode }) =>
          createElement(
            tag,
            Object.fromEntries(
              Object.entries(props).filter(([key]) => !strip.has(key)),
            ),
            children,
          ),
    },
  );
  return { motion };
});

import ContactClient from "@/app/contact/ContactClient";
import Footer from "../Footer";
import {
  CONSULT_CALL_URL,
  EMAIL_HREF,
  PHONE_HREF,
} from "@/data/contact";

function linksTo(href: string) {
  return screen
    .getAllByRole("link")
    .filter((link) => link.getAttribute("href") === href);
}

function eventsNamed(name: string) {
  return sendGAEvent.mock.calls
    .filter((call) => call[1] === name)
    .map((call) => call[2]);
}

beforeEach(() => {
  sendGAEvent.mockClear();
  window.history.replaceState(null, "", "/contact");
});

afterEach(cleanup);

describe("contact page click tracking", () => {
  it("tracks every tel: link as phone_click from contact_page", () => {
    render(<ContactClient />);
    const phoneLinks = linksTo(PHONE_HREF);
    expect(phoneLinks.length).toBeGreaterThan(0);

    phoneLinks.forEach((link) => fireEvent.click(link));

    expect(eventsNamed("phone_click")).toEqual(
      phoneLinks.map(() => ({ cta_location: "contact_page" })),
    );
  });

  it("tracks every mailto: link as email_click from contact_page", () => {
    render(<ContactClient />);
    const emailLinks = linksTo(EMAIL_HREF);
    expect(emailLinks.length).toBeGreaterThan(0);

    emailLinks.forEach((link) => fireEvent.click(link));

    expect(eventsNamed("email_click")).toEqual(
      emailLinks.map(() => ({ cta_location: "contact_page" })),
    );
  });

  it("tracks every Calendly link as book_call_click from contact_page", () => {
    render(<ContactClient />);
    const callLinks = linksTo(CONSULT_CALL_URL);
    expect(callLinks.length).toBeGreaterThan(0);

    callLinks.forEach((link) => fireEvent.click(link));

    expect(eventsNamed("book_call_click")).toEqual(
      callLinks.map(() => ({ cta_location: "contact_page" })),
    );
  });

  it("places the form before the contact information in reading order", () => {
    render(<ContactClient />);
    const firstField = screen.getByLabelText(/Name/);
    const infoHeading = screen.getByRole("heading", {
      name: "Contact Information",
    });

    expect(
      firstField.compareDocumentPosition(infoHeading) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});

describe("footer click tracking", () => {
  it("tracks the phone and email links with cta_location footer", () => {
    window.history.replaceState(null, "", "/");
    render(<Footer />);

    fireEvent.click(linksTo(PHONE_HREF)[0]);
    fireEvent.click(linksTo(EMAIL_HREF)[0]);

    expect(eventsNamed("phone_click")).toEqual([{ cta_location: "footer" }]);
    expect(eventsNamed("email_click")).toEqual([{ cta_location: "footer" }]);
  });
});
