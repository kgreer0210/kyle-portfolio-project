import { generateText, Output } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { z } from "zod";
import type { ChatMessageRecord } from "@/lib/chatStorage";

export const chatScoringSchema = z.object({
  intent: z
    .enum(["ready_to_book", "exploring", "tire_kicker", "support", "spam"])
    .describe(
      "Visitor intent. 'ready_to_book' = clearly wants a call or has explicitly asked to book. 'exploring' = serious problem, gathering info. 'tire_kicker' = vague, no real problem described. 'support' = existing client looking for help. 'spam' = bot or completely unrelated.",
    ),
  project_type: z
    .enum([
      "web_app",
      "marketing_site",
      "ai_assistant",
      "voice_agent",
      "automation",
      "integration",
      "mobile_app",
      "other",
      "unknown",
    ])
    .describe(
      "Which Kyle service the conversation maps to. Use 'unknown' if there's no clear signal.",
    ),
  project_fit_score: z
    .number()
    .describe(
      "Integer 0-100 for how well the visitor's described problem fits Kyle's services. A clear small-business web app rebuild = ~90. Vague 'I want a website' = ~45. Enterprise SaaS request = ~10.",
    ),
  seriousness_score: z
    .number()
    .describe(
      "Integer 0-100 for how serious the visitor seems based on the conversation: specificity of their problem, business name mentions, length and quality of their answers, follow-through on the diagnostic questions.",
    ),
  budget_signal: z
    .enum(["explicit_high", "explicit_medium", "explicit_low", "implicit", "none"])
    .describe(
      "Budget signal from the conversation. 'none' if they never mentioned budget. Be conservative.",
    ),
  timeline: z
    .enum(["asap", "weeks", "months", "exploring", "unknown"])
    .describe("How urgent the project is, based on what the visitor said."),
  summary: z
    .string()
    .describe(
      "A 2-3 sentence framing of what the visitor described. NOT a solution — a one-paragraph summary of their problem in plain English. Under 600 characters.",
    ),
  recommended_action: z
    .string()
    .describe(
      "One sentence of next-action advice for Kyle, under 300 characters. e.g. 'Same-day reply — high-fit web app rebuild for a local cleaning business with explicit budget' or 'Low priority — vague tire-kicker, safe to send a generic follow-up'.",
    ),
});

export type ChatLeadScoring = z.infer<typeof chatScoringSchema> & {
  overall_score: number;
  score_tier: "high" | "medium" | "low";
};

const SYSTEM_PROMPT = `You analyze chat transcripts from Kyle Greer's portfolio site (kygrsolutions.com) and produce a structured lead score.

Kyle is a part-time independent developer working with small businesses. He builds:
(1) custom web apps and portals,
(2) marketing/business websites,
(3) AI assistants and automations,
(4) integrations and internal tooling,
(5) mobile apps for iOS and Android.

He is NOT a fit for enterprise systems with formal SLAs, generic Wix/Squarespace template work, or projects that conflict with Christian values.

You will be given a transcript of a chat conversation between a visitor and Kyle's diagnostic chatbot. Extract the structured fields per the schema. Be conservative — when ambiguous, prefer the less-enthusiastic option ('unknown' over guessing, 'none' over 'implicit'). Never invent details that weren't in the transcript.`;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function computeOverallScore(q: z.infer<typeof chatScoringSchema>): number {
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

  const intentMultiplier =
    q.intent === "ready_to_book"
      ? 1
      : q.intent === "exploring"
        ? 0.7
        : q.intent === "support"
          ? 0.5
          : q.intent === "tire_kicker"
            ? 0.25
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

function transcriptToText(messages: ChatMessageRecord[]): string {
  return messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => `${m.role === "user" ? "Visitor" : "Kyle's AI"}: ${m.content}`)
    .join("\n\n");
}

/**
 * Score a chat transcript using Claude Haiku 4.5 via OpenRouter. Returns null
 * if the API key is missing or the call fails — callers should fall back
 * to writing the conversation without a score rather than failing the request.
 */
export async function scoreChatTranscript(
  messages: ChatMessageRecord[],
  visitorMeta: { name: string | null; email: string | null },
): Promise<ChatLeadScoring | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.warn("OPENROUTER_API_KEY not set — skipping chat lead scoring");
    return null;
  }

  const transcript = transcriptToText(messages);
  if (!transcript.trim()) return null;

  try {
    const openrouter = createOpenRouter({ apiKey });
    const userPrompt = [
      `Visitor name: ${visitorMeta.name ?? "(not provided)"}`,
      `Visitor email: ${visitorMeta.email ?? "(not provided)"}`,
      "",
      "Transcript:",
      transcript,
    ].join("\n");

    const { output } = await generateText({
      model: openrouter.chat("anthropic/claude-haiku-4.5"),
      system: SYSTEM_PROMPT,
      prompt: userPrompt,
      output: Output.object({ schema: chatScoringSchema }),
      temperature: 0,
    });

    const normalized = {
      ...output,
      project_fit_score: Math.round(clamp(output.project_fit_score, 0, 100)),
      seriousness_score: Math.round(clamp(output.seriousness_score, 0, 100)),
      summary: output.summary.slice(0, 600),
      recommended_action: output.recommended_action.slice(0, 300),
    };

    const overall_score = computeOverallScore(normalized);
    const score_tier = deriveTier(overall_score);

    return { ...normalized, overall_score, score_tier };
  } catch (error) {
    console.error("Chat lead scoring failed:", error);
    return null;
  }
}
