// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import HomeClient from "../HomeClient";
import { CONSULT_CALL_URL } from "../../data/contact";
import { getFeaturedProjects } from "../../data/projects";

const sendGAEvent = vi.hoisted(() => vi.fn());
vi.mock("@next/third-parties/google", () => ({ sendGAEvent }));

beforeAll(() => {
  class NoopObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  vi.stubGlobal("IntersectionObserver", NoopObserver);
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
});

beforeEach(() => {
  sendGAEvent.mockClear();
  window.history.replaceState(null, "", "/");
});

afterEach(cleanup);

function serverDocument() {
  return new DOMParser().parseFromString(
    renderToString(<HomeClient />),
    "text/html",
  );
}

function sectionWithHeading(name: RegExp) {
  const heading = screen.getByRole("heading", { level: 2, name });
  const section = heading.closest("section");
  expect(section).not.toBeNull();
  return section as HTMLElement;
}

function clickWithoutNavigating(link: HTMLElement) {
  link.addEventListener("click", (event) => event.preventDefault());
  fireEvent.click(link);
}

describe("home page server HTML", () => {
  it("paints the hero H1 with no hidden page-level wrapper", () => {
    const h1 = serverDocument().querySelector("h1");
    expect(h1).not.toBeNull();
    for (let el: Element | null = h1; el; el = el.parentElement) {
      expect(el.getAttribute("style") ?? "").not.toMatch(/opacity:\s*0(?![.\d])/);
    }
  });

  it("has no <button> nested inside a link", () => {
    const doc = serverDocument();
    expect(doc.querySelectorAll("a button")).toHaveLength(0);
    expect(doc.querySelectorAll("button a")).toHaveLength(0);
  });
});

describe("home CTAs", () => {
  const CTA_LABEL = /book|call|consult|audit|schedule|email|message/i;

  it("uses only Book a 30-min call and Send me a message, each to its destination", () => {
    render(<HomeClient />);
    const ctas = screen
      .getAllByRole("link")
      .filter((link) => CTA_LABEL.test(link.textContent ?? ""));
    expect(ctas.length).toBeGreaterThanOrEqual(6);

    for (const link of ctas) {
      const label = (link.textContent ?? "").replace("(opens in a new tab)", "").trim();
      if (label === "Book a 30-min call") {
        expect(link).toHaveAttribute("href", CONSULT_CALL_URL);
      } else {
        expect(label).toBe("Send me a message");
        expect(link).toHaveAttribute("href", "/contact");
      }
    }
  });

  it.each([
    [/Is Your Tech Stack/, "home_tech_review"],
    [/Ready to grow your/, "home_final"],
  ])("section %s books a call (tracked as %s) and offers a message link", (heading, location) => {
    render(<HomeClient />);
    const section = within(sectionWithHeading(heading));

    const call = section.getByRole("link", { name: /^Book a 30-min call/ });
    expect(call).toHaveAttribute("href", CONSULT_CALL_URL);
    expect(call).toHaveAttribute("target", "_blank");
    clickWithoutNavigating(call);
    expect(sendGAEvent).toHaveBeenCalledWith("event", "book_call_click", {
      cta_location: location,
    });

    const message = section.getByRole("link", { name: "Send me a message" });
    expect(message).toHaveAttribute("href", "/contact");
    clickWithoutNavigating(message);
    expect(sendGAEvent).toHaveBeenCalledWith("event", "message_click", {
      cta_location: location,
    });
  });

  it("links About me to /about from the closing CTA", () => {
    render(<HomeClient />);
    const section = within(sectionWithHeading(/Ready to grow your/));
    expect(section.getByRole("link", { name: "About me" })).toHaveAttribute("href", "/about");
    expect(screen.queryByText("Meet Kyle")).toBeNull();
  });
});

describe("home service cards", () => {
  it("shows the full description and bullets 2–3, not the bullet that restates it", () => {
    render(<HomeClient />);
    const card = screen.getByRole("heading", { level: 3, name: "Website Development" })
      .parentElement as HTMLElement;
    const description = within(card).getByText(
      "Conversion-focused marketing sites built to attract qualified leads and grow your business.",
    );
    expect(description.className).not.toMatch(/line-clamp/);

    const bullets = within(card)
      .getAllByRole("listitem")
      .map((li) => li.textContent?.replace("•", "").trim());
    expect(bullets).toEqual([
      "Clear offers, fast load times, and easy editing",
      "SEO optimized structure for search visibility",
    ]);
  });
});

describe("home copy and images", () => {
  it("uses curly quotes in home copy", () => {
    const { container } = render(<HomeClient />);
    // Review text is verbatim Google review content, owned by the
    // testimonials data, so leave it out of the home copy check.
    const main = container.cloneNode(true) as HTMLElement;
    main.querySelectorAll("figure").forEach((figure) => figure.remove());
    expect(main.textContent).not.toContain('"');
    expect(main.textContent).toContain("I don’t settle for “good enough.”");
  });

  it.each(["app/HomeClient.tsx", "components/Hero.tsx", "components/HowItWorks.tsx"])(
    "%s writes typographic quotes, not &apos; or &quot; entities or straight apostrophes in copy",
    (file) => {
      const source = readFileSync(path.resolve(__dirname, "../..", file), "utf8");
      expect(source).not.toMatch(/&apos;|&quot;/);
      // A straight apostrophe between letters inside a string or JSX text.
      expect(source).not.toMatch(/[A-Za-z]'[a-z]/);
    },
  );

  it("sizes the featured project images to their card", () => {
    const doc = serverDocument();
    const titles = getFeaturedProjects().map((project) => project.title);
    const images = Array.from(doc.querySelectorAll("img")).filter((img) =>
      titles.includes(img.getAttribute("alt") ?? ""),
    );
    expect(images).toHaveLength(titles.length);
    for (const img of images) {
      expect(img.getAttribute("sizes")).toBe(
        "(min-width: 1200px) 532px, (min-width: 768px) 50vw, 100vw",
      );
    }
  });
});
