import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// AppShell owns the one <main id="main-content"> landmark (the skip link's
// target). Public page components must not render a second, nested <main>.
const PUBLIC_PAGE_CLIENTS = [
  "app/HomeClient.tsx",
  "app/about/AboutClient.tsx",
  "app/contact/ContactClient.tsx",
  "app/idx/IdxClient.tsx",
  "app/projects/ProjectsClient.tsx",
  "app/projects/[projectId]/ProjectDetailClient.tsx",
  "app/services/ServicesClient.tsx",
  "app/website-design-middle-georgia/WebsiteDesignMiddleGeorgiaClient.tsx",
];

describe("single <main> landmark", () => {
  it.each(PUBLIC_PAGE_CLIENTS)("%s does not render its own <main>", (file) => {
    const source = readFileSync(path.resolve(__dirname, "../..", file), "utf8");
    expect(source).not.toMatch(/<main[\s>]/);
  });
});
