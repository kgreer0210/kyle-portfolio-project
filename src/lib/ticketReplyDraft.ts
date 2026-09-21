import type { TicketProjectScope } from "@/lib/ticketTriage";

export const REPLY_DRAFT_MODEL = "anthropic/claude-sonnet-5";

export interface DraftThreadMessage {
  author: "client" | "kyle" | "system";
  visibility: "public" | "internal";
  body: string;
  createdAt: string;
}

export interface ReplyDraftContext {
  organizationName: string;
  clientName: string | null;
  ticket: {
    title: string;
    description: string;
    status: string;
    outOfScope: boolean;
    costAmount: number | null;
  };
  messages: DraftThreadMessage[];
  projectScope: TicketProjectScope | null;
  /** Optional steer from Kyle, e.g. "tell them it'll be done Friday". */
  instructions: string | null;
}

export const REPLY_DRAFT_SYSTEM_PROMPT = [
  "You draft replies for Kyle Greer, who runs KYGR Solutions, a one-person software studio. Kyle reviews and edits every draft before sending it to his client.",
  "",
  "Rules:",
  "- Write only the reply body, in Kyle's voice: warm, direct, plain language, first person. No subject line, no placeholders like [Name] unless a fact is truly unknown.",
  "- Plain text only. No markdown, no bullet symbols unless a short list genuinely helps.",
  "- Use internal notes and AI triage as private context. Never quote them, mention them, or reveal that an AI was involved.",
  "- Don't invent facts, timelines, or fixes that aren't in the thread or Kyle's instructions. If something is unknown, ask the client the one question that unblocks the work.",
  "- Never state or estimate a price. If the ticket is flagged out of scope, say it falls outside the current project and that Kyle will send a quote.",
  "- Never ask for passwords.",
  "- Keep it short: usually 2-5 sentences.",
].join("\n");

/** Build the user prompt. Pure so it can be tested without the model. */
export function buildReplyDraftPrompt(context: ReplyDraftContext): string {
  const lines = [
    `Client: ${context.organizationName}${context.clientName ? ` (contact: ${context.clientName})` : ""}`,
    `Ticket status: ${context.ticket.status}`,
    `Flagged out of scope: ${context.ticket.outOfScope ? "yes" : "no"}`,
    ...(context.ticket.costAmount !== null ? ["A cost has already been set on this ticket and is visible to the client."] : []),
  ];

  if (context.projectScope) {
    lines.push(
      "",
      `Project: ${context.projectScope.title}`,
      ...(context.projectScope.summary ? [`Project summary: ${context.projectScope.summary.slice(0, 1500)}`] : []),
      ...(context.projectScope.outOfScope.length > 0
        ? [`Out of scope per SOW: ${context.projectScope.outOfScope.slice(0, 30).join("; ")}`]
        : []),
    );
  }

  lines.push(
    "",
    `Ticket title: ${context.ticket.title}`,
    "Original request:",
    context.ticket.description.slice(0, 5000),
    "",
    "Thread (oldest first):",
  );

  const recent = context.messages.slice(-30);
  if (recent.length === 0) {
    lines.push("(no replies yet)");
  }
  for (const message of recent) {
    const label =
      message.visibility === "internal"
        ? message.author === "system"
          ? "PRIVATE system/AI note"
          : "PRIVATE note from Kyle"
        : message.author === "client"
          ? "Client"
          : message.author === "kyle"
            ? "Kyle"
            : "System";
    lines.push(`--- ${label} (${message.createdAt})`, message.body.slice(0, 3000));
  }

  lines.push(
    "",
    context.instructions
      ? `Kyle's instructions for this reply: ${context.instructions.slice(0, 1000)}`
      : "Draft the next reply from Kyle to the client.",
  );

  return lines.join("\n");
}
