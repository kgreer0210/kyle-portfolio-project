// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

const pathname = vi.hoisted(() => ({ current: "/" }));

vi.mock("next/navigation", () => ({
  usePathname: () => pathname.current,
}));

const sendGAEvent = vi.hoisted(() => vi.fn());
vi.mock("@next/third-parties/google", () => ({ sendGAEvent }));

import Header from "../Header";
import { PHONE_HREF } from "../../data/contact";

function openMenu() {
  const toggle = screen.getByRole("button", { name: "Menu" });
  fireEvent.click(toggle);
  return toggle;
}

beforeEach(() => {
  pathname.current = "/";
  sendGAEvent.mockClear();
});
afterEach(cleanup);

describe("Header mobile menu", () => {
  it("reflects the drawer state in aria-expanded and points aria-controls at the drawer", () => {
    render(<Header />);
    const toggle = screen.getByRole("button", { name: "Menu" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    const drawerId = toggle.getAttribute("aria-controls");
    expect(drawerId).toBeTruthy();
    expect(document.getElementById(drawerId!)).not.toBeNull();
  });

  it("moves focus to the drawer's first link when it opens", () => {
    render(<Header />);
    openMenu();
    const drawer = document.getElementById("mobile-menu")!;
    const firstLink = drawer.querySelector("a")!;
    expect(firstLink).toHaveFocus();
  });

  it("closes on Escape and returns focus to the toggle", () => {
    render(<Header />);
    const toggle = openMenu();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveFocus();
  });

  it("returns focus to the toggle when a drawer link closes it", () => {
    render(<Header />);
    const toggle = openMenu();
    const drawer = document.getElementById("mobile-menu")!;
    fireEvent.click(drawer.querySelector("a")!);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveFocus();
  });
});

describe("Header mobile menu contents", () => {
  it("offers a tap-to-call link tracked as a mobile_menu phone_click", () => {
    render(<Header />);
    openMenu();
    const drawer = document.getElementById("mobile-menu")!;
    const call = drawer.querySelector<HTMLAnchorElement>(`a[href="${PHONE_HREF}"]`);
    expect(call).not.toBeNull();

    fireEvent.click(call!);
    expect(sendGAEvent).toHaveBeenCalledWith("event", "phone_click", {
      cta_location: "mobile_menu",
    });
  });
});

describe("Header navigation", () => {
  it("marks the active route with aria-current=page in the desktop nav and the drawer", () => {
    pathname.current = "/services";
    const { container } = render(<Header />);
    openMenu();
    const current = Array.from(
      container.querySelectorAll('[aria-current="page"]'),
    );
    expect(current).toHaveLength(2);
    for (const link of current) {
      expect(link).toHaveAttribute("href", "/services");
    }
  });

  it("labels the header CTA Contact, linking to /contact, in both navs", () => {
    render(<Header />);
    openMenu();
    const contactLinks = screen.getAllByRole("link", { name: "Contact" });
    expect(contactLinks).toHaveLength(2);
    for (const link of contactLinks) {
      expect(link).toHaveAttribute("href", "/contact");
    }
    expect(screen.queryByText("Get Started")).toBeNull();
  });

  it("never nests a button or another focusable element inside a link", () => {
    const { container } = render(<Header />);
    openMenu();
    expect(container.querySelectorAll("a button, a [tabindex], a a")).toHaveLength(0);
  });

  it("makes the logo a single tab stop", () => {
    render(<Header />);
    const home = screen.getByRole("link", { name: "KYGR Solutions home" });
    expect(home).toHaveAttribute("href", "/");
    expect(home.querySelectorAll("[tabindex], button, a")).toHaveLength(0);
  });
});
