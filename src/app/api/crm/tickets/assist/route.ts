import { NextRequest } from "next/server";
import { streamText, type ModelMessage } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { requireApiClientUser } from "@/lib/api-auth";
import { jsonError, jsonFromAuthError } from "@/lib/api-response";
import { readTriageGuidelines } from "@/lib/ticketTriage";

export const runtime = "nodejs";
// Up to 5 minutes per request to allow longer streaming completions on
// Vercel Fluid Compute. Default would cut off mid-stream.
export const maxDuration = 300;

interface AssistRequestBody {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  draftTitle?: string | null;
  draftDescription?: string | null;
}

function buildAssistSystemPrompt(draft: {
  title: string | null;
  description: string | null;
}): string {
  return [
    "# Role",
    "You help clients of Kyle Greer's portal write a complete support ticket before they submit it. You do NOT fix anything yourself and you do NOT speak for Kyle — you only help the client describe their problem or request clearly.",
    "",
    "Rules:",
    "- Ask at most 3 clarifying questions, ONE at a time. Use the missing-info checklists in the guidelines below to decide what to ask. If the client's description already covers the essentials, skip straight to the summary.",
    "- Never promise fixes, timelines, or outcomes. Never estimate or discuss price. Kyle reviews every ticket personally.",
    "- Never ask for passwords, credentials, or payment details.",
    "- Write in plain prose. No markdown — no asterisks, no bullet lists, no headers. The chat UI renders raw text.",
    "- When you have enough information (or the client declines to answer), end your message with a summary block in EXACTLY this format, on its own lines:",
    "",
    "[TICKET SUMMARY]",
    "Title: <a short, specific title>",
    "What's happening: <the problem or request in plain words>",
    "Impact: <who/what is affected and how badly>",
    "Steps already tried: <anything the client tried, or 'None mentioned'>",
    "[/TICKET SUMMARY]",
    "",
    "Do not put anything after the closing [/TICKET SUMMARY] tag.",
    "",
    "----",
    "# What the client has entered in the ticket form so far",
    `Title: ${draft.title || "(empty)"}`,
    `Description: ${draft.description || "(empty)"}`,
    "",
    "----",
    "# Triage Guidelines (context for what a complete ticket needs)",
    readTriageGuidelines(),
  ].join("\n");
}

export async function POST(req: NextRequest) {
  try {
    await requireApiClientUser();
  } catch (error) {
    return jsonFromAuthError(error) || jsonError("Unauthorized", 401);
  }

  let body: AssistRequestBody;
  try {
    body = (await req.json()) as AssistRequestBody;
  } catch {
    return jsonError("Invalid JSON");
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return jsonError(
      "The ticket assistant is not available right now — the plain form still works.",
      503,
    );
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return jsonError("messages must be a non-empty array");
  }

  const trimmedMessages = body.messages
    .filter(
      (m) =>
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0,
    )
    .slice(-20)
    .map((m) => ({
      role: m.role,
      content: m.content.slice(0, 4000),
    }));

  const lastMessage = trimmedMessages[trimmedMessages.length - 1];
  if (!lastMessage || lastMessage.role !== "user") {
    return jsonError("messages must end with a non-empty user message");
  }

  const systemPrompt = buildAssistSystemPrompt({
    title: body.draftTitle?.trim().slice(0, 200) || null,
    description: body.draftDescription?.trim().slice(0, 5000) || null,
  });

  try {
    const openrouter = createOpenRouter({ apiKey });

    const modelMessages: ModelMessage[] = trimmedMessages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const result = streamText({
      model: openrouter.chat("anthropic/claude-haiku-4.5"),
      system: systemPrompt,
      messages: modelMessages,
      temperature: 0.4,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Ticket assist streaming failed:", error);
    return jsonError(
      "The ticket assistant is temporarily unavailable — the plain form still works.",
      500,
    );
  }
}
