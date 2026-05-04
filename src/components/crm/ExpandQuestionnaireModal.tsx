"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

interface QuestionOption {
  value: string;
  label: string;
  description?: string;
}

interface Question {
  id: string;
  prompt: string;
  options: QuestionOption[];
  allowMultiple?: boolean;
}

type Phase =
  | "loading-questions"
  | "answering"
  | "loading-compose"
  | "preview"
  | "error";

interface ExpandQuestionnaireModalProps {
  open: boolean;
  fieldKey: string;
  fieldLabel: string;
  currentValue: string;
  context: Record<string, Record<string, string>>;
  onClose: () => void;
  onAccept: (text: string) => void;
}

export default function ExpandQuestionnaireModal({
  open,
  fieldKey,
  fieldLabel,
  currentValue,
  context,
  onClose,
  onAccept,
}: ExpandQuestionnaireModalProps) {
  const [phase, setPhase] = useState<Phase>("loading-questions");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>(
    {},
  );
  const [composed, setComposed] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const loadQuestions = useCallback(async () => {
    setPhase("loading-questions");
    setErrorMessage("");
    try {
      const response = await fetch("/api/crm/onboarding/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fieldKey,
          fieldLabel,
          action: "questions",
          currentValue,
          context,
        }),
      });
      const payload = (await response.json()) as {
        questions?: Question[];
        error?: string;
      };
      if (!response.ok || !payload.questions) {
        throw new Error(payload.error || "Unable to generate questions.");
      }
      setQuestions(payload.questions);
      setSelections({});
      setCustomAnswers({});
      setPhase("answering");
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Unable to generate questions.",
      );
      setPhase("error");
    }
  }, [fieldKey, fieldLabel, currentValue, context]);

  const compose = useCallback(async () => {
    setPhase("loading-compose");
    setErrorMessage("");
    try {
      const answers = questions.map((q) => {
        const offeredOptions = q.options.map((o) => o.label);
        const selectedValues = selections[q.id] ?? [];
        const selectedLabels = selectedValues
          .map((v) => q.options.find((o) => o.value === v)?.label ?? "")
          .filter(Boolean);
        const customText = (customAnswers[q.id] ?? "").trim();
        return {
          questionId: q.id,
          prompt: q.prompt,
          allowMultiple: !!q.allowMultiple,
          offeredOptions,
          selectedValues,
          selectedLabels,
          customText: customText || undefined,
        };
      });
      const response = await fetch("/api/crm/onboarding/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fieldKey,
          fieldLabel,
          action: "compose",
          currentValue,
          answers,
        }),
      });
      const payload = (await response.json()) as {
        result?: string;
        error?: string;
      };
      if (!response.ok || !payload.result) {
        throw new Error(payload.error || "Unable to compose answer.");
      }
      setComposed(payload.result);
      setPhase("preview");
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Unable to compose answer.",
      );
      setPhase("error");
    }
  }, [fieldKey, fieldLabel, currentValue, questions, selections, customAnswers]);

  // Reset and load questions whenever the modal opens for a (potentially new) field.
  useEffect(() => {
    if (!open) return;
    setQuestions([]);
    setSelections({});
    setCustomAnswers({});
    setComposed("");
    setErrorMessage("");
    void loadQuestions();
    // We intentionally do not include loadQuestions in deps — its identity changes
    // every render due to context object reference, and we only want a fresh fetch
    // when the modal opens for a new field.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, fieldKey]);

  // Close on Esc.
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  const allAnswered =
    questions.length === 3 &&
    questions.every((q) => {
      const picked = (selections[q.id] ?? []).length > 0;
      const typed = (customAnswers[q.id] ?? "").trim().length > 0;
      return picked || typed;
    });

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            key="card"
            className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-penn-blue bg-oxford-blue/95 shadow-2xl"
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <div className="flex items-start justify-between gap-4 border-b border-penn-blue/60 px-6 py-5">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-blue-ncs">
                  Guided expand
                </p>
                <h2 className="mt-1 text-lg font-semibold text-white">
                  {fieldLabel}
                </h2>
                <p className="mt-1 text-xs text-text-secondary">
                  Pick the option that best fits your situation. We&apos;ll write
                  the answer from your choices.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="rounded-full border border-penn-blue/60 bg-rich-black/60 px-3 py-1 text-sm text-text-secondary transition hover:border-blue-ncs/60 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[65vh] overflow-y-auto px-6 py-5">
              {phase === "loading-questions" ? (
                <LoadingBlock label="Designing 3 quick questions..." />
              ) : null}

              {phase === "answering" ? (
                <div className="space-y-6">
                  {questions.map((q, qi) => {
                    const picked = selections[q.id] ?? [];
                    const customText = customAnswers[q.id] ?? "";
                    const isCustomActive = customText.trim().length > 0;
                    const multi = !!q.allowMultiple;
                    return (
                      <div key={q.id} className="space-y-2">
                        <div className="flex items-baseline justify-between gap-3">
                          <p className="text-sm font-semibold text-white">
                            {qi + 1}. {q.prompt}
                          </p>
                          {multi ? (
                            <span className="text-[10px] uppercase tracking-[0.18em] text-blue-ncs">
                              Pick all that apply
                            </span>
                          ) : null}
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {q.options.map((opt) => {
                            const selected = picked.includes(opt.value);
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                  setSelections((s) => {
                                    const cur = s[q.id] ?? [];
                                    if (!multi) {
                                      return {
                                        ...s,
                                        [q.id]: selected ? [] : [opt.value],
                                      };
                                    }
                                    return {
                                      ...s,
                                      [q.id]: selected
                                        ? cur.filter((v) => v !== opt.value)
                                        : [...cur, opt.value],
                                    };
                                  });
                                }}
                                className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition ${
                                  selected
                                    ? "border-blue-ncs bg-blue-ncs/10 text-white"
                                    : "border-penn-blue/60 bg-rich-black/60 text-text-secondary hover:border-blue-ncs/60 hover:bg-penn-blue/30 hover:text-white"
                                }`}
                              >
                                <span
                                  aria-hidden
                                  className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border text-[10px] ${
                                    multi ? "rounded" : "rounded-full"
                                  } ${
                                    selected
                                      ? "border-blue-ncs bg-blue-ncs text-white"
                                      : "border-slate-500"
                                  }`}
                                >
                                  {selected ? (multi ? "✓" : "●") : ""}
                                </span>
                                <span className="flex-1">
                                  <span className="block font-medium">
                                    {opt.label}
                                  </span>
                                  {opt.description ? (
                                    <span className="mt-1 block text-xs text-text-secondary">
                                      {opt.description}
                                    </span>
                                  ) : null}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                        <div
                          className={`rounded-2xl border transition ${
                            isCustomActive
                              ? "border-blue-ncs bg-blue-ncs/10"
                              : "border-penn-blue/60 bg-rich-black/60"
                          }`}
                        >
                          <label className="flex items-start gap-2 px-4 pt-3">
                            <span
                              className={`mt-0.5 text-xs uppercase tracking-[0.18em] ${
                                isCustomActive
                                  ? "text-blue-ncs"
                                  : "text-text-secondary"
                              }`}
                            >
                              {picked.length > 0
                                ? "Add more (optional)"
                                : "Or type your own"}
                            </span>
                          </label>
                          <input
                            type="text"
                            value={customText}
                            placeholder={
                              picked.length > 0
                                ? "Anything else to add..."
                                : "Write a different answer..."
                            }
                            onChange={(e) => {
                              const text = e.target.value;
                              setCustomAnswers((c) => ({
                                ...c,
                                [q.id]: text,
                              }));
                            }}
                            className="w-full rounded-b-2xl bg-transparent px-4 pb-3 text-sm text-white placeholder:text-text-secondary focus:outline-none"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}

              {phase === "loading-compose" ? (
                <LoadingBlock label="Writing your answer..." />
              ) : null}

              {phase === "preview" ? (
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-blue-ncs">
                    Draft answer
                  </p>
                  <div className="whitespace-pre-wrap rounded-2xl border border-penn-blue bg-rich-black px-4 py-3 text-sm leading-6 text-white">
                    {composed}
                  </div>
                  <p className="text-xs text-text-secondary">
                    Accept to fill the field. You can still edit it before
                    saving.
                  </p>
                </div>
              ) : null}

              {phase === "error" ? (
                <div className="space-y-3">
                  <p className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {errorMessage || "Something went wrong."}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-penn-blue/60 bg-rich-black/40 px-6 py-4">
              {phase === "preview" ? (
                <>
                  <button
                    type="button"
                    onClick={() => setPhase("answering")}
                    className="rounded-full border border-penn-blue px-4 py-2 text-sm font-medium text-text-primary transition hover:border-blue-ncs"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => void compose()}
                    className="rounded-full border border-penn-blue px-4 py-2 text-sm font-medium text-text-primary transition hover:border-blue-ncs"
                  >
                    Regenerate
                  </button>
                  <button
                    type="button"
                    onClick={() => onAccept(composed)}
                    className="rounded-full bg-blue-ncs px-5 py-2 text-sm font-semibold text-white transition hover:bg-lapis-lazuli"
                  >
                    Accept
                  </button>
                </>
              ) : phase === "error" ? (
                <>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full border border-penn-blue px-4 py-2 text-sm font-medium text-text-primary transition hover:border-blue-ncs"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void loadQuestions()}
                    className="rounded-full bg-blue-ncs px-5 py-2 text-sm font-semibold text-white transition hover:bg-lapis-lazuli"
                  >
                    Retry
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full border border-penn-blue px-4 py-2 text-sm font-medium text-text-primary transition hover:border-blue-ncs"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void compose()}
                    disabled={
                      phase !== "answering" || !allAnswered
                    }
                    className="rounded-full bg-blue-ncs px-5 py-2 text-sm font-semibold text-white transition hover:bg-lapis-lazuli disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Generate
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function LoadingBlock({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-penn-blue/60 bg-rich-black/40 px-4 py-6 text-sm text-text-secondary">
      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-blue-ncs border-t-transparent" />
      <span>{label}</span>
    </div>
  );
}
