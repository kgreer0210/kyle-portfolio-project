import { describe, it, expect, vi } from "vitest";
vi.mock("server-only", () => ({}));
import {
  isPublicAddress,
  validatePublicUrl,
  extractPage,
} from "@/lib/project-context/web";
import { sourceSchema, allowCodePath } from "@/lib/project-context/schema";
import { validWebhook } from "@/lib/project-context/github";
import { createHmac } from "node:crypto";
import { readContextDraft } from "@/lib/readContextDraft";
import { contextDraftResponse } from "@/lib/project-context/stream";
import { buildReplyDraftPrompt } from "@/lib/ticketReplyDraft";

describe("project context boundaries", () => {
  it.each([
    "127.0.0.1",
    "10.1.1.1",
    "172.16.0.1",
    "192.168.1.4",
    "169.254.169.254",
    "100.64.0.1",
    "0.0.0.0",
    "::1",
    "fc00::1",
    "fe80::1",
    "::ffff:127.0.0.1",
  ])("blocks internal IP %s", (address) =>
    expect(isPublicAddress(address)).toBe(false),
  );
  it("permits public IPs only", () => {
    expect(isPublicAddress("1.1.1.1")).toBe(true);
    expect(isPublicAddress("2606:4700:4700::1111")).toBe(true);
  });
  it.each([
    "http://example.com",
    "https://localhost",
    "https://127.0.0.1",
    "https://[::1]",
    "https://user:pass@example.com",
    "https://example.com:8443",
  ])("rejects unsafe website %s", (url) =>
    expect(() => validatePublicUrl(url)).toThrow(),
  );
  it("extracts control locations and removes executable content", () => {
    const result = extractPage(
      '<title>Contact</title><script>secret instructions</script><main><a href="/booking">Book a consultation</a><button>Approve</button><form action="/send"><input name="email" /></form></main>',
      "https://example.com/contact",
    );
    expect(result.entry.content).toContain("Book a consultation → /booking");
    expect(result.entry.content).toContain("Button: Approve");
    expect(result.entry.content).toContain("fields: email");
    expect(result.entry.content).not.toContain("secret instructions");
    expect(result.links).toEqual(["https://example.com/booking"]);
  });
  it.each([
    ".env.local",
    "src/credentials.ts",
    "src/private-key.ts",
    "node_modules/a.ts",
    "dist/a.js",
    "secrets/key.py",
    "package-lock.json",
  ])("excludes sensitive/generated code %s", (path) =>
    expect(allowCodePath(path)).toBe(false),
  );
  it("allows application source", () =>
    expect(allowCodePath("src/app/admin/page.tsx")).toBe(true));
  it("does not permit a website to declare client audience", () => {
    const result = sourceSchema.parse({
      kind: "website",
      label: "Site",
      locator: "https://example.com",
      config: { audience: "client" },
    });
    expect(result.config).toEqual({});
  });
  it("requires explicit content for client-safe notes", () =>
    expect(
      sourceSchema.safeParse({
        kind: "manual",
        label: "Note",
        config: { audience: "client" },
      }).success,
    ).toBe(false));
  it("accepts only correct webhook signatures", () => {
    const raw = '{"test":1}';
    const secret = "local-test-key";
    const signature =
      "sha256=" + createHmac("sha256", secret).update(raw).digest("hex");
    expect(validWebhook(raw, signature, secret)).toBe(true);
    expect(validWebhook(raw + " ", signature, secret)).toBe(false);
    expect(validWebhook(raw, "bad", secret)).toBe(false);
    expect(validWebhook(raw, signature, undefined)).toBe(false);
  });
});
describe("context draft stream", () => {
  it("keeps evidence associated with text across chunk boundaries", async () => {
    const context = {
      text: "",
      notice: "Snapshot",
      evidence: [
        {
          id: "1",
          title: "Booking",
          locator: "/contact",
          observedAt: "2026-10-01",
          version: "note-1",
          coverage: "Note",
          stale: false,
        },
      ],
    };
    async function* tokens() {
      yield "Hello ";
      yield "there.";
    }
    const original = await contextDraftResponse(tokens(), context).text();
    const bytes = new TextEncoder().encode(original);
    let offset = 0;
    const response = new Response(
      new ReadableStream({
        pull(c) {
          if (offset >= bytes.length) {
            c.close();
            return;
          }
          c.enqueue(bytes.slice(offset, offset + 7));
          offset += 7;
        },
      }),
    );
    const onText = vi.fn();
    const onContext = vi.fn();
    expect(await readContextDraft(response, onText, onContext)).toBe(
      "Hello there.",
    );
    expect(onContext).toHaveBeenCalledWith(context.evidence, "Snapshot");
  });
  it("rejects incomplete streams", async () => {
    await expect(
      readContextDraft(
        new Response('{"type":"text","text":"partial"}\n'),
        () => {},
        () => {},
      ),
    ).rejects.toThrow("interrupted");
  });
});
it("includes project evidence in drafts without removing existing instructions", () => {
  const prompt = buildReplyDraftPrompt({
    organizationName: "Demo",
    clientName: null,
    ticket: {
      title: "Booking",
      description: "Broken",
      status: "new",
      outOfScope: false,
      costAmount: null,
    },
    messages: [],
    projectScope: null,
    instructions: "Ask which browser",
    projectContext: "Contact button opens calendar",
  });
  expect(prompt).toContain("Contact button opens calendar");
  expect(prompt).toContain("untrusted source content");
  expect(prompt).toContain("Ask which browser");
});
