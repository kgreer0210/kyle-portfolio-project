import { describe, expect, it } from "vitest";
import { buildChatDigestEmail, type ChatDigestEmailData } from "@/lib/notifications";

const base: ChatDigestEmailData = {
  conversationId: "3f2b8c1e-9d4a-4c7b-8e21-5a6f7b8c9d0e",
  visitorName: "Jane",
  visitorEmail: "jane@example.com",
  visitorPhone: "+14787771266",
  startedAt: "2026-11-06T12:00:00.000Z",
  endedAt: "2026-11-06T12:10:00.000Z",
  transcript: [{ role: "user", content: "Hello" }],
  scoring: null,
};

describe("buildChatDigestEmail", () => {
  it("includes both the email and the formatted phone", () => {
    const { subject, html, text } = buildChatDigestEmail(base);

    expect(subject).toContain("jane@example.com");
    expect(html).toContain("jane@example.com");
    expect(html).toContain("(478) 777-1266");
    expect(text).toContain("Visitor: Jane <jane@example.com>");
    expect(text).toContain("Phone: (478) 777-1266");
  });

  it("falls back to the phone in the subject when there is no email", () => {
    const { subject } = buildChatDigestEmail({ ...base, visitorEmail: null });
    expect(subject).toContain("(478) 777-1266");
  });

  it("omits the phone row when none was captured", () => {
    const { html, text } = buildChatDigestEmail({ ...base, visitorPhone: null });
    expect(html).not.toContain("Phone");
    expect(text).not.toContain("Phone:");
  });

  it("escapes visitor-controlled text in the HTML body", () => {
    const { html } = buildChatDigestEmail({
      ...base,
      visitorName: "<script>alert(1)</script>",
    });
    expect(html).not.toContain("<script>alert(1)</script>");
  });
});
