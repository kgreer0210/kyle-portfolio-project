// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import Header from "../Header";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

describe("Header entrance", () => {
  it("is visible in the server HTML, with no opacity-0 or off-screen start", () => {
    const doc = new DOMParser().parseFromString(
      renderToString(<Header />),
      "text/html",
    );
    const header = doc.querySelector("header");
    expect(header).not.toBeNull();
    const style = header!.getAttribute("style") ?? "";
    expect(style).not.toMatch(/opacity:\s*0(?![.\d])/);
    expect(style).not.toMatch(/translateY\(-/);
  });
});
