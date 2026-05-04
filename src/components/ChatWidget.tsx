"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

const CALENDLY_URL = "https://calendly.com/kylegreer-kygrsolutions/30min";
const STORAGE_KEY = "kygr_chat_state_v1";
const EMAIL_PROMPT_AFTER_TURNS = 3;

type ChatRole = "user" | "assistant";

interface ChatMessage {
  role: ChatRole;
  content: string;
}

interface PersistedState {
  conversationId: string | null;
  visitorName: string | null;
  visitorEmail: string | null;
  messages: ChatMessage[];
}

function loadPersistedState(): PersistedState {
  if (typeof window === "undefined") {
    return {
      conversationId: null,
      visitorName: null,
      visitorEmail: null,
      messages: [],
    };
  }
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        conversationId: null,
        visitorName: null,
        visitorEmail: null,
        messages: [],
      };
    }
    const parsed = JSON.parse(raw) as PersistedState;
    return {
      conversationId: parsed.conversationId ?? null,
      visitorName: parsed.visitorName ?? null,
      visitorEmail: parsed.visitorEmail ?? null,
      messages: Array.isArray(parsed.messages) ? parsed.messages : [],
    };
  } catch {
    return {
      conversationId: null,
      visitorName: null,
      visitorEmail: null,
      messages: [],
    };
  }
}

function persistState(state: PersistedState) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // sessionStorage may be disabled — fail silently
  }
}

function clearPersistedState() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
}

function newConversationId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // Fallback: minimal RFC-4122 v4 generator for older environments
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Initial form state (when no name set yet)
  const [initialName, setInitialName] = useState("");
  const [initialMessage, setInitialMessage] = useState("");

  // Email capture state
  const [showEmailPrompt, setShowEmailPrompt] = useState(false);
  const [emailDraft, setEmailDraft] = useState("");
  const [emailDismissed, setEmailDismissed] = useState(false);

  // Confirmation state — shown when the visitor clicks the X or the reset
  // button while they have an active conversation. Closing ends the
  // conversation (clears state, sends the digest), so we make sure they
  // know that before it happens.
  const [confirmingEnd, setConfirmingEnd] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const conversationIdRef = useRef<string | null>(null);

  // Hydrate from sessionStorage so refresh keeps the conversation alive.
  useEffect(() => {
    const persisted = loadPersistedState();
    if (persisted.conversationId) {
      setConversationId(persisted.conversationId);
      conversationIdRef.current = persisted.conversationId;
    }
    if (persisted.visitorName) setName(persisted.visitorName);
    if (persisted.visitorEmail) setEmail(persisted.visitorEmail);
    if (persisted.messages.length > 0) setMessages(persisted.messages);
  }, []);

  // Persist on any state change.
  useEffect(() => {
    persistState({
      conversationId,
      visitorName: name,
      visitorEmail: email,
      messages,
    });
  }, [conversationId, name, email, messages]);

  // Keep ref in sync for the unmount-time end call.
  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  // Email prompt becomes visible after enough turns, unless visitor dismissed
  // it or already provided an email.
  useEffect(() => {
    if (email || emailDismissed) {
      setShowEmailPrompt(false);
      return;
    }
    const userTurnCount = messages.filter((m) => m.role === "user").length;
    if (userTurnCount >= EMAIL_PROMPT_AFTER_TURNS) {
      setShowEmailPrompt(true);
    }
  }, [messages, email, emailDismissed]);

  // Auto-scroll to bottom on new messages or while streaming.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText, isOpen]);

  const finalizeOnClose = useCallback(async () => {
    const id = conversationIdRef.current;
    if (!id) return;
    if (messages.length === 0) return;
    try {
      // navigator.sendBeacon would be ideal but it can't carry JSON cleanly
      // and the body needs to be small. fetch with keepalive is the modern
      // pattern that survives page unload.
      await fetch("/api/chat/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify({
          conversationId: id,
          status: "completed",
          visitorName: name,
          visitorEmail: email,
        }),
      });
    } catch {
      // Best-effort — don't block the user.
    }
  }, [email, messages.length, name]);

  // Fire the end-of-conversation digest when the visitor leaves the page.
  useEffect(() => {
    const handler = () => {
      const id = conversationIdRef.current;
      if (!id) return;
      try {
        fetch("/api/chat/end", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          keepalive: true,
          body: JSON.stringify({
            conversationId: id,
            status: "completed",
          }),
        });
      } catch {
        /* noop */
      }
    };
    window.addEventListener("pagehide", handler);
    return () => window.removeEventListener("pagehide", handler);
  }, []);

  const sendMessage = useCallback(
    async (
      nextMessages: ChatMessage[],
      ctx: {
        conversationId: string;
        visitorName: string | null;
        visitorEmail: string | null;
      },
    ) => {
      setStreaming(true);
      setStreamingText("");
      setError(null);
      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId: ctx.conversationId,
            visitorName: ctx.visitorName,
            visitorEmail: ctx.visitorEmail,
            messages: nextMessages,
          }),
        });

        if (!response.ok || !response.body) {
          const errBody = await response.json().catch(() => ({}));
          throw new Error(
            errBody.error || `Chat request failed (${response.status})`,
          );
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          accumulated += chunk;
          setStreamingText(accumulated);
        }

        if (accumulated.trim().length > 0) {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: accumulated },
          ]);
        }
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Something went wrong. Please try again.";
        setError(message);
      } finally {
        setStreaming(false);
        setStreamingText("");
      }
    },
    [],
  );

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = initialName.trim();
    const trimmedMessage = initialMessage.trim();
    if (!trimmedName || !trimmedMessage) return;

    const id = conversationId ?? newConversationId();
    if (!conversationId) {
      setConversationId(id);
      conversationIdRef.current = id;
    }
    setName(trimmedName);

    const next: ChatMessage[] = [
      ...messages,
      { role: "user", content: trimmedMessage },
    ];
    setMessages(next);
    setInitialName("");
    setInitialMessage("");

    await sendMessage(next, {
      conversationId: id,
      visitorName: trimmedName,
      visitorEmail: email,
    });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || streaming || !conversationId) return;

    const next: ChatMessage[] = [
      ...messages,
      { role: "user", content: trimmed },
    ];
    setMessages(next);
    setDraft("");
    await sendMessage(next, {
      conversationId,
      visitorName: name,
      visitorEmail: email,
    });
  };

  const handleSaveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = emailDraft.trim();
    if (!isValidEmail(trimmed)) return;
    setEmail(trimmed);
    setShowEmailPrompt(false);
    setEmailDraft("");
  };

  // End the conversation. The digest call is fired-and-forgotten with
  // keepalive: true so the request completes in the background even after
  // local state is cleared and the panel closes. The visitor sees an
  // instant close — no waiting for the AI scoring + email round-trip.
  const performEnd = useCallback(
    (closePanel: boolean) => {
      // Kick off the digest; do NOT await it.
      void finalizeOnClose();
      clearPersistedState();
      setConversationId(null);
      conversationIdRef.current = null;
      setName(null);
      setEmail(null);
      setMessages([]);
      setDraft("");
      setStreamingText("");
      setError(null);
      setEmailDismissed(false);
      setShowEmailPrompt(false);
      setConfirmingEnd(false);
      if (closePanel) setIsOpen(false);
    },
    [finalizeOnClose],
  );

  const handleResetConversation = () => {
    if (messages.length === 0) {
      performEnd(false);
      return;
    }
    setConfirmingEnd(true);
  };

  const handleClose = () => {
    // No active conversation? Just hide the panel — nothing to confirm,
    // nothing to email.
    if (messages.length === 0) {
      setIsOpen(false);
      return;
    }
    setConfirmingEnd(true);
  };

  const handleCancelEnd = () => setConfirmingEnd(false);
  const handleConfirmEnd = () => performEnd(true);

  const showInitialForm = !name || messages.length === 0;

  return (
    <>
      {/* Floating trigger bubble */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            key="chat-trigger"
            onClick={() => setIsOpen(true)}
            className="fixed bottom-20 right-4 sm:bottom-24 sm:right-6 md:bottom-28 md:right-8 z-40 bg-blue-ncs hover:bg-lapis-lazuli text-white rounded-full shadow-lg hover:shadow-xl flex items-center gap-2 px-4 py-3 min-h-[48px]"
            initial={{ opacity: 0, scale: 0, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0, y: 20 }}
            whileHover={{
              scale: 1.05,
              transition: { type: "spring", stiffness: 400, damping: 17 },
            }}
            whileTap={{ scale: 0.95 }}
            aria-label="Open chat with Kyle's AI assistant"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <span className="text-sm font-semibold">Chat with my AI</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="chat-panel"
            className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 md:bottom-8 md:right-8 z-50 w-[calc(100vw-2rem)] sm:w-[400px] h-[600px] max-h-[calc(100vh-2rem)] bg-(--color-oxford-blue) border border-(--color-penn-blue) rounded-xl shadow-2xl flex flex-col overflow-hidden"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-(--color-penn-blue) bg-(--color-rich-black)">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <div>
                  <h3 className="text-sm font-semibold text-(--color-text-headings)">
                    Kyle&apos;s diagnostic assistant
                  </h3>
                  <p className="text-xs text-(--color-text-secondary)">
                    Powered by AI · Real conversations
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button
                    onClick={handleResetConversation}
                    className="text-(--color-text-secondary) hover:text-(--color-text-primary) p-1 transition-colors"
                    aria-label="Start a new conversation"
                    title="Start over"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h5M20 20v-5h-5M4 9a9 9 0 0114.65-3.9M20 15a9 9 0 01-14.65 3.9"
                      />
                    </svg>
                  </button>
                )}
                <button
                  onClick={handleClose}
                  className="text-(--color-text-secondary) hover:text-(--color-text-primary) p-1 transition-colors"
                  aria-label="Close chat"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Calendly CTA — always visible at top */}
            <div className="px-4 py-2 bg-(--color-penn-blue)/40 border-b border-(--color-penn-blue) flex items-center justify-between gap-2">
              <span className="text-xs text-(--color-text-secondary)">
                Ready to talk to Kyle directly?
              </span>
              <a
                href={CALENDLY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold bg-blue-ncs hover:bg-lapis-lazuli text-white px-3 py-1.5 rounded-md transition-colors whitespace-nowrap"
              >
                Book 30-min call
              </a>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {showInitialForm && messages.length === 0 ? (
                <form onSubmit={handleStart} className="space-y-3 pt-2">
                  <div>
                    <p className="text-sm text-(--color-text-primary) mb-2">
                      Hey there. I&apos;m Kyle&apos;s diagnostic assistant — I&apos;ll ask
                      a few questions about your business and help frame what you
                      might need. To get started:
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-(--color-text-secondary) mb-1">
                      First name
                    </label>
                    <input
                      type="text"
                      value={initialName}
                      onChange={(e) => setInitialName(e.target.value)}
                      placeholder="What should I call you?"
                      maxLength={100}
                      required
                      className="w-full bg-(--color-rich-black) border border-(--color-penn-blue) text-(--color-text-primary) text-sm rounded-md px-3 py-2 focus:outline-none focus:border-blue-ncs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-(--color-text-secondary) mb-1">
                      What brought you here?
                    </label>
                    <textarea
                      value={initialMessage}
                      onChange={(e) => setInitialMessage(e.target.value)}
                      placeholder="A short note about what you're trying to figure out — even a rough idea is fine."
                      maxLength={2000}
                      required
                      rows={4}
                      className="w-full bg-(--color-rich-black) border border-(--color-penn-blue) text-(--color-text-primary) text-sm rounded-md px-3 py-2 focus:outline-none focus:border-blue-ncs resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={
                      !initialName.trim() ||
                      !initialMessage.trim() ||
                      streaming
                    }
                    className="w-full bg-blue-ncs hover:bg-lapis-lazuli disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold py-2 rounded-md transition-colors"
                  >
                    {streaming ? "Starting…" : "Start the conversation"}
                  </button>
                </form>
              ) : (
                <>
                  {messages.map((m, idx) => (
                    <ChatBubble key={idx} role={m.role} content={m.content} />
                  ))}
                  {streaming && streamingText && (
                    <ChatBubble role="assistant" content={streamingText} />
                  )}
                  {streaming && !streamingText && (
                    <div className="flex justify-start">
                      <div
                        className="bg-(--color-rich-black) border border-(--color-penn-blue) rounded-2xl rounded-bl-sm px-3 py-3 flex items-center gap-1"
                        aria-label="Assistant is typing"
                      >
                        <div className="w-2 h-2 rounded-full bg-(--color-text-secondary) animate-bounce [animation-delay:-0.3s]" />
                        <div className="w-2 h-2 rounded-full bg-(--color-text-secondary) animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-2 h-2 rounded-full bg-(--color-text-secondary) animate-bounce" />
                      </div>
                    </div>
                  )}
                  {error && (
                    <div className="text-xs text-red-300 bg-red-900/30 border border-red-900/40 px-3 py-2 rounded-md">
                      {error}
                    </div>
                  )}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Email prompt (mid-conversation, dismissible) */}
            {showEmailPrompt && !showInitialForm && (
              <div className="px-4 py-3 border-t border-(--color-penn-blue) bg-(--color-rich-black)">
                <p className="text-xs text-(--color-text-secondary) mb-2">
                  Want me to send Kyle a summary of this so he can follow up?
                  Drop your email — totally optional.
                </p>
                <form onSubmit={handleSaveEmail} className="flex gap-2">
                  <input
                    type="email"
                    value={emailDraft}
                    onChange={(e) => setEmailDraft(e.target.value)}
                    placeholder="you@example.com"
                    maxLength={255}
                    className="flex-1 bg-(--color-oxford-blue) border border-(--color-penn-blue) text-(--color-text-primary) text-xs rounded-md px-2 py-1.5 focus:outline-none focus:border-blue-ncs"
                  />
                  <button
                    type="submit"
                    disabled={!isValidEmail(emailDraft)}
                    className="text-xs font-semibold bg-blue-ncs hover:bg-lapis-lazuli disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-md transition-colors"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmailDismissed(true);
                      setShowEmailPrompt(false);
                    }}
                    className="text-xs text-(--color-text-secondary) hover:text-(--color-text-primary) px-2 py-1.5 transition-colors"
                  >
                    No thanks
                  </button>
                </form>
              </div>
            )}

            {/* End-of-conversation confirmation overlay */}
            <AnimatePresence>
              {confirmingEnd && (
                <motion.div
                  key="end-confirm"
                  className="absolute inset-0 z-10 bg-(--color-rich-black)/85 backdrop-blur-sm flex items-center justify-center px-5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <motion.div
                    className="w-full bg-(--color-oxford-blue) border border-(--color-penn-blue) rounded-lg shadow-xl p-5"
                    initial={{ scale: 0.95, y: 10 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: 10 }}
                    transition={{
                      type: "spring",
                      stiffness: 320,
                      damping: 28,
                    }}
                  >
                    <h4 className="text-sm font-semibold text-(--color-text-headings) mb-2">
                      End this conversation?
                    </h4>
                    <p className="text-xs text-(--color-text-secondary) mb-4 leading-relaxed">
                      If you leave now, this chat ends and Kyle will get a
                      summary by email. You won&apos;t be able to pick this
                      conversation back up — you&apos;ll start fresh next time
                      you open the chat.
                    </p>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={handleConfirmEnd}
                        className="bg-blue-ncs hover:bg-lapis-lazuli text-white text-sm font-semibold py-2 rounded-md transition-colors"
                      >
                        End conversation
                      </button>
                      <button
                        onClick={handleCancelEnd}
                        className="text-(--color-text-secondary) hover:text-(--color-text-primary) text-sm py-2 transition-colors"
                      >
                        Keep chatting
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Composer (only after initial form) */}
            {!showInitialForm && (
              <form
                onSubmit={handleSend}
                className="px-3 py-3 border-t border-(--color-penn-blue) bg-(--color-rich-black) flex gap-2"
              >
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={
                    streaming ? "Kyle's AI is replying…" : "Type a message…"
                  }
                  disabled={streaming}
                  maxLength={4000}
                  className="flex-1 bg-(--color-oxford-blue) border border-(--color-penn-blue) text-(--color-text-primary) text-sm rounded-md px-3 py-2 focus:outline-none focus:border-blue-ncs disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={!draft.trim() || streaming}
                  className="bg-blue-ncs hover:bg-lapis-lazuli disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md transition-colors text-sm font-semibold"
                  aria-label="Send message"
                >
                  Send
                </button>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function ChatBubble({
  role,
  content,
}: {
  role: ChatRole;
  content: string;
}) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={
          isUser
            ? "max-w-[85%] bg-blue-ncs text-white text-sm rounded-2xl rounded-br-sm px-3 py-2 whitespace-pre-wrap"
            : "max-w-[85%] bg-(--color-rich-black) border border-(--color-penn-blue) text-(--color-text-primary) text-sm rounded-2xl rounded-bl-sm px-3 py-2 whitespace-pre-wrap"
        }
      >
        {content}
      </div>
    </div>
  );
}
