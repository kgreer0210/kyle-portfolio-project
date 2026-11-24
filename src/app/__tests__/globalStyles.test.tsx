import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { isValidElement, type ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import RootLayout from "../layout";

vi.mock("../globals.css", () => ({}));
vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "font-sans-var" }),
  Geist_Mono: () => ({ variable: "font-mono-var" }),
}));
vi.mock("@/components/AppShell", () => ({ default: () => null }));

const SRC = path.resolve(__dirname, "../..");
const css = readFileSync(path.join(SRC, "app/globals.css"), "utf8");
const cssWithoutComments = css.replace(/\/\*[\s\S]*?\*\//g, "");

function relativeLuminance(hex: string) {
  const channels = hex
    .replace("#", "")
    .match(/.{2}/g)!
    .map((pair) => parseInt(pair, 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastWithWhite(hex: string) {
  return 1.05 / (relativeLuminance(hex) + 0.05);
}

function cssVar(name: string) {
  const match = cssWithoutComments.match(new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})`));
  return match?.[1].toLowerCase();
}

describe("root <html> element", () => {
  const html = RootLayout({ children: null }) as ReactElement<{
    className?: string;
    "data-scroll-behavior"?: string;
  }>;

  it("opts into Next.js smooth-scroll handling on route changes", () => {
    expect(isValidElement(html)).toBe(true);
    expect(html.props["data-scroll-behavior"]).toBe("smooth");
  });

  it("leaves smooth scrolling to the global stylesheet", () => {
    expect(html.props.className ?? "").not.toMatch(/\bscroll-smooth\b/);
  });
});

describe("palette", () => {
  it("defines blue-ncs-strong as #007aa5 in the Tailwind theme and the CSS variables", () => {
    expect(cssVar("--color-blue-ncs-strong")).toBe("#007aa5");
    expect(cssVar("--blue-ncs-strong")).toBe("#007aa5");
  });

  it("keeps Blue NCS #0094c6 for cyan text and accents", () => {
    expect(cssVar("--color-blue-ncs")).toBe("#0094c6");
  });

  it("gives white text at least WCAG AA contrast on the strong cyan", () => {
    expect(contrastWithWhite("#007aa5")).toBeGreaterThanOrEqual(4.5);
    // The old background fails, which is why the strong token exists.
    expect(contrastWithWhite("#0094c6")).toBeLessThan(4.5);
  });

  it("puts white button text on the strong cyan and darkens on hover", () => {
    const rule = (selector: string) =>
      cssWithoutComments.match(new RegExp(`${selector.replace(/[.:]/g, "\\$&")}\\s*\\{([^}]*)\\}`))?.[1] ?? "";
    expect(rule(".btn-primary")).toMatch(/background-color:\s*var\(--blue-ncs-strong\)/);
    expect(rule(".btn-primary:hover")).toMatch(/background-color:\s*var\(--lapis-lazuli\)/);
    expect(rule(".client-primary")).toMatch(/background:\s*var\(--blue-ncs-strong\)/);
  });
});

describe("global stylesheet", () => {
  it("has no colour rule that makes h1 cyan", () => {
    expect(cssWithoutComments).not.toMatch(/(^|[\s,}])h1\s*\{[^}]*--blue-ncs/);
  });

  it("keeps element-level colour rules in the base layer so utilities win", () => {
    const base = cssWithoutComments.match(/@layer base\s*\{([\s\S]*?)\n\}/)?.[1] ?? "";
    expect(base).toMatch(/\bp\s*\{[^}]*color/);
    const outsideBase = cssWithoutComments.replace(/@layer base\s*\{[\s\S]*?\n\}/, "");
    expect(outsideBase).not.toMatch(/^\s*(p|h[1-6]|body|input|textarea)\s*[,{]/m);
  });

  it("never transitions all properties", () => {
    expect(cssWithoutComments).not.toMatch(/transition:\s*all\b/);
  });

  it("clips horizontal overflow on body instead of hiding it", () => {
    const body = cssWithoutComments.match(/(^|\s)body\s*\{([^}]*)\}/)?.[2] ?? "";
    expect(body).toMatch(/overflow-x:\s*clip/);
    expect(body).not.toMatch(/overflow-x:\s*hidden/);
  });

  it("sets smooth scrolling exactly once", () => {
    expect(cssWithoutComments.match(/scroll-behavior:\s*smooth/g)).toHaveLength(1);
  });
});

describe("public components", () => {
  const PUBLIC_DIRS = ["components", "app"];
  const EXCLUDED = [/\/crm\//, /\/admin\//, /\/portal\//, /__tests__/];

  function sourceFiles(dir: string): string[] {
    return readdirSync(dir).flatMap((name) => {
      const full = path.join(dir, name);
      if (statSync(full).isDirectory()) return sourceFiles(full);
      return /\.(tsx|ts)$/.test(name) ? [full] : [];
    });
  }

  const files = PUBLIC_DIRS.flatMap((dir) => sourceFiles(path.join(SRC, dir))).filter(
    (file) => !EXCLUDED.some((pattern) => pattern.test(file)),
  );

  it("never put white text on the light Blue NCS background", () => {
    const offenders = files.flatMap((file) =>
      readFileSync(file, "utf8")
        .split("\n")
        .map((line, i) => ({ line, at: `${path.relative(SRC, file)}:${i + 1}` }))
        .filter(({ line }) => /text-white/.test(line) && /(^|[\s"`'])(hover:)?bg-blue-ncs(?![-/\w])/.test(line))
        .map(({ at }) => at),
    );
    expect(offenders).toEqual([]);
  });

  it("never use transition-all", () => {
    const offenders = files.filter((file) => /\btransition-all\b/.test(readFileSync(file, "utf8")));
    expect(offenders.map((file) => path.relative(SRC, file))).toEqual([]);
  });
});
