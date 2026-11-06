/**
 * Pure helpers for capturing a visitor's email or phone from chat text and for
 * deciding when the assistant may ask for one. No I/O, so everything here is
 * safe to import from the browser widget as well as the API routes.
 */

export interface VisitorContact {
  email: string | null;
  phone: string | null;
}

export const EMPTY_CONTACT: VisitorContact = { email: null, phone: null };

const MAX_EMAIL_LENGTH = 254;

// Kyle's published direct line (faq.md). A visitor repeating it back is not
// giving us their own number.
export const KYLE_PHONE_E164 = "+14787771266";

// File extensions that look like a TLD ("icon@2x.png").
const NOT_A_TLD = new Set([
  "png", "jpg", "jpeg", "gif", "svg", "webp", "avif", "ico", "bmp",
  "pdf", "css", "js", "ts", "json", "zip", "mp4", "mov",
]);

const EMAIL_PATTERN =
  /[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9-]{1,63}(?:\.[A-Za-z0-9-]{1,63})*\.[A-Za-z]{2,24}/g;

export function isValidEmail(value: string): boolean {
  const candidates = extractEmails(value);
  return candidates.length === 1 && candidates[0] === value.trim().toLowerCase();
}

/** Distinct, lower-cased email addresses found in `text`. */
export function extractEmails(text: string): string[] {
  const found = new Set<string>();
  for (const match of text.matchAll(EMAIL_PATTERN)) {
    const email = match[0].replace(/^[._%+-]+/, "").toLowerCase();
    const tld = email.slice(email.lastIndexOf(".") + 1);
    if (email.length > MAX_EMAIL_LENGTH) continue;
    if (NOT_A_TLD.has(tld)) continue;
    if (email.includes("..")) continue;
    found.add(email);
  }
  return [...found];
}

// 10-digit NANP number with an optional +1 / 1 prefix. Separators are
// optional here; `extractPhones` decides which shapes are trustworthy.
const PHONE_PATTERN =
  /(?:\+?1[\s.-]?)?\(?[2-9]\d{2}\)?[\s.-]?[2-9]\d{2}[\s.-]?\d{4}/g;

// Words that make a bare or space-separated digit run a phone number.
const PHONE_CUE =
  /\b(?:phone|cell|mobile|call|text|number|reach|contact|digits|line)\b/i;

// Characters allowed immediately before / after a phone number.
const PHONE_PREV_OK = /[\s:;(["']/;
const PHONE_NEXT_OK = /[\s!?:;)\]"']/;

function isNanpDigits(digits10: string): boolean {
  const area = digits10.slice(0, 3);
  const exchange = digits10.slice(3, 6);
  // N11 codes (411, 911, ...) are never real area codes or exchanges.
  return !(area.endsWith("11") || exchange.endsWith("11"));
}

/** Distinct E.164 US numbers (+1XXXXXXXXXX) found in `text`, conservatively. */
export function extractPhones(text: string): string[] {
  const found = new Set<string>();
  for (const match of text.matchAll(PHONE_PATTERN)) {
    const raw = match[0];
    const start = match.index ?? 0;
    const end = start + raw.length;

    const prev = start === 0 ? "" : text[start - 1];
    if (prev && !PHONE_PREV_OK.test(prev)) continue;

    const next = text[end] ?? "";
    if (next) {
      // "." or "," directly followed by a digit is a decimal or a longer
      // number, not sentence punctuation.
      const afterNext = text[end + 1] ?? "";
      const sentencePunct = (next === "." || next === ",") && !/\d/.test(afterNext);
      if (!sentencePunct && !PHONE_NEXT_OK.test(next)) continue;
    }

    const digits = raw.replace(/\D/g, "");
    const digits10 = digits.length === 11 ? digits.slice(1) : digits;
    if (digits10.length !== 10 || !isNanpDigits(digits10)) continue;

    // Parentheses, a +1 prefix, or hyphen/dot separators are phone-shaped on
    // their own. Bare digit runs and space-only groups (order numbers, IDs)
    // need a phone word shortly before them.
    const hasShape = /[()+]/.test(raw) || /\d[.-]\d|\)[.-]/.test(raw);
    if (!hasShape) {
      const lead = text.slice(Math.max(0, start - 40), start);
      if (!PHONE_CUE.test(lead)) continue;
    }

    found.add(`+1${digits10}`);
  }
  return [...found];
}

/** "+14787771266" -> "(478) 777-1266". Anything else is returned unchanged. */
export function formatUsPhone(e164: string): string {
  const match = /^\+1(\d{3})(\d{3})(\d{4})$/.exec(e164);
  return match ? `(${match[1]}) ${match[2]}-${match[3]}` : e164;
}

// The visitor is explicitly replacing something they gave us earlier.
const CORRECTION_CUE =
  /\b(?:actually|correction|typo|instead|rather|new (?:e-?mail|number|phone)|changed|wrong|use this|sorry)\b/i;

function mergeField(
  existing: string | null,
  candidates: string[],
  isCorrection: boolean,
): string | null {
  if (candidates.length === 0) return existing;
  if (existing === null) {
    // Several different values in one message is ambiguous: capture nothing
    // rather than guess which one is the visitor's own.
    return candidates.length === 1 ? candidates[0] : null;
  }
  if (candidates.length === 1 && candidates[0] !== existing && isCorrection) {
    return candidates[0];
  }
  return existing;
}

/**
 * Applies one visitor message to the contact already on file. A captured
 * value is only replaced when the message carries exactly one new value and
 * says it is a correction.
 */
export function mergeContactFromMessage(
  existing: VisitorContact,
  message: string,
): VisitorContact {
  const isCorrection = CORRECTION_CUE.test(message);
  return {
    email: mergeField(existing.email, extractEmails(message), isCorrection),
    phone: mergeField(
      existing.phone,
      extractPhones(message).filter((phone) => phone !== KYLE_PHONE_E164),
      isCorrection,
    ),
  };
}

export function hasContact(contact: VisitorContact): boolean {
  return Boolean(contact.email || contact.phone);
}

interface TranscriptMessage {
  role: "user" | "assistant";
  content: string;
}

// Ways an assistant question asks for the VISITOR's contact details. Each one
// has to point at the visitor ("your", "for you", "reach you"), so a question
// that only offers Kyle's number ("Want my number?") or an answer that shares
// it does not count.
const CONTACT_ASK_PATTERNS: RegExp[] = [
  // "What's your best email?" / "your phone number" / "your number"
  /\b(?:your|ur)\s+(?:(?:best|preferred|direct|personal|main|work|good)\s+)*(?:e-?mail|phone|cell|mobile|number|contact)/i,
  // "What is the best email or phone number for you?"
  /\b(?:e-?mail|phone|cell|mobile|number)\b[^?]*\bfor you\b/i,
  // "How should Kyle reach you?" / "best way to contact you" / "get in touch with you"
  /\b(?:reach|contact|get in touch with|follow up with)\s+you\b/i,
  // "What's the best number to call you on?" / "best email to send it to?"
  /\b(?:best|good|easiest|preferred)\s+(?:e-?mail|phone|cell|mobile|number|way)\b[^?]*\b(?:call|text|e-?mail|send)\b/i,
];

/** True if any assistant turn already asked the visitor for an email or phone. */
export function assistantAskedForContact(
  messages: TranscriptMessage[],
): boolean {
  return messages.some((m) => {
    if (m.role !== "assistant") return false;
    // Only question sentences count: sharing a number is not asking for one.
    const questions = m.content.match(/[^.!?]*\?/g) ?? [];
    return questions.some((question) =>
      CONTACT_ASK_PATTERNS.some((pattern) => pattern.test(question)),
    );
  });
}

// Messages that are pleasantries rather than a real exchange.
const PLEASANTRY =
  /^(?:hi|hello|hey|thanks|thank you|ok|okay|cool|great|bye|goodbye|yes|no|sure|nice)\b[\s\S]{0,20}$/i;

const MIN_USER_TURNS_BEFORE_ASK = 2;
const MIN_TOTAL_USER_WORDS = 20;
const MIN_LATEST_WORDS = 6;

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Deterministic guard for the contact ask. The prompt only gets permission to
 * ask when the visitor has had a substantive exchange, we have no contact
 * yet, and the assistant has not asked before.
 */
export function shouldAskForContact(
  messages: TranscriptMessage[],
  contact: VisitorContact,
): boolean {
  if (hasContact(contact)) return false;
  if (assistantAskedForContact(messages)) return false;

  const userMessages = messages.filter((m) => m.role === "user");
  if (userMessages.length < MIN_USER_TURNS_BEFORE_ASK) return false;

  const latest = userMessages[userMessages.length - 1].content;
  if (PLEASANTRY.test(latest.trim())) return false;
  if (wordCount(latest) < MIN_LATEST_WORDS) return false;

  const totalWords = userMessages.reduce(
    (sum, m) => sum + wordCount(m.content),
    0,
  );
  return totalWords >= MIN_TOTAL_USER_WORDS;
}
