import fs from "node:fs";
import path from "node:path";
import { generateText, Output } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { z } from "zod";
import {
  billingTypeLabels,
  isTicketCategory,
  isTicketPriority,
  ticketCategoryLabels,
  ticketPriorityLabels,
} from "@/lib/crm";
import type {
  BillingType,
  TicketCategory,
  TicketPriority,
  TicketType,
} from "@/types/crm";

// Zod schema for what the model must return. Enums/strings/arrays only —
// Anthropic's structured output mode rejects JSON schema min/max/length
// constraints, so ranges and caps are enforced in TypeScript after the call
// (same approach as leadQualification.ts).
export const triageSchema = z.object({
  summary: z
    .string()
    .describe(
      "2-3 sentence plain-English summary of what the client needs, written for Kyle skimming a notification. Under 400 characters.",
    ),
  suggested_priority: z
    .enum(["low", "normal", "high", "urgent"])
    .describe(
      "Priority per the rubric in the guidelines. Be conservative: 'urgent' only for production-down, money-losing, data-loss, or security issues. Default to 'normal' when no time pressure is stated.",
    ),
  priority_reasoning: z
    .string()
    .describe(
      "One sentence explaining the priority choice. Under 200 characters.",
    ),
  suggested_category: z
    .enum(["website", "automation", "ai_voice", "hosting", "billing", "other"])
    .describe("Best-fit service category for this ticket per the guidelines."),
  category_confidence: z
    .enum(["high", "medium", "low"])
    .describe(
      "'high' = the ticket clearly names the system involved (URL, 'the phone agent', an invoice). 'medium' = probable inference. 'low' = guessing.",
    ),
  missing_info: z
    .array(z.string())
    .describe(
      "0-5 short items of information the ticket lacks that would change how Kyle responds, e.g. 'No URL for the affected page'. Empty array if the ticket is complete — do not invent gaps.",
    ),
  clarifying_questions: z
    .array(z.string())
    .describe(
      "0-3 questions Kyle could paste to the client verbatim to fill the gaps. Warm, plain language, one ask each. Empty array if none are needed.",
    ),
  work_scope: z
    .enum(["minor", "moderate", "major"])
    .describe(
      "Estimated size of the work requested, per the guidelines. 'minor' = small tweak (text/content change, tiny bug fix). 'moderate' = a real fix or small feature, hours of work. 'major' = new feature, redesign, integration, or multi-day effort. Judge scope only — never estimate a price.",
    ),
  work_scope_reasoning: z
    .string()
    .describe(
      "One sentence explaining the work-scope estimate. Under 200 characters.",
    ),
});

export type TicketTriage = z.infer<typeof triageSchema>;

export interface TicketTriageInput {
  type: TicketType;
  title: string;
  description: string;
  clientPriority: TicketPriority;
  clientCategory: TicketCategory | null;
  organizationName: string;
  billingType: BillingType | null;
  attachmentNames: string[];
}

// Read fresh per request, matching chatKnowledge.ts — edits to the markdown
// take effect on the next ticket without a restart. Also used by the
// pre-submit assist endpoint so both flows share one source of truth.
export function readTriageGuidelines(): string {
  try {
    return fs.readFileSync(
      path.join(process.cwd(), "src", "data", "knowledge", "ticket-triage.md"),
      "utf8",
    );
  } catch (error) {
    console.error("Failed to read ticket-triage.md:", error);
    return "";
  }
}

function buildSystemPrompt(): string {
  return [
    "You triage inbound support tickets for Kyle Greer's client portal. Your output is internal — only Kyle sees it, never the client. Extract the structured fields defined in the schema, following the guidelines below exactly.",
    "",
    "Attachments are provided as filenames only. You cannot see their contents — never describe or assume what an attachment shows.",
    "",
    "----",
    "# Triage Guidelines",
    readTriageGuidelines(),
  ].join("\n");
}

const priorityRank: Record<TicketPriority, number> = {
  low: 0,
  normal: 1,
  high: 2,
  urgent: 3,
};

/**
 * The AI may escalate priority but never downgrade below what the client
 * explicitly chose — a client who marked something urgent shouldn't silently
 * see it drop.
 */
export function resolveTriagedPriority(
  clientPriority: TicketPriority,
  suggested: TicketPriority,
): TicketPriority {
  return priorityRank[suggested] > priorityRank[clientPriority]
    ? suggested
    : clientPriority;
}

/**
 * Fill the category when the client left it blank ("General"); override an
 * explicit client choice only when the model is highly confident.
 */
export function resolveTriagedCategory(
  clientCategory: TicketCategory | null,
  suggested: TicketCategory,
  confidence: TicketTriage["category_confidence"],
): TicketCategory | null {
  if (!clientCategory) {
    return suggested;
  }

  return confidence === "high" ? suggested : clientCategory;
}

/**
 * Combine the client's billing arrangement with the AI's work-scope estimate
 * into a one-line billing hint for Kyle. Deterministic TS, not the model —
 * the model only judges scope, never money.
 */
export function assessBillability(
  billingType: BillingType | null,
  workScope: TicketTriage["work_scope"],
): string {
  if (billingType === "trade") {
    return "Billable — trade agreement client: price this out for the leverage sheet.";
  }

  if (billingType === "per_project") {
    return "Billable — per-project client.";
  }

  if (billingType === "monthly_plan") {
    if (workScope === "minor") {
      return "Likely covered by the monthly plan (minor work).";
    }
    if (workScope === "major") {
      return "Likely billable — major work beyond the monthly plan.";
    }
    return "Judgment call — moderate scope on a monthly plan.";
  }

  return "No billing arrangement set for this client.";
}

/**
 * Plain-text internal note body. The ticket thread renders whitespace-pre-wrap
 * plain text (no markdown), so structure comes from line breaks only.
 */
export function formatTriageNote(
  triage: TicketTriage,
  applied: {
    clientPriority: TicketPriority;
    clientCategory: TicketCategory | null;
    appliedPriority: TicketPriority;
    appliedCategory: TicketCategory | null;
    billingType: BillingType | null;
  },
): string {
  const clientCategoryLabel = applied.clientCategory
    ? ticketCategoryLabels[applied.clientCategory]
    : "General";
  const appliedCategoryLabel = applied.appliedCategory
    ? ticketCategoryLabels[applied.appliedCategory]
    : "General";

  const lines = [
    "AI TRIAGE (internal — not visible to the client)",
    "",
    `Summary: ${triage.summary}`,
    "",
    `Priority: ${ticketPriorityLabels[applied.appliedPriority]} (client selected: ${ticketPriorityLabels[applied.clientPriority]}) — ${triage.priority_reasoning}`,
    `Category: ${appliedCategoryLabel} (client selected: ${clientCategoryLabel}, confidence: ${triage.category_confidence})`,
    `Work scope: ${triage.work_scope} — ${triage.work_scope_reasoning}`,
    `Billing: ${assessBillability(applied.billingType, triage.work_scope)}${
      applied.billingType
        ? ` (arrangement: ${billingTypeLabels[applied.billingType]})`
        : ""
    }`,
  ];

  if (triage.missing_info.length > 0) {
    lines.push("", "Missing info:");
    triage.missing_info.forEach((item) => lines.push(`- ${item}`));
  }

  if (triage.clarifying_questions.length > 0) {
    lines.push("", "Suggested questions to send the client:");
    triage.clarifying_questions.forEach((question, index) =>
      lines.push(`${index + 1}. ${question}`),
    );
  }

  lines.push("", "Review before replying — AI suggestions may be wrong.");

  return lines.join("\n");
}

/**
 * Run AI triage on a new ticket. Uses Claude Haiku 4.5 via OpenRouter for
 * speed + cost. Returns null if the OpenRouter key is missing or the call
 * fails — ticket creation must never depend on triage succeeding.
 */
export async function triageTicket(
  input: TicketTriageInput,
): Promise<TicketTriage | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.warn("OPENROUTER_API_KEY not set — skipping ticket triage");
    return null;
  }

  try {
    const openrouter = createOpenRouter({ apiKey });
    const userPrompt = [
      `Organization: ${input.organizationName}`,
      `Ticket type: ${input.type}`,
      `Client-selected priority: ${ticketPriorityLabels[input.clientPriority]}`,
      `Client-selected category: ${
        input.clientCategory
          ? ticketCategoryLabels[input.clientCategory]
          : "General (none chosen)"
      }`,
      `Billing arrangement: ${
        input.billingType
          ? billingTypeLabels[input.billingType]
          : "not set"
      }`,
      `Attachments: ${
        input.attachmentNames.length > 0
          ? input.attachmentNames.join(", ")
          : "none"
      }`,
      "",
      `Title: ${input.title}`,
      "",
      "Description:",
      input.description.slice(0, 5000),
    ].join("\n");

    const { output } = await generateText({
      model: openrouter.chat("anthropic/claude-haiku-4.5"),
      system: buildSystemPrompt(),
      prompt: userPrompt,
      output: Output.object({ schema: triageSchema }),
      temperature: 0,
    });

    // Enforce length caps here rather than via Zod .max() — the model often
    // ignores character-count hints and a client-side Zod rejection would
    // lose the whole triage. Validate enums defensively as well.
    if (
      !isTicketPriority(output.suggested_priority) ||
      !isTicketCategory(output.suggested_category)
    ) {
      console.error("Ticket triage returned invalid enum values:", output);
      return null;
    }

    return {
      ...output,
      summary: output.summary.slice(0, 400),
      priority_reasoning: output.priority_reasoning.slice(0, 200),
      work_scope_reasoning: output.work_scope_reasoning.slice(0, 200),
      missing_info: output.missing_info
        .slice(0, 5)
        .map((item) => item.slice(0, 200)),
      clarifying_questions: output.clarifying_questions
        .slice(0, 3)
        .map((question) => question.slice(0, 300)),
    };
  } catch (error) {
    console.error("Ticket triage failed:", error);
    return null;
  }
}
