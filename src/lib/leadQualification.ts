import { generateText, Output } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { z } from "zod";

// Zod schema for what the model must return. Keep field descriptions crisp — the
// OpenRouter provider forwards them to the model as schema hints.
export const qualificationSchema = z.object({
  intent: z
    .enum(["hire", "info", "partnership", "support", "spam"])
    .describe(
      "Primary reason this person reached out. 'hire' = wants to pay for work. 'info' = exploratory / no clear intent. 'partnership' = agency/referral/collab. 'support' = existing client. 'spam' = bot, scraped pitch, or irrelevant.",
    ),
  project_type: z
    .enum([
      "web_app",
      "ai_integration",
      "voice_agent",
      "automation",
      "other",
      "unknown",
    ])
    .describe(
      "Which Kyle service the inquiry maps to: web_app (Next.js/React site or app), ai_integration (LLM features or agents bolted onto existing systems), voice_agent (Retell-style phone AI), automation (workflow/backoffice/business process tooling), other, or unknown when the message gives no signal.",
    ),
  project_fit_score: z
    .number()
    .describe(
      "Integer 0-100 (inclusive) for how well the inquiry matches Kyle's actual services. A vague 'need a website' = ~40. A specific Next.js rebuild = ~90. A WordPress-only request = ~15 (not his stack). You MUST return a whole number between 0 and 100.",
    ),
  budget_signal: z
    .enum(["explicit_high", "explicit_medium", "explicit_low", "implicit", "none"])
    .describe(
      "Budget signal extracted from the message. 'explicit_*' = specific number or range mentioned. 'implicit' = phrases like 'serious investment' or 'retainer' without a number. 'none' = no budget mention at all. Be conservative — absence of a budget mention is 'none', not 'implicit'.",
    ),
  timeline: z
    .enum(["asap", "weeks", "months", "exploring", "unknown"])
    .describe(
      "How urgent the project is. asap = days. weeks = 1–6 weeks. months = longer-term planning. exploring = no timeline mentioned or 'just thinking about it'. unknown = ambiguous.",
    ),
  seriousness_score: z
    .number()
    .describe(
      "Integer 0-100 (inclusive) for how serious this lead appears, based on: message specificity, company name mention, describing a concrete problem, length and quality of writing, prior solutions tried. A detailed 3-paragraph message from a named company = ~85. A one-line 'how much for a website?' = ~20. You MUST return a whole number between 0 and 100.",
    ),
  reasoning: z
    .string()
    .describe(
      "2–4 sentences explaining the scores, under 500 characters total. Plain English, no bullet points. Aimed at a human skimming a notification. Be concise — this gets truncated if too long.",
    ),
  recommended_action: z
    .string()
    .describe(
      "One sentence of next-action advice for Kyle, under 300 characters. e.g. 'Reply same-day with a Calendly link — high-fit Next.js rebuild with explicit budget' or 'Low priority — likely spam, safe to ignore'.",
    ),
});

export type Qualification = z.infer<typeof qualificationSchema> & {
  overall_score: number;
  score_tier: "high" | "medium" | "low";
};

export interface QualificationInput {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const SYSTEM_PROMPT = `You qualify inbound leads for Kyle Greer, a software developer who builds:
(1) custom web apps (Next.js / React / TypeScript),
(2) AI integrations and agents (LLMs, RAG, tool use),
(3) voice AI agents (Retell-style phone agents),
(4) business automation and workflow tooling.

Kyle is an independent developer who works with small businesses. He does NOT do WordPress,
Wix, Squarespace, cheap template sites, or SEO-only work. Score those low on project fit.

You will be given a contact-form submission. Extract the structured fields defined in the
schema. Be conservative: when a field is ambiguous, prefer the less-enthusiastic option
(e.g. 'unknown' over guessing, 'none' over 'implicit' for budget). Never invent information
that is not in the message.`;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Weighted blend of the four dimension scores into a single 0–100 overall score.
 * Project fit carries the most weight — a perfect message about the wrong service is
 * still the wrong service. Seriousness second (is this a real person?). Budget and
 * timeline round out the picture.
 *
 * Clamps the two model-provided integer scores to 0-100 as a safety net: Anthropic's
 * structured output mode rejects JSON schema min/max constraints, so we enforce the
 * range via prompt + this clamp rather than via Zod.
 */
function computeOverallScore(q: z.infer<typeof qualificationSchema>): number {
  const projectFit = clamp(q.project_fit_score, 0, 100);
  const seriousness = clamp(q.seriousness_score, 0, 100);

  const budgetScore =
    q.budget_signal === "explicit_high"
      ? 100
      : q.budget_signal === "explicit_medium"
        ? 75
        : q.budget_signal === "explicit_low"
          ? 40
          : q.budget_signal === "implicit"
            ? 55
            : 25;

  const timelineScore =
    q.timeline === "asap"
      ? 95
      : q.timeline === "weeks"
        ? 80
        : q.timeline === "months"
          ? 55
          : q.timeline === "exploring"
            ? 30
            : 40;

  // If the intent isn't "hire" the overall score is capped — even a perfect
  // partnership or support message isn't a "hot sales lead".
  const intentMultiplier =
    q.intent === "hire"
      ? 1
      : q.intent === "partnership"
        ? 0.65
        : q.intent === "info"
          ? 0.55
          : q.intent === "support"
            ? 0.5
            : 0.05; // spam

  const weighted =
    projectFit * 0.4 +
    seriousness * 0.3 +
    budgetScore * 0.2 +
    timelineScore * 0.1;

  return clamp(Math.round(weighted * intentMultiplier), 0, 100);
}

function deriveTier(overallScore: number): "high" | "medium" | "low" {
  if (overallScore >= 75) return "high";
  if (overallScore >= 40) return "medium";
  return "low";
}

/**
 * Run AI qualification on a contact form submission. Uses Claude Haiku 4.5 via
 * OpenRouter for speed + cost. Returns null if the OpenRouter key is missing or
 * the call fails — callers should fall back to a safe default (medium tier) so
 * qualification failures never block form submission.
 */
export async function qualifyLead(
  input: QualificationInput,
): Promise<Qualification | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.warn("OPENROUTER_API_KEY not set — skipping lead qualification");
    return null;
  }

  try {
    const openrouter = createOpenRouter({ apiKey });
    const userPrompt = [
      `From: ${input.name} <${input.email}>`,
      `Service selected: ${input.subject}`,
      "",
      "Message:",
      input.message,
    ].join("\n");

    const { output } = await generateText({
      model: openrouter.chat("anthropic/claude-haiku-4.5"),
      system: SYSTEM_PROMPT,
      prompt: userPrompt,
      output: Output.object({ schema: qualificationSchema }),
      temperature: 0,
    });

    // The schema accepts z.number() (not .int()) because Zod v4's .int()
    // auto-injects safe-integer minimum/maximum which Anthropic rejects.
    // Round + clamp integers, and truncate free-text fields here rather than
    // via Zod .max() — the model often ignores character-count constraints
    // and Zod client-side validation would then reject a perfectly usable
    // response. Truncating is safer than losing the whole qualification.
    const normalized = {
      ...output,
      project_fit_score: Math.round(clamp(output.project_fit_score, 0, 100)),
      seriousness_score: Math.round(clamp(output.seriousness_score, 0, 100)),
      reasoning: output.reasoning.slice(0, 500),
      recommended_action: output.recommended_action.slice(0, 300),
    };

    const overall_score = computeOverallScore(normalized);
    const score_tier = deriveTier(overall_score);

    return {
      ...normalized,
      overall_score,
      score_tier,
    };
  } catch (error) {
    console.error("Lead qualification failed:", error);
    return null;
  }
}
