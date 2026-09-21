import { createHmac, timingSafeEqual } from "crypto";

/**
 * Email replies to ticket notifications. Outbound ticket emails set
 * Reply-To to `t+<ticketId>.<sig>@<INBOUND_REPLY_DOMAIN>`; the signature is
 * an HMAC of the ticket id so a guessed or edited address can't post into an
 * arbitrary ticket. The sender must still be a member of the ticket's
 * organization (or an admin) before anything is written.
 */

const SIGNATURE_LENGTH = 16;

export interface InboundConfig {
  domain: string;
  secret: string;
}

/** Null when inbound replies aren't configured, so callers fall back to link-only emails. */
export function getInboundConfig(
  env: Record<string, string | undefined> = process.env,
): InboundConfig | null {
  const domain = env.INBOUND_REPLY_DOMAIN?.trim().toLowerCase();
  const secret = env.INBOUND_REPLY_SECRET?.trim();
  return domain && secret ? { domain, secret } : null;
}

function signTicketId(ticketId: string, secret: string): string {
  return createHmac("sha256", secret).update(`ticket:${ticketId}`).digest("hex").slice(0, SIGNATURE_LENGTH);
}

export function buildReplyAddress(ticketId: string, config: InboundConfig): string {
  return `t+${ticketId}.${signTicketId(ticketId, config.secret)}@${config.domain}`;
}

/** "Jane Doe <Jane@Example.com>" → "jane@example.com". */
export function extractEmailAddress(value: string): string | null {
  const angle = /<([^<>\s]+@[^<>\s]+)>/.exec(value);
  const candidate = (angle ? angle[1] : value).trim().toLowerCase();
  return /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(candidate) ? candidate : null;
}

/**
 * Find the first recipient address that is a correctly signed reply address
 * for our domain and return its ticket id.
 */
export function parseReplyAddress(recipients: string[], config: InboundConfig): string | null {
  for (const recipient of recipients) {
    const address = extractEmailAddress(recipient);
    if (!address) continue;

    const match = /^t\+([0-9a-f-]{36})\.([0-9a-f]+)@(.+)$/.exec(address);
    if (!match || match[3] !== config.domain) continue;

    const [, ticketId, signature] = match;
    const expected = Buffer.from(signTicketId(ticketId, config.secret));
    const received = Buffer.from(signature);
    if (expected.length === received.length && timingSafeEqual(expected, received)) {
      return ticketId;
    }
  }
  return null;
}

const QUOTE_MARKERS: RegExp[] = [
  // Gmail / Apple Mail: "On Mon, Sep 14, 2026 at 9:00 AM Kyle <x@y.com> wrote:"
  /^\s*On\s.+wrote:\s*$/im,
  // Some clients wrap the attribution over two lines.
  /^\s*On\s.+\n.+wrote:\s*$/im,
  // Outlook
  /^\s*-{2,}\s*Original Message\s*-{2,}\s*$/im,
  /^\s*_{10,}\s*$/m,
  /^\s*From:\s.+\n\s*(Sent|Date):\s.+$/im,
  // Our own call-to-action footer, if the client didn't trim it.
  /^\s*(View ticket|View and reply in the portal|Open ticket):\s+https?:\/\//im,
];

/**
 * Keep only the new part of a reply: cut at the first quoted-history marker,
 * drop trailing ">"-quoted lines, and trim signatures separated by "-- ".
 */
export function stripQuotedReply(text: string): string {
  let body = text.replace(/\r\n/g, "\n");

  let cutAt = body.length;
  for (const marker of QUOTE_MARKERS) {
    const match = marker.exec(body);
    if (match && match.index < cutAt) {
      cutAt = match.index;
    }
  }
  body = body.slice(0, cutAt);

  const signatureIndex = body.search(/^-- ?$/m);
  if (signatureIndex !== -1) {
    body = body.slice(0, signatureIndex);
  }

  const lines = body.split("\n");
  while (lines.length > 0 && (/^\s*>/.test(lines[lines.length - 1]) || !lines[lines.length - 1].trim())) {
    lines.pop();
  }

  return lines
    .filter((line) => !/^\s*>/.test(line))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Crude HTML → text for emails that only have an HTML part. */
export function htmlToText(html: string): string {
  return html
    .replace(/<(style|script)[\s\S]*?<\/\1>/gi, "")
    .replace(/<blockquote[\s\S]*?<\/blockquote>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|tr|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}
