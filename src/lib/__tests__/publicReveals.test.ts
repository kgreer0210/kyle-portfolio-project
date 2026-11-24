import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

// Public pages and the components they render. App routes (admin, portal,
// auth) and the CRM have their own UI and are out of scope.
const ROOT = join(__dirname, "..", "..");
const APP_ROUTES = /^app\/(admin|portal|login|auth|reset-password)\//;

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      return name === "__tests__" || name === "crm" ? [] : sourceFiles(path);
    }
    return /\.tsx$/.test(name) ? [path] : [];
  });
}

const publicFiles = [
  ...sourceFiles(join(ROOT, "app")),
  ...sourceFiles(join(ROOT, "components")),
].filter((path) => !APP_ROUTES.test(relative(ROOT, path)));

describe("public section reveals and hovers", () => {
  it("scans the public pages", () => {
    const names = publicFiles.map((path) => relative(ROOT, path));
    expect(names).toContain("app/HomeClient.tsx");
    expect(names).toContain("components/Testimonials.tsx");
  });

  // useReveal is the one place reveal timing lives (<=300ms, 8-12px, strong
  // ease-out, instant for reduced motion), so no file hand-rolls its own.
  it.each(publicFiles.map((path) => [relative(ROOT, path), path]))(
    "%s reveals sections only through useReveal",
    (_name, path) => {
      const source = readFileSync(path, "utf8");
      expect(source).not.toMatch(/whileInView=/);
      expect(source).not.toMatch(/\bwhileInView:/);
    },
  );

  // Hover scale goes through useHoverMotion (only under (hover: hover), off
  // for reduced motion). CSS hover scale needs motion-safe; Tailwind's hover
  // variant is already limited to (hover: hover).
  it.each(publicFiles.map((path) => [relative(ROOT, path), path]))(
    "%s scales on hover only through useHoverMotion or motion-safe CSS",
    (_name, path) => {
      const source = readFileSync(path, "utf8");
      expect(source).not.toMatch(/whileHover=\{\{[^}]*scale/);
      // A class token that starts with hover:/group-hover: has no motion-safe.
      expect(source).not.toMatch(/(?:^|[\s"'`])(?:group-)?hover:-?scale-/m);
    },
  );
});
