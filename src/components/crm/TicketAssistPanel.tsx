"use client";

import { KeyboardEvent, useEffect, useId, useRef, useState } from "react";

interface AssistMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AssistSummary {
  title: string | null;
  description: string;
}

const SUMMARY_REGEX = /\[TICKET SUMMARY\]([\s\S]*?)\[\/TICKET SUMMARY\]/;
const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled]):not([tabindex='-1'])",
  "input:not([disabled]):not([tabindex='-1'])",
  "select:not([disabled]):not([tabindex='-1'])",
  "textarea:not([disabled]):not([tabindex='-1'])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function extractSummary(content: string): AssistSummary | null {
  const match = content.match(SUMMARY_REGEX);

  if (!match) return null;

  const block = match[1].trim();
  const titleMatch = block.match(/^Title:\s*(.+)$/m);
  const description = block
    .split("\n")
    .filter((line) => !/^Title:\s*/.test(line))
    .join("\n")
    .trim();

  if (!description) return null;

  return {
    title: titleMatch?.[1]?.trim() || null,
    description,
  };
}

function stripSummaryBlock(content: string): string {
  const stripped = content.replace(SUMMARY_REGEX, "");
  if (stripped !== content) return stripped.trim();

  // Mid-stream the closing tag may not have arrived yet. Truncate at the
  // opening tag so raw summary markup never flashes in the chat bubble.
  const openIndex = content.indexOf("[TICKET SUMMARY");
  return (openIndex === -1 ? content : content.slice(0, openIndex)).trim();
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
  const launcherRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const drawerTitleId = useId();

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const launcher = launcherRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusFrame = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });

    function handleDialogKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsOpen(false);
        return;
      }

      if (event.key !== "Tab") return;

      const drawer = drawerRef.current;
      if (!drawer) return;

      const focusableElements = Array.from(
        drawer.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter(
        (element) =>
          element.offsetWidth > 0 || element.offsetHeight > 0,
      );

      if (focusableElements.length === 0) {
        event.preventDefault();
        drawer.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey) {
        if (activeElement === firstElement || !drawer.contains(activeElement)) {
          event.preventDefault();
          lastElement.focus();
        }
      } else if (
        activeElement === lastElement ||
        !drawer.contains(activeElement)
      ) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    window.addEventListener("keydown", handleDialogKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleDialogKeyDown);
      if (launcher?.isConnected) {
        launcher.focus();
      }
    };
  }, [isOpen]);

  const latestAssistant = [...messages]
    .reverse()
    .find((message) => message.role === "assistant");
  const summary = latestAssistant
    ? extractSummary(latestAssistant.content)
    : null;

  async function handleSend() {
    const trimmed = input.trim();

    if (!trimmed || isStreaming) return;

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
        setMessages((previous) => [
          ...previous,
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
    <>
      <button
        ref={launcherRef}
        type="button"
        onClick={() => setIsOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className="ml-auto flex w-full items-center justify-between gap-4 rounded-2xl border border-blue-ncs/30 bg-blue-ncs/10 px-4 py-3 text-left transition hover:border-blue-ncs/60 hover:bg-blue-ncs/15 sm:w-auto"
      >
        <span className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-blue-ncs/15 text-blue-ncs"
          >
            ✦
          </span>
          <span>
            <span className="block text-sm font-semibold text-white">
              Help me write this
            </span>
            <span className="mt-0.5 block text-xs text-text-secondary">
              Describe it naturally with AI
            </span>
          </span>
        </span>
        <span className="text-xs uppercase tracking-[0.18em] text-blue-ncs">
          Open
        </span>
      </button>

      <button
        type="button"
        aria-label="Close ticket assistant"
        tabIndex={-1}
        onClick={() => setIsOpen(false)}
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px] transition-opacity duration-300 ${
          isOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        ref={drawerRef}
        role="dialog"
        tabIndex={-1}
        aria-modal="true"
        aria-labelledby={drawerTitleId}
        aria-hidden={!isOpen}
        inert={!isOpen}
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-penn-blue bg-rich-black shadow-[-24px_0_80px_rgba(0,0,0,0.45)] transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between gap-4 border-b border-penn-blue px-5 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="grid h-9 w-9 place-items-center rounded-xl bg-blue-ncs/15 text-blue-ncs"
            >
              ✦
            </span>
            <div>
              <h3 id={drawerTitleId} className="font-semibold text-white">
                Ticket assistant
              </h3>
              <p className="mt-0.5 text-xs text-text-secondary">
                Describe the problem or request naturally
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Close ticket assistant"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-text-secondary transition hover:bg-penn-blue/50 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
            {messages.length === 0 && !isStreaming ? (
              <div className="rounded-2xl bg-oxford-blue px-4 py-3">
                <p className="text-sm leading-6 text-text-secondary">
                  Tell me what&apos;s going on in your own words — I&apos;ll ask a
                  couple of quick questions if anything&apos;s missing, then prepare
                  a description you can add to the ticket.
                </p>
              </div>
            ) : null}

            {messages.map((message, index) => {
              const displayText =
                message.role === "assistant"
                  ? stripSummaryBlock(message.content)
                  : message.content;

              if (!displayText) return null;

              return (
                <p
                  key={index}
                  className={
                    message.role === "user"
                      ? "ml-auto max-w-[88%] rounded-2xl rounded-tr-md bg-blue-ncs/20 px-4 py-3 text-sm leading-6 text-white"
                      : "max-w-[88%] whitespace-pre-wrap rounded-2xl rounded-tl-md bg-oxford-blue px-4 py-3 text-sm leading-6 text-text-primary"
                  }
                >
                  {displayText}
                </p>
              );
            })}

            {isStreaming ? (
              <p className="max-w-[88%] whitespace-pre-wrap rounded-2xl rounded-tl-md bg-oxford-blue px-4 py-3 text-sm leading-6 text-text-primary">
                {stripSummaryBlock(streamingText) || "…"}
              </p>
            ) : null}

            {/* This action intentionally appears only after the assistant has
                returned a complete, parseable ticket summary. */}
            {summary && !isStreaming ? (
              <div className="rounded-2xl border border-blue-ncs/40 bg-oxford-blue/60 p-4 sm:p-5">
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
                  className="mt-4 w-full rounded-xl bg-blue-ncs px-4 py-3 text-sm font-semibold text-white transition hover:bg-lapis-lazuli disabled:cursor-not-allowed disabled:opacity-60"
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
          </div>

          <div className="border-t border-penn-blue bg-oxford-blue/35 p-4 sm:p-5">
            {/* Not a form because this drawer is rendered inside the ticket
                form. Enter is handled here so it cannot submit the ticket. */}
            <div className="flex gap-2">
              <input
                ref={inputRef}
                aria-label="Describe the problem or request"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void handleSend();
                  }
                }}
                placeholder="Describe the problem or request…"
                className="w-full min-w-0 rounded-xl border border-penn-blue bg-rich-black px-4 py-3 text-sm"
              />
              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={isStreaming || !input.trim()}
                className="shrink-0 rounded-xl bg-blue-ncs px-4 py-3 text-sm font-semibold text-white transition hover:bg-lapis-lazuli disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isStreaming ? "…" : "Send"}
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
