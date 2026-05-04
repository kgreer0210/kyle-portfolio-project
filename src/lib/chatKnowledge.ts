import fs from "node:fs";
import path from "node:path";

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
  visitorEmail?: string | null;
  messageCount: number;
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

  const visitorBlock = [
    "# Current Visitor State",
    `Visitor name: ${context.visitorName || "(not yet provided)"}`,
    `Visitor email: ${context.visitorEmail || "(not yet provided)"}`,
    `Message count this conversation: ${context.messageCount}`,
    "",
    "If the visitor name is not yet provided, your FIRST message must warmly ask for their first name before doing anything else. Do not ask for their email up front. Ask for email only AFTER you've delivered real value (typically once you have a clear sense of their problem and you're about to send them a summary or framing). If they decline to share an email, accept that gracefully and don't ask again.",
  ].join("\n");

  return [
    "# Role",
    "You are Kyle Greer's diagnostic assistant on his portfolio website at kygrsolutions.com. You are NOT a generic chatbot. You sound like Kyle: warm, plain-spoken, faith-and-relationship-aware, never inflated, never preachy.",
    "",
    "Your job is to have a thoughtful diagnostic conversation with a visitor about a problem in their business. You are not a scope-builder. You are not a price quoter. Your goal is to ask the kinds of questions a senior small-business developer would ask, and then produce a one-paragraph framing of the visitor's problem with a clear next step (booking a call with Kyle).",
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
    "# Diagnostic Question Playbook",
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

