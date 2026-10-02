import { z } from "zod";
import type { ContextEvidence } from "./project-context/types";
const eventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("context"),
    notice: z.string(),
    evidence: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        locator: z.string(),
        observedAt: z.string(),
        version: z.string().nullable(),
        coverage: z.string().nullable(),
        stale: z.boolean(),
      }),
    ),
  }),
  z.object({ type: z.literal("text"), text: z.string() }),
  z.object({ type: z.literal("done") }),
  z.object({ type: z.literal("error"), message: z.string() }),
]);
export async function readContextDraft(
  response: Response,
  onText: (text: string) => void,
  onContext: (evidence: ContextEvidence[], notice: string) => void,
) {
  if (!response.body) throw new Error("Draft response is empty.");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";
  let complete = false;
  function parse(line: string) {
    if (!line.trim()) return;
    const event = eventSchema.parse(JSON.parse(line));
    if (event.type === "text") {
      text += event.text;
      onText(text);
    } else if (event.type === "context")
      onContext(event.evidence, event.notice);
    else if (event.type === "error") throw new Error(event.message);
    else complete = true;
  }
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let end;
      while ((end = buffer.indexOf("\n")) >= 0) {
        parse(buffer.slice(0, end));
        buffer = buffer.slice(end + 1);
      }
    }
    buffer += decoder.decode();
    if (buffer.trim()) parse(buffer);
    if (!complete)
      throw new Error("Draft generation was interrupted. Please try again.");
    return text;
  } finally {
    reader.releaseLock();
  }
}
