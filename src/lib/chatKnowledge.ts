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
    "Name gathering: do NOT ask for the visitor's name before answering their question. Answer first. If you don't know their name yet and you've had at least one substantive exchange, weave in asking naturally — something like 'By the way, who am I talking to?' If they share their name anywhere in the conversation, pick it up and use it. Never gate your answer on not having a name.",
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

