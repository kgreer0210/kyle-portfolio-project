import { Resend } from "resend";
import { Webhook } from "standardwebhooks";
import { describe, expect, it } from "vitest";
import {
  buildReplyAddress,
  extractEmailAddress,
  getInboundConfig,
  htmlToText,
  parseReplyAddress,
  stripQuotedReply,
} from "@/lib/inboundEmail";
import { statusAfterReply } from "@/lib/ticket-replies";

const config = { domain: "reply.kygrsolutions.com", secret: "test-secret" };
const ticketId = "0b8a3a5e-2f61-4c6e-9d0a-6b1b8c1f0e11";

describe("reply addresses", () => {
  it("round-trips a signed address", () => {
    const address = buildReplyAddress(ticketId, config);
    expect(address).toMatch(/^t\+0b8a3a5e-2f61-4c6e-9d0a-6b1b8c1f0e11\.[0-9a-f]{16}@reply\.kygrsolutions\.com$/);
    expect(parseReplyAddress([`Kyle <${address}>`], config)).toBe(ticketId);
  });

  it("finds the reply address among other recipients, case-insensitively", () => {
    const address = buildReplyAddress(ticketId, config).toUpperCase();
    expect(parseReplyAddress(["someone@else.com", address], config)).toBe(ticketId);
  });

  it("rejects a tampered ticket id, wrong secret, or wrong domain", () => {
    const address = buildReplyAddress(ticketId, config);
    const otherTicket = address.replace("0b8a3a5e", "1b8a3a5e");
    expect(parseReplyAddress([otherTicket], config)).toBeNull();
    expect(parseReplyAddress([address], { ...config, secret: "other" })).toBeNull();
    expect(parseReplyAddress([address.replace("reply.", "evil.")], config)).toBeNull();
    expect(parseReplyAddress([`t+${ticketId}@reply.kygrsolutions.com`], config)).toBeNull();
  });

  it("is disabled unless both domain and secret are set", () => {
    expect(getInboundConfig({ INBOUND_REPLY_DOMAIN: "x.com" })).toBeNull();
    expect(
      getInboundConfig({ INBOUND_REPLY_DOMAIN: " X.com ", INBOUND_REPLY_SECRET: "s" }),
    ).toEqual({ domain: "x.com", secret: "s" });
  });
});

describe("extractEmailAddress", () => {
  it("handles display names and bare addresses", () => {
    expect(extractEmailAddress("Jane Doe <Jane@Acme.com>")).toBe("jane@acme.com");
    expect(extractEmailAddress(" jane@acme.com ")).toBe("jane@acme.com");
    expect(extractEmailAddress("not an email")).toBeNull();
  });
});

describe("stripQuotedReply", () => {
  it("cuts Gmail-style history", () => {
    const text = `Yes, that fixed it. Thanks!\n\nOn Mon, Sep 14, 2026 at 9:00 AM KYGR CRM <info@kygrsolutions.com> wrote:\n> There's a new reply on your ticket\n> ...`;
    expect(stripQuotedReply(text)).toBe("Yes, that fixed it. Thanks!");
  });

  it("cuts Outlook-style history", () => {
    const text = "Looks good.\r\n\r\n________________________________\r\nFrom: KYGR CRM <info@kygrsolutions.com>\r\nSent: Monday, September 14, 2026 9:00 AM\r\nSubject: Ticket update";
    expect(stripQuotedReply(text)).toBe("Looks good.");
    const original = "Sure thing\n\n-----Original Message-----\nFrom: KYGR";
    expect(stripQuotedReply(original)).toBe("Sure thing");
  });

  it("drops signatures, quoted lines, and our footer", () => {
    const text = "Here's the URL: https://acme.com/contact\n> old line\n\n-- \nJane Doe\nAcme Plumbing";
    expect(stripQuotedReply(text)).toBe("Here's the URL: https://acme.com/contact");
    const footer = "Got it\n\nView and reply in the portal: https://kygrsolutions.com/portal/tickets/1";
    expect(stripQuotedReply(footer)).toBe("Got it");
  });

  it("returns empty for a reply that is only quoted text", () => {
    expect(stripQuotedReply("> quoted only\n> more")).toBe("");
  });
});

describe("htmlToText", () => {
  it("keeps line breaks and drops quoted blockquotes", () => {
    expect(
      htmlToText("<div>Thanks!<br>Works now.</div><blockquote>old thread</blockquote><p>A &amp; B</p>"),
    ).toBe("Thanks!\nWorks now.\nA & B");
  });
});

describe("Resend webhook verification", () => {
  const secret = `whsec_${Buffer.from("super-secret-signing-key-32bytes!").toString("base64")}`;
  const payload = JSON.stringify({ type: "email.received", created_at: "x", data: { email_id: "e1" } });
  const resend = new Resend("re_test");

  function headersFor(body: string, at = new Date()) {
    const id = "msg_1";
    return { id, timestamp: String(Math.floor(at.getTime() / 1000)), signature: new Webhook(secret).sign(id, at, body) };
  }

  it("accepts a correctly signed payload", () => {
    const event = resend.webhooks.verify({ payload, headers: headersFor(payload), webhookSecret: secret });
    expect(event.type).toBe("email.received");
  });

  it("rejects tampered or stale payloads", () => {
    const headers = headersFor(payload);
    expect(() =>
      resend.webhooks.verify({ payload: payload.replace("e1", "e2"), headers, webhookSecret: secret }),
    ).toThrow();
    const stale = headersFor(payload, new Date(Date.now() - 10 * 60 * 1000));
    expect(() => resend.webhooks.verify({ payload, headers: stale, webhookSecret: secret })).toThrow();
  });
});

describe("statusAfterReply", () => {
  it("reopens waiting, resolved, and closed tickets on a client reply", () => {
    expect(statusAfterReply("waiting_on_client", "client", "public")).toEqual({
      status: "open",
      waiting_since: null,
      nudged_at: null,
    });
    expect(statusAfterReply("resolved", "client", "public")?.status).toBe("open");
    expect(statusAfterReply("closed", "client", "public")?.status).toBe("open");
  });

  it("leaves status alone for admins, internal notes, and active tickets", () => {
    expect(statusAfterReply("waiting_on_client", "admin", "public")).toBeNull();
    expect(statusAfterReply("resolved", "admin", "internal")).toBeNull();
    expect(statusAfterReply("in_progress", "client", "public")).toBeNull();
  });
});
