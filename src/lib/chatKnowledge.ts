import fs from "node:fs";
import path from "node:path";
import { buildProjectKnowledge } from "@/lib/chatProjectKnowledge";
import type { Project } from "@/types";

// All knowledge files live under src/data/knowledge. They're read fresh on
// every request — the files are small (~5 KB total) and the I/O is
// microseconds. Reading fresh means edits to the MD files take effect on
// the very next chat turn without a dev-server restart.
const KNOWLEDGE_DIR = path.join(process.cwd(), "src", "data", "knowledge");

function readKnowledgeFile(filename: string): string {
  try {
    return fs.readFileSync(path.join(KNOWLEDGE_DIR, filename), "utf8");
  } catch (error) {
    console.error(`Failed to read knowledge file ${filename}:`, error);
    return "";
  }
}

interface KnowledgeBundle {
  bio: string;
  services: string;
  process: string;
  faq: string;
  diagnosticQuestions: string;
  scopingGuidelines: string;
}

function loadKnowledge(): KnowledgeBundle {
  return {
    bio: readKnowledgeFile("bio.md"),
    services: readKnowledgeFile("services.md"),
    process: readKnowledgeFile("process.md"),
    faq: readKnowledgeFile("faq.md"),
    diagnosticQuestions: readKnowledgeFile("diagnostic-questions.md"),
    scopingGuidelines: readKnowledgeFile("scoping-guidelines.md"),
  };
}

export interface ChatPromptContext {
  visitorName?: string | null;
  /** Whether we already hold an email or phone. The values never enter the prompt. */
  hasEmail?: boolean;
  hasPhone?: boolean;
  /** Deterministic permission to ask for contact details this turn. */
  askForContact?: boolean;
  messageCount: number;
  /** Override the portfolio, for tests. Defaults to src/data/projects.ts. */
  projects?: Project[];
}

/**
 * Assembles the system prompt for the chat assistant. Order matters:
 * scoping guidelines come FIRST so the model treats them as the highest
 * priority constraint. Voice/persona second. Concrete facts (services,
 * process, FAQ) third. Diagnostic playbook last. Visitor state metadata is
 * appended at the end so it shifts naturally as the conversation evolves.
 */
export function buildSystemPrompt(context: ChatPromptContext): string {
  const k = loadKnowledge();

  const hasContact = Boolean(context.hasEmail || context.hasPhone);
  const contactLine = hasContact
    ? `Contact details on file: ${[context.hasEmail && "email", context.hasPhone && "phone"].filter(Boolean).join(" and ")}. Do NOT ask for an email or phone number.`
    : context.askForContact
      ? "Contact details on file: none. ASK NOW: after answering, ask once, in one short sentence, for the best email or phone number to reach them. That is your one question this message; do not ask anything else and do not ask for their name. If they decline, drop it."
      : "Contact details on file: none. Do NOT ask for an email or phone number yet; keep helping.";

  const nameLine = context.askForContact && !hasContact
    ? "Name gathering: not in this message (you are asking for contact details instead). Never gate your answer on not having a name."
    : "Name gathering: do NOT ask for the visitor's name before answering their question. Answer first. If you don't know their name yet and you've had at least one substantive exchange, weave in asking naturally — something like 'By the way, who am I talking to?' If they share their name anywhere in the conversation, pick it up and use it. Never gate your answer on not having a name.";

  const visitorBlock = [
    "# Current Visitor State",
    `Visitor name: ${context.visitorName || "(not yet provided)"}`,
    contactLine,
    `Message count this conversation: ${context.messageCount}`,
    "",
    nameLine,
  ].join("\n");

  return [
    "# Role",
    "You are Kyle Greer's assistant on his portfolio website at kygrsolutions.com. You know Kyle's work, services, past projects, and how he operates inside and out. You are NOT a generic chatbot and NOT a diagnostic interviewer. You sound like Kyle: warm, plain-spoken, faith-and-relationship-aware, never inflated, never preachy.",
    "",
    "Your job: be genuinely helpful to whoever is visiting. Answer their questions directly. The natural outcome of being helpful is that serious visitors will want to book a call with Kyle — you don't need to push them toward it.",
    "",
    "ANSWER FIRST. If a visitor asks a question, answer it. Then, if one follow-up question would make you more helpful, ask it — after your answer, not before it. Never open a response with a question unless the visitor gave you literally nothing to work with (e.g., just 'hi'). Never ask more than one question per message.",
    "",
    "FORMATTING: Write in plain prose. No markdown — no asterisks for bold, no bullet lists, no headers. Write the way Kyle would text a friend: short paragraphs, normal punctuation, no formatting symbols. The chat UI does not render markdown, so any asterisks or other markdown will appear as raw characters and look unprofessional.",
    "",
    "----",
    "# Hard Rules and Scoping Guidelines (HIGHEST PRIORITY)",
    k.scopingGuidelines,
    "",
    "----",
    "# Voice and Background",
    k.bio,
    "",
    "----",
    "# Projects I've Built (from my portfolio)",
    "This list is generated from the portfolio and is the only source for what I've built. Talk about it in the first person, as Kyle would (\"I built...\"). Use the exact titles. Never add details that are not listed.",
    "",
    buildProjectKnowledge(context.projects),
    "",
    "----",
    "# Services",
    k.services,
    "",
    "----",
    "# How Projects Work With Kyle",
    k.process,
    "",
    "----",
    "# FAQ",
    k.faq,
    "",
    "----",
    "# Visitor Intent Guide",
    k.diagnosticQuestions,
    "",
    "----",
    "# Calendly Link",
    "When the visitor is ready to book a call, share this exact link: https://calendly.com/kylegreer-kygrsolutions/30min",
    "",
    "----",
    visitorBlock,
  ].join("\n");
}

