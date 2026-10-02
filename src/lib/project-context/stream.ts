import type { RetrievedContext } from "./types";
export function contextDraftResponse(
  textStream: AsyncIterable<string>,
  context: RetrievedContext,
) {
  const encoder = new TextEncoder();
  let cancelled = false;
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: unknown) => {
        if (!cancelled)
          controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      };
      try {
        send({
          type: "context",
          evidence: context.evidence,
          notice: context.notice,
        });
        for await (const text of textStream) {
          if (cancelled) break;
          send({ type: "text", text });
        }
        if (!cancelled) {
          send({ type: "done" });
          controller.close();
        }
      } catch {
        if (!cancelled) {
          send({
            type: "error",
            message: "Draft generation was interrupted. Please try again.",
          });
          controller.close();
        }
      }
    },
    cancel() {
      cancelled = true;
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-store",
    },
  });
}
