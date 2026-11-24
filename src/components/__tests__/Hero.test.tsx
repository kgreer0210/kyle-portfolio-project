// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import Hero from "../Hero";
import { CONSULT_CALL_URL } from "../../data/contact";

const sendGAEvent = vi.hoisted(() => vi.fn());
vi.mock("@next/third-parties/google", () => ({ sendGAEvent }));

afterEach(cleanup);
beforeEach(() => {
  sendGAEvent.mockClear();
  window.history.replaceState(null, "", "/");
});

function serverDocument() {
  const html = renderToString(<Hero />);
  return new DOMParser().parseFromString(html, "text/html");
}

describe("Hero server HTML", () => {
  it("paints the headline immediately: no hidden style on the H1 or any ancestor", () => {
    const doc = serverDocument();
    const h1 = doc.querySelector("h1");
    expect(h1).not.toBeNull();
    expect(h1!.textContent).toMatch(/Websites, web & mobile apps/);

    for (let el: Element | null = h1; el; el = el.parentElement) {
      const style = el.getAttribute("style") ?? "";
      expect(style, `<${el.tagName.toLowerCase()}> style`).not.toMatch(
        /opacity:\s*0(?![.\d])|visibility:\s*hidden|display:\s*none/,
      );
      expect(el.hasAttribute("hidden")).toBe(false);
    }
  });
});

describe("Hero CTAs", () => {
  it("offers exactly Book a 30-min call and Send me a message, each to its destination", () => {
    render(<Hero />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);

    const call = screen.getByRole("link", { name: /^Book a 30-min call/ });
    expect(call).toHaveAttribute("href", CONSULT_CALL_URL);
    expect(call).toHaveAttribute("target", "_blank");

    const message = screen.getByRole("link", { name: "Send me a message" });
    expect(message).toHaveAttribute("href", "/contact");
  });

  it("tracks the call click with cta_location hero", () => {
    render(<Hero />);
    const call = screen.getByRole("link", { name: /^Book a 30-min call/ });
    call.addEventListener("click", (e) => e.preventDefault());
    fireEvent.click(call);
    expect(sendGAEvent).toHaveBeenCalledWith("event", "book_call_click", {
      cta_location: "hero",
    });
  });
});
