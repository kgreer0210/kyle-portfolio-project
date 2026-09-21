import { describe, expect, it, vi } from "vitest";
import { buildReplyAddress } from "@/lib/inboundEmail";
import { handleInboundEmail, type InboundDeps } from "@/lib/inboundReply";

const config = { domain: "reply.kygrsolutions.com", secret: "test-secret" };
const ticketId = "0b8a3a5e-2f61-4c6e-9d0a-6b1b8c1f0e11";
const ticket = {
  id: ticketId,
  organization_id: "org-1",
  title: "Form broken",
  status: "waiting_on_client" as const,
  organizationName: "Acme",
};
const client = { id: "user-1", email: "jane@acme.com", role: "client" as const };

function deps(overrides: Partial<InboundDeps> = {}): InboundDeps {
  return {
    getTicket: vi.fn(async () => ticket),
    findProfileByEmail: vi.fn(async () => client),
    isOrganizationMember: vi.fn(async () => true),
    getEmailContent: vi.fn(async () => ({
      text: "It works now!\n\nOn Mon, Sep 14 KYGR wrote:\n> old",
      html: null,
    })),
    listAttachments: vi.fn(async () => []),
    downloadAttachment: vi.fn(async (info) => new File(["x"], info.filename || "file")),
    postReply: vi.fn(async () => ({ duplicate: false })),
    ...overrides,
  };
}

const event = {
  email_id: "email-1",
  from: "Jane Doe <jane@acme.com>",
  to: [buildReplyAddress(ticketId, config)],
  cc: [],
  received_for: [],
  message_id: "<abc@mail.gmail.com>",
};

describe("handleInboundEmail", () => {
  it("posts the stripped reply from an org member", async () => {
    const d = deps();
    const outcome = await handleInboundEmail(event, config, d);
    expect(outcome).toEqual({ status: "posted", ticketId, attachments: 0 });
    expect(d.postReply).toHaveBeenCalledWith({
      ticket,
      author: client,
      body: "It works now!",
      files: [],
      externalMessageId: "<abc@mail.gmail.com>",
    });
  });

  it("ignores mail without a valid reply address before any lookups", async () => {
    const d = deps();
    const outcome = await handleInboundEmail({ ...event, to: ["t+nope@reply.kygrsolutions.com"] }, config, d);
    expect(outcome).toEqual({ status: "ignored", reason: "no_reply_address" });
    expect(d.getTicket).not.toHaveBeenCalled();
  });

  it("rejects unknown senders and non-members without posting", async () => {
    const unknown = deps({ findProfileByEmail: vi.fn(async () => null) });
    expect(await handleInboundEmail(event, config, unknown)).toEqual({
      status: "ignored",
      reason: "unknown_sender",
    });

    const outsider = deps({ isOrganizationMember: vi.fn(async () => false) });
    expect(await handleInboundEmail(event, config, outsider)).toEqual({
      status: "ignored",
      reason: "sender_not_member",
    });
    expect(outsider.postReply).not.toHaveBeenCalled();
    expect(outsider.getEmailContent).not.toHaveBeenCalled();
  });

  it("lets admins reply without org membership", async () => {
    const d = deps({
      findProfileByEmail: vi.fn(async () => ({ id: "admin-1", email: "kyle@kygr.com", role: "admin" as const })),
      isOrganizationMember: vi.fn(async () => false),
    });
    expect((await handleInboundEmail(event, config, d)).status).toBe("posted");
    expect(d.isOrganizationMember).not.toHaveBeenCalled();
  });

  it("ignores replies with no new text, falling back to HTML when text is empty", async () => {
    const quotedOnly = deps({ getEmailContent: vi.fn(async () => ({ text: "> only quoted", html: null })) });
    expect(await handleInboundEmail(event, config, quotedOnly)).toEqual({
      status: "ignored",
      reason: "empty_body",
    });

    const htmlOnly = deps({ getEmailContent: vi.fn(async () => ({ text: "", html: "<p>From HTML</p>" })) });
    await handleInboundEmail(event, config, htmlOnly);
    expect(htmlOnly.postReply).toHaveBeenCalledWith(expect.objectContaining({ body: "From HTML" }));
  });

  it("keeps real attachments within limits and skips inline images", async () => {
    const attachment = (name: string, overrides = {}) => ({
      filename: name,
      content_type: "image/png",
      content_disposition: "attachment",
      size: 1000,
      download_url: `https://files/${name}`,
      ...overrides,
    });
    const d = deps({
      listAttachments: vi.fn(async () => [
        attachment("inline.png", { content_disposition: "inline" }),
        attachment("huge.zip", { size: 50 * 1024 * 1024 }),
        ...["a", "b", "c", "d", "e", "f"].map((n) => attachment(`${n}.png`)),
      ]),
    });
    const outcome = await handleInboundEmail(event, config, d);
    expect(outcome).toEqual({ status: "posted", ticketId, attachments: 5 });
    expect(d.downloadAttachment).toHaveBeenCalledTimes(5);
  });

  it("reports duplicates from webhook retries", async () => {
    const d = deps({ postReply: vi.fn(async () => ({ duplicate: true })) });
    expect(await handleInboundEmail(event, config, d)).toEqual({ status: "duplicate", ticketId });
  });
});
