"use client";

import { FormEvent, useRef, useState } from "react";

interface AssistMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AssistSummary {
  title: string | null;
  description: string;
}

const SUMMARY_REGEX = /\[TICKET SUMMARY\]([\s\S]*?)\[\/TICKET SUMMARY\]/;

function extractSummary(content: string): AssistSummary | null {
  const match = content.match(SUMMARY_REGEX);

  if (!match) {
    return null;
  }

  const block = match[1].trim();
  const titleMatch = block.match(/^Title:\s*(.+)$/m);
  const description = block
    .split("\n")
    .filter((line) => !/^Title:\s*/.test(line))
    .join("\n")
    .trim();

  if (!description) {
    return null;
  }

  return {
    title: titleMatch?.[1]?.trim() || null,
    description,
  };
}

function stripSummaryBlock(content: string): string {
  return content.replace(SUMMARY_REGEX, "").trim();
}

export default function TicketAssistPanel({
  draftTitle,
  draftDescription,
  onApplySummary,
}: {
  draftTitle: string;
  draftDescription: string;
  onApplySummary: (summary: AssistSummary) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AssistMessage[]>([]);
  const [input, setInput] = useState("");
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState("");
  const [applied, setApplied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const latestAssistant = [...messages]
    .reverse()
    .find((message) => message.role === "assistant");
  const summary = latestAssistant
    ? extractSummary(latestAssistant.content)
    : null;

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = input.trim();

    if (!trimmed || isStreaming) {
      return;
    }

    const nextMessages: AssistMessage[] = [
      ...messages,
      { role: "user", content: trimmed },
    ];

    setMessages(nextMessages);
    setInput("");
    setError("");
    setApplied(false);
    setIsStreaming(true);
    setStreamingText("");

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch("/api/crm/tickets/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          messages: nextMessages,
          draftTitle,
          draftDescription,
        }),
      });

      if (!response.ok || !response.body) {
        const errBody = (await response
          .json()
          .catch(() => ({}))) as { error?: string };
        throw new Error(
          errBody.error || `Assistant request failed (${response.status})`,
        );
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (controller.signal.aborted) {
          try {
            await reader.cancel();
          } catch {
            /* noop */
          }
          return;
        }
        accumulated += decoder.decode(value, { stream: true });
        setStreamingText(accumulated);
      }

      if (accumulated.trim().length > 0 && !controller.signal.aborted) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: accumulated },
        ]);
      }
    } catch (sendError) {
      if (!controller.signal.aborted) {
        setError(
          sendError instanceof Error
            ? sendError.message
            : "The assistant is unavailable right now.",
        );
      }
    } finally {
      setIsStreaming(false);
      setStreamingText("");
    }
  }

  return (
    <div className="rounded-3xl border border-penn-blue bg-rich-black/40">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <span className="text-sm font-medium text-text-primary">
          Not sure what to include? Describe it and I&apos;ll help.
        </span>
        <span className="text-xs uppercase tracking-[0.18em] text-blue-ncs">
          {isOpen ? "Hide" : "Open"}
        </span>
      </button>

      {isOpen ? (
        <div className="space-y-4 border-t border-penn-blue px-5 py-4">
          <div className="max-h-72 space-y-3 overflow-y-auto">
            {messages.length === 0 && !isStreaming ? (
              <p className="text-sm leading-6 text-text-secondary">
                Tell me what&apos;s going on in your own words — I&apos;ll ask a
                couple of quick questions if anything&apos;s missing, then give
                you a summary you can drop straight into the ticket.
              </p>
            ) : null}

            {messages.map((message, index) => {
              const displayText =
                message.role === "assistant"
                  ? stripSummaryBlock(message.content)
                  : message.content;

              if (!displayText) {
                return null;
              }

              return (
                <p
                  key={index}
                  className={
                    message.role === "user"
                      ? "ml-auto max-w-[85%] rounded-2xl bg-penn-blue/60 px-4 py-2 text-sm leading-6 text-white"
                      : "max-w-[85%] whitespace-pre-wrap rounded-2xl bg-oxford-blue px-4 py-2 text-sm leading-6 text-text-primary"
                  }
                >
                  {displayText}
                </p>
              );
            })}

            {isStreaming ? (
              <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl bg-oxford-blue px-4 py-2 text-sm leading-6 text-text-primary">
                {stripSummaryBlock(streamingText) || "…"}
              </p>
            ) : null}
          </div>

          {summary && !isStreaming ? (
            <div className="rounded-2xl border border-blue-ncs/40 bg-oxford-blue/60 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-blue-ncs">
                Suggested ticket summary
              </p>
              {summary.title ? (
                <p className="mt-2 text-sm font-semibold text-white">
                  {summary.title}
                </p>
              ) : null}
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-text-primary">
                {summary.description}
              </p>
              <button
                type="button"
                disabled={applied}
                onClick={() => {
                  onApplySummary(summary);
                  setApplied(true);
                }}
                className="mt-3 rounded-full bg-blue-ncs px-4 py-2 text-sm font-semibold text-white transition hover:bg-lapis-lazuli disabled:cursor-not-allowed disabled:opacity-60"
              >
                {applied ? "Added to ticket" : "Use this summary"}
              </button>
            </div>
          ) : null}

          {error ? (
            <p className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </p>
          ) : null}

          <form onSubmit={handleSend} className="flex gap-2">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Describe the problem or request..."
              className="w-full rounded-2xl border border-penn-blue bg-rich-black px-4 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={isStreaming || !input.trim()}
              className="shrink-0 rounded-full border border-penn-blue px-4 py-2 text-sm font-semibold text-text-primary transition hover:border-blue-ncs disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isStreaming ? "…" : "Send"}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
