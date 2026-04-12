import { NextRequest, NextResponse } from "next/server";
import { requireApiClientUser } from "@/lib/api-auth";
import { jsonError, jsonFromAuthError } from "@/lib/api-response";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "deepseek/deepseek-v3.2";
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

  const contextLines: string[] = [];
  for (const [stepKey, stepResponses] of Object.entries(context)) {
    for (const [key, val] of Object.entries(stepResponses)) {
      if (val && key !== "final_notes") {
        contextLines.push(`${stepKey} / ${key}: ${String(val).slice(0, 500)}`);
      }
    }
  }

  const contextSection =
    contextLines.length > 0
      ? `\n\nContext from other answers:\n${contextLines.join("\n")}`
      : "";

  return `${fieldSection}${contextSection}`;
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
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonError("Invalid request body.", 400);
  }

  const { fieldLabel, action, currentValue, context = {} } = body;

  if (!fieldLabel || !currentValue?.trim()) {
    return jsonError("fieldLabel and currentValue are required.", 400);
  }

  if (action !== "polish" && action !== "expand") {
    return jsonError("action must be 'polish' or 'expand'.", 400);
  }

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
          {
            role: "system",
            content: buildSystemPrompt(action),
          },
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
