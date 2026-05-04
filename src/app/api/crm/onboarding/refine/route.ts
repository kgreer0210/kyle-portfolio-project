import { NextRequest, NextResponse } from "next/server";
import { generateObject, generateText } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { z } from "zod";
import { requireApiClientUser } from "@/lib/api-auth";
import { jsonError, jsonFromAuthError } from "@/lib/api-response";
import { formatFieldValue, onboardingSteps } from "@/lib/crm";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "deepseek/deepseek-v3.2";
const MODEL_QUESTIONNAIRE = "google/gemini-2.5-flash";
const MAX_INPUT_CHARS = 4000;

function buildSystemPrompt(action: "polish" | "expand"): string {
  if (action === "polish") {
    return [
      "You are a professional business writing assistant.",
      "Your task is to polish the user's answer so it is clear, concise, and professional.",
      "Preserve all the original meaning and facts — only improve grammar, clarity, and tone.",
      "Return only the improved text with no preamble, explanation, or formatting.",
    ].join(" ");
  }
  return [
    "You are a professional business writing assistant helping a client fill out an onboarding questionnaire.",
    "Your task is to expand a rough draft answer into a complete, detailed response.",
    "Use context from the client's other answers to make the expansion relevant and specific.",
    "Return only the expanded answer text with no preamble, explanation, or formatting.",
  ].join(" ");
}

function buildUserPrompt(
  action: "polish" | "expand",
  fieldLabel: string,
  currentValue: string,
  context: Record<string, Record<string, string>>,
): string {
  const fieldSection = `Field: "${fieldLabel}"\nCurrent answer: ${currentValue.slice(0, MAX_INPUT_CHARS)}`;

  if (action === "polish") {
    return fieldSection;
  }

  const contextLines = collectContextLines(context);
  const contextSection =
    contextLines.length > 0
      ? `\n\nContext from other answers:\n${contextLines.join("\n")}`
      : "";

  return `${fieldSection}${contextSection}`;
}

function collectContextLines(
  context: Record<string, Record<string, string>>,
): string[] {
  const lines: string[] = [];
  for (const [stepKey, stepResponses] of Object.entries(context)) {
    const step = onboardingSteps.find((s) => s.key === stepKey);
    for (const [key, val] of Object.entries(stepResponses)) {
      if (!val || key === "final_notes") continue;
      const field = step?.fields.find((f) => f.key === key);
      const formatted = field
        ? formatFieldValue(field, String(val))
        : String(val);
      if (!formatted) continue;
      lines.push(`${stepKey} / ${key}: ${formatted.slice(0, 500)}`);
    }
  }
  return lines;
}

const questionnaireSchema = z.object({
  questions: z
    .array(
      z.object({
        id: z
          .string()
          .describe(
            "Short snake_case id for this question, unique within the set (e.g. 'audience', 'tone', 'priority').",
          ),
        prompt: z
          .string()
          .describe(
            "The question shown to the user. One sentence, ends with a question mark, under 90 characters.",
          ),
        allowMultiple: z
          .boolean()
          .describe(
            "True if the user might reasonably select more than one answer (e.g. 'What services do you offer?', 'Which industries do you serve?'). False for questions with one true answer (e.g. 'What is your team size?', 'How long have you been in business?').",
          ),
        options: z
          .array(
            z.object({
              value: z
                .string()
                .describe("Short snake_case identifier for this option."),
              label: z
                .string()
                .describe(
                  "Display text for this option, ≤6 words, no trailing punctuation.",
                ),
              description: z
                .string()
                .optional()
                .describe(
                  "Optional one-line clarifier (≤90 chars) shown beneath the label.",
                ),
            }),
          )
          .length(4)
          .describe(
            "Exactly four answer options. For single-select questions they should be mutually exclusive; for multi-select they should be distinct items the user might combine.",
          ),
      }),
    )
    .length(3)
    .describe("Exactly three questions."),
});

type Answer = {
  questionId: string;
  prompt: string;
  selectedLabels: string[];
  selectedValues: string[];
  customText?: string;
  allowMultiple?: boolean;
  offeredOptions?: string[];
};

const answerSchema = z.object({
  questionId: z.string(),
  prompt: z.string(),
  selectedLabels: z.array(z.string()),
  selectedValues: z.array(z.string()),
  customText: z.string().optional(),
  allowMultiple: z.boolean().optional(),
  offeredOptions: z.array(z.string()).optional(),
});

function buildQuestionsPrompt(
  fieldLabel: string,
  currentValue: string,
  context: Record<string, Record<string, string>>,
): string {
  const draftSection = currentValue.trim()
    ? `Facts the user has ALREADY stated (treat as established ground truth — never ask the user to repeat or re-confirm any of this):\n"""\n${currentValue.slice(0, MAX_INPUT_CHARS)}\n"""`
    : "The user has not typed anything yet — design discovery questions appropriate for any small business.";
  const contextLines = collectContextLines(context);
  const contextSection =
    contextLines.length > 0
      ? `\n\nFacts established in other onboarding answers (also do not re-ask):\n${contextLines.join("\n")}`
      : "";
  return `Field being filled: "${fieldLabel}"\n\n${draftSection}${contextSection}\n\nDesign 3 questions that, when answered, would let you write a richer, more specific version of this field. Each question must add NEW signal that the established facts above don't already contain. If the user said they serve "middle GA", do not ask about geographic reach. If the user said they serve "residential and commercial", do not ask who their customers are. Tailor the questions to this specific business.`;
}

function buildComposePrompt(
  fieldLabel: string,
  currentValue: string,
  answers: Answer[],
): string {
  const lines: string[] = [`Field: "${fieldLabel}"`];
  if (currentValue.trim()) {
    lines.push(
      "",
      `User's rough draft (use as additional context, do not contradict): ${currentValue.slice(0, MAX_INPUT_CHARS)}`,
    );
  }
  lines.push("", "User's questions and answers:");
  for (const a of answers) {
    lines.push(`- Question: ${a.prompt}`);
    if (a.offeredOptions && a.offeredOptions.length > 0) {
      lines.push(
        `  Options offered${a.allowMultiple ? " (multi-select)" : ""}: ${a.offeredOptions.map((o) => `"${o}"`).join(", ")}`,
      );
    }
    if (a.selectedLabels.length > 0) {
      lines.push(
        `  User selected: ${a.selectedLabels.map((l) => `"${l}"`).join(", ")}`,
      );
    }
    if (a.customText && a.customText.trim()) {
      lines.push(`  User added (custom, free-text): ${a.customText.trim()}`);
    }
  }
  lines.push(
    "",
    "Treat selected options and any custom free-text as a combined answer to that question — include all of them in the final response. If the user's free-text references the offered options (e.g. \"all of the above\", \"the first three\", \"everything except X\"), expand those references into the specific items from the options list. Do not add services, details, or claims that are not in the options or the user's text.",
  );
  return lines.join("\n");
}

export async function POST(request: NextRequest) {
  try {
    await requireApiClientUser();
  } catch (error) {
    return jsonFromAuthError(error) || jsonError("Unauthorized", 401);
  }

  const apiKey = process.env.OPEN_ROUTER_API_KEY;
  if (!apiKey) {
    return jsonError("AI refine is not configured.", 503);
  }

  let body: {
    fieldKey?: string;
    fieldLabel?: string;
    action?: string;
    currentValue?: string;
    context?: Record<string, Record<string, string>>;
    answers?: unknown;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonError("Invalid request body.", 400);
  }

  const {
    fieldLabel,
    action,
    currentValue = "",
    context = {},
    answers,
  } = body;

  if (!fieldLabel) {
    return jsonError("fieldLabel is required.", 400);
  }

  if (action === "polish" || action === "expand") {
    if (!currentValue.trim()) {
      return jsonError("currentValue is required.", 400);
    }
    return runLegacyRefine(apiKey, action, fieldLabel, currentValue, context);
  }

  if (action === "questions") {
    return runQuestions(apiKey, fieldLabel, currentValue, context);
  }

  if (action === "compose") {
    const parsed = z.array(answerSchema).length(3).safeParse(answers);
    if (!parsed.success) {
      return jsonError("answers must contain exactly 3 entries.", 400);
    }
    return runCompose(apiKey, fieldLabel, currentValue, parsed.data);
  }

  return jsonError(
    "action must be 'polish', 'expand', 'questions', or 'compose'.",
    400,
  );
}

async function runLegacyRefine(
  apiKey: string,
  action: "polish" | "expand",
  fieldLabel: string,
  currentValue: string,
  context: Record<string, Record<string, string>>,
) {
  try {
    const openRouterResponse = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL ?? "",
        "X-Title": "Kyle Greer CRM - Onboarding Refine",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: buildSystemPrompt(action) },
          {
            role: "user",
            content: buildUserPrompt(action, fieldLabel, currentValue, context),
          },
        ],
        max_tokens: 800,
        temperature: 0.4,
      }),
    });

    if (!openRouterResponse.ok) {
      const errText = await openRouterResponse.text();
      console.error("OpenRouter error:", errText);
      return jsonError("AI service returned an error. Please try again.", 502);
    }

    const data = (await openRouterResponse.json()) as {
      choices?: { message?: { content?: string } }[];
    };

    const result = data.choices?.[0]?.message?.content?.trim();
    if (!result) {
      return jsonError("AI returned an empty response.", 502);
    }

    return NextResponse.json({ result });
  } catch (err) {
    console.error("Refine route error:", err);
    return jsonError("Unable to reach the AI service.", 502);
  }
}

async function runQuestions(
  apiKey: string,
  fieldLabel: string,
  currentValue: string,
  context: Record<string, Record<string, string>>,
) {
  try {
    const openrouter = createOpenRouter({ apiKey });
    const { object } = await generateObject({
      model: openrouter.chat(MODEL_QUESTIONNAIRE),
      schema: questionnaireSchema,
      system: [
        "You design quick multiple-choice questionnaires that help a small-business client",
        "expand a specific onboarding field into a richer, more specific answer.",
        "",
        "HARD RULES:",
        "1. Treat anything the user has already written (their draft and other onboarding answers)",
        "   as ESTABLISHED FACTS. Never ask a question whose answer is already in those facts.",
        "   For example, if the draft says 'cleaning company in middle GA serving residential and",
        "   commercial', do NOT ask about geography, industry, or customer type — those are settled.",
        "2. Every question must add NEW signal that would meaningfully enrich the final answer for",
        "   THIS specific business. Generic small-business intake questions ('do you sell products",
        "   or services?', 'are your customers individuals or businesses?', 'local vs national?')",
        "   are forbidden when the user has already given enough info to skip them.",
        "3. Tailor questions to the user's stated industry and situation. For a regional cleaning",
        "   company, good questions surface things like: typical job mix (one-time vs recurring),",
        "   what sets them apart, sweet-spot customer profile, common service requests, team size",
        "   or capacity, specialties (move-outs, post-construction, AirBnB turnovers, eco-friendly).",
        "4. Each question has exactly four answer options written in plain English (≤6 words each).",
        "   Options should be plausible answers for THIS specific business given what the user has",
        "   shared — not a generic catch-all list.",
        "5. Set allowMultiple=true when a real small business might reasonably pick more than one",
        "   option (e.g. 'Which services do you offer?', 'Which industries do you serve?', 'What",
        "   are your top differentiators?'). Set allowMultiple=false only when there is one true",
        "   answer (e.g. 'What is your team size?', 'How long have you been in business?',",
        "   'What is your typical project length?'). When in doubt, prefer allowMultiple=true.",
        "6. Do not ask the user to type free text in the question itself. They will get a separate",
        "   custom input under each question automatically.",
      ].join("\n"),
      prompt: buildQuestionsPrompt(fieldLabel, currentValue, context),
      temperature: 0.6,
    });

    return NextResponse.json({ questions: object.questions });
  } catch (err) {
    console.error("Refine questions error:", err);
    return jsonError("Unable to generate questions.", 502);
  }
}

async function runCompose(
  apiKey: string,
  fieldLabel: string,
  currentValue: string,
  answers: Answer[],
) {
  try {
    const openrouter = createOpenRouter({ apiKey });
    const { text } = await generateText({
      model: openrouter.chat(MODEL_QUESTIONNAIRE),
      system: [
        "You write the final onboarding answer for a single field, on behalf of a small-business",
        "client. Use the user's selected multiple-choice answers as ground truth. Do not invent",
        "details that are not in the answers. Write 2-4 concise sentences in plain professional",
        "prose. No headings, no bullets, no preamble, no quotation marks. Return only the answer text.",
      ].join(" "),
      prompt: buildComposePrompt(fieldLabel, currentValue, answers),
      temperature: 0.5,
    });

    const result = text.trim();
    if (!result) {
      return jsonError("AI returned an empty response.", 502);
    }
    return NextResponse.json({ result });
  } catch (err) {
    console.error("Refine compose error:", err);
    return jsonError("Unable to compose answer.", 502);
  }
}
