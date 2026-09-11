"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getStepStatus,
  isFieldVisible,
  stepStatusLabels,
  summarizeResponses,
  type MissingField,
} from "@/lib/onboardingFlow";
import type {
  OnboardingAnswers,
  OnboardingStatus,
  OnboardingStepDefinition,
  OnboardingStepField,
} from "@/types/crm";
import ChoiceField from "./ChoiceField";
import ExpandQuestionnaireModal from "./ExpandQuestionnaireModal";
import HelpTooltip from "./HelpTooltip";
import OnboardingReviewSummary from "./OnboardingReviewSummary";
import PersonListField from "./PersonListField";

interface OnboardingChecklistProps {
  organizationId: string;
  status: OnboardingStatus;
  initialStep: string;
  /** Saved answers merged with known prefill values. */
  initialResponses: OnboardingAnswers;
  steps: OnboardingStepDefinition[];
  /** Admin preview: renders the exact client flow with saving disabled. */
  previewMode?: boolean;
}

const stepStatusTone: Record<string, string> = {
  not_started: "bg-slate-500/15 text-slate-300",
  in_progress: "bg-amber-500/15 text-amber-200",
  complete: "bg-emerald-500/15 text-emerald-200",
};

function snapshot(answers: OnboardingAnswers): Record<string, string> {
  return Object.fromEntries(
    Object.entries(answers).map(([key, value]) => [key, JSON.stringify(value ?? {})]),
  );
}

export default function OnboardingChecklist({
  organizationId,
  status,
  initialStep,
  initialResponses,
  steps,
  previewMode = false,
}: OnboardingChecklistProps) {
  const router = useRouter();
  const firstStepKey = steps[0]?.key ?? "";
  const lastStepKey = steps[steps.length - 1]?.key ?? "";

  const [currentStep, setCurrentStep] = useState(
    steps.some((step) => step.key === initialStep) ? initialStep : firstStepKey,
  );
  const [responses, setResponses] = useState<OnboardingAnswers>(initialResponses);
  const [savedSnapshot, setSavedSnapshot] = useState(() => snapshot(initialResponses));
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [missing, setMissing] = useState<MissingField[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refiningField, setRefiningField] = useState<string | null>(null);
  const [openRefineMenu, setOpenRefineMenu] = useState<string | null>(null);
  const [expandModalField, setExpandModalField] = useState<{
    key: string;
    label: string;
  } | null>(null);
  const refineMenuRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const activeStep = useMemo(
    () => steps.find((step) => step.key === currentStep) || steps[0],
    [steps, currentStep],
  );

  const isLocked =
    !previewMode &&
    (status === "submitted" || status === "completed" || status === "skipped_legacy");

  const currentSnapshot = useMemo(() => snapshot(responses), [responses]);
  const dirtySteps = useMemo(
    () =>
      new Set(
        steps
          .map((step) => step.key)
          .filter((key) => (currentSnapshot[key] ?? "{}") !== (savedSnapshot[key] ?? "{}")),
      ),
    [steps, currentSnapshot, savedSnapshot],
  );
  const hasUnsavedChanges = dirtySteps.size > 0;

  useEffect(() => {
    if (previewMode || !hasUnsavedChanges) return;
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [previewMode, hasUnsavedChanges]);

  useEffect(() => {
    if (!openRefineMenu) return;
    function handleClick(event: MouseEvent) {
      if (refineMenuRef.current && !refineMenuRef.current.contains(event.target as Node)) {
        setOpenRefineMenu(null);
      }
    }
    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, [openRefineMenu]);

  // The review step renders its own field right below the summary, so keep
  // its blank optional note out of the "Not answered" list.
  const summary = useMemo(() => {
    const full = summarizeResponses(steps, responses);
    return {
      ...full,
      unanswered: full.unanswered.filter((entry) => entry.stepKey !== lastStepKey),
    };
  }, [steps, responses, lastStepKey]);

  function goToStep(stepKey: string) {
    setCurrentStep(stepKey);
    setMessage("");
    setError("");
    // Move focus to the step heading so keyboard users land in the new section.
    requestAnimationFrame(() => headingRef.current?.focus());
  }

  function updateField(stepKey: string, fieldKey: string, value: string) {
    setResponses((current) => ({
      ...current,
      [stepKey]: {
        ...(current[stepKey] || {}),
        [fieldKey]: value,
      },
    }));
  }

  function toggleCheckbox(stepKey: string, fieldKey: string, option: string) {
    const current = responses[stepKey]?.[fieldKey] || "";
    const selected = current ? current.split(",") : [];
    const next = selected.includes(option)
      ? selected.filter((v) => v !== option)
      : [...selected, option];
    updateField(stepKey, fieldKey, next.join(","));
  }

  async function refineField(fieldKey: string, fieldLabel: string, action: "polish" | "expand") {
    const currentValue = responses[activeStep.key]?.[fieldKey] || "";
    if (!currentValue.trim()) return;

    setRefiningField(fieldKey);
    setOpenRefineMenu(null);

    try {
      const response = await fetch("/api/crm/onboarding/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fieldKey, fieldLabel, action, currentValue, context: responses }),
      });
      const payload = (await response.json()) as { result?: string; error?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to refine field.");
      if (payload.result) updateField(activeStep.key, fieldKey, payload.result);
    } catch (refineError) {
      setError(refineError instanceof Error ? refineError.message : "Unable to refine field.");
    } finally {
      setRefiningField(null);
    }
  }

  /**
   * Saves EVERY step's answers, not just the active one, so edits made on a
   * step the client navigated away from are never dropped.
   */
  async function saveAll(nextStep?: string): Promise<boolean> {
    setIsSaving(true);
    setMessage("");
    setError("");
    setMissing([]);

    if (previewMode) {
      setSavedSnapshot(snapshot(responses));
      if (nextStep) goToStep(nextStep);
      setMessage("Preview only — nothing is saved.");
      setIsSaving(false);
      return true;
    }

    try {
      const response = await fetch("/api/crm/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          responses,
          currentStep: nextStep || activeStep.key,
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to save your progress.");

      setSavedSnapshot(snapshot(responses));
      if (nextStep) goToStep(nextStep);
      setMessage("Progress saved.");
      router.refresh();
      return true;
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save your progress.");
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  async function submitOnboarding() {
    setIsSubmitting(true);
    setError("");
    setMessage("");
    setMissing([]);

    if (previewMode) {
      setMessage("Preview only — clients see a confirmation here after submitting.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/crm/onboarding/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId, responses }),
      });
      const payload = (await response.json()) as {
        error?: string;
        missing?: MissingField[];
      };

      if (!response.ok) {
        if (payload.missing && payload.missing.length > 0) {
          setMissing(payload.missing);
          setError(payload.error || "A few required answers are still missing.");
          return;
        }
        throw new Error(payload.error || "Unable to submit onboarding.");
      }

      setSavedSnapshot(snapshot(responses));
      setMessage("Thanks — your onboarding has been submitted.");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to submit onboarding.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const activeIndex = steps.findIndex((step) => step.key === activeStep.key);
  const nextStepKey = steps[activeIndex + 1]?.key;
  const previousStepKey = steps[activeIndex - 1]?.key;
  const isReviewStep = activeStep.key === lastStepKey;
  const activeAnswers = responses[activeStep.key] || {};

  function renderLabel(field: OnboardingStepField, htmlFor?: string) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor={htmlFor} className="text-sm font-medium text-text-primary">
          {field.label}
        </label>
        {field.type !== "static" ? (
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] ${
              field.required
                ? "border-amber-500/40 text-amber-200"
                : "border-penn-blue text-text-secondary"
            }`}
          >
            {field.required ? "Required" : "Optional"}
          </span>
        ) : null}
        {field.helpText ? (
          <HelpTooltip text={field.helpText} label={`${field.label} help`} />
        ) : null}
      </div>
    );
  }

  function renderField(field: OnboardingStepField) {
    const value = activeAnswers[field.key] || "";
    const inputId = `${activeStep.key}-${field.key}`;
    const isMissing = missing.some(
      (entry) => entry.stepKey === activeStep.key && entry.fieldKey === field.key,
    );
    const missingRing = isMissing ? "ring-2 ring-amber-500/60" : "";

    if (field.type === "static") {
      return (
        <div
          key={field.key}
          className="rounded-3xl border border-blue-ncs/30 bg-blue-ncs/5 p-4"
          data-field={field.key}
        >
          <p className="text-xs uppercase tracking-[0.18em] text-blue-ncs">{field.label}</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-white">{field.content}</p>
        </div>
      );
    }

    if (field.type === "choice" && field.choices) {
      return (
        <div key={field.key} className={`space-y-3 rounded-2xl ${missingRing}`} data-field={field.key}>
          {renderLabel(field)}
          <ChoiceField
            name={field.key}
            label={field.label}
            value={value}
            choices={field.choices}
            disabled={isLocked}
            onChange={(next) => updateField(activeStep.key, field.key, next)}
          />
        </div>
      );
    }

    if (field.type === "radio" && field.options) {
      const lastOption = field.options[field.options.length - 1];
      const standardOptions = field.allowCustom ? field.options.slice(0, -1) : field.options;
      const isCustomActive =
        Boolean(field.allowCustom) && value !== "" && !standardOptions.includes(value);
      const selectedOption = isCustomActive ? lastOption : value;
      const customInputValue = value === lastOption ? "" : value;

      return (
        <div key={field.key} className={`space-y-3 rounded-2xl ${missingRing}`} data-field={field.key}>
          {renderLabel(field)}
          <ChoiceField
            name={field.key}
            label={field.label}
            value={selectedOption}
            choices={field.options.map((option) => ({ value: option, label: option }))}
            disabled={isLocked}
            onChange={(next) => updateField(activeStep.key, field.key, next)}
          />
          {isCustomActive ? (
            <input
              type="text"
              value={customInputValue}
              onChange={(event) => updateField(activeStep.key, field.key, event.target.value)}
              disabled={isLocked}
              autoFocus
              aria-label={`${field.label} (custom)`}
              className="w-full rounded-2xl border border-penn-blue bg-rich-black px-4 py-3 text-sm text-white placeholder:text-text-secondary"
              placeholder="Tell us what works for you"
            />
          ) : null}
        </div>
      );
    }

    if (field.type === "checkboxes" && field.options) {
      const selected = value ? value.split(",") : [];
      return (
        <div key={field.key} className="space-y-3" data-field={field.key}>
          {renderLabel(field)}
          <div className="flex flex-wrap gap-2" role="group" aria-label={field.label}>
            {field.options.map((option) => {
              const isChecked = selected.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  role="checkbox"
                  aria-checked={isChecked}
                  disabled={isLocked}
                  onClick={() => toggleCheckbox(activeStep.key, field.key, option)}
                  className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition focus-visible:ring-2 focus-visible:ring-blue-ncs disabled:cursor-not-allowed disabled:opacity-60 ${
                    isChecked
                      ? "border-blue-ncs bg-blue-ncs/20 text-white"
                      : "border-penn-blue bg-rich-black/40 text-text-secondary hover:border-blue-ncs/60 hover:text-white"
                  }`}
                >
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded border text-[10px] ${
                      isChecked ? "border-blue-ncs bg-blue-ncs text-white" : "border-slate-500"
                    }`}
                    aria-hidden
                  >
                    {isChecked ? "✓" : ""}
                  </span>
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    if (field.type === "textarea") {
      const isRefiningThis = refiningField === field.key;
      const showRefine = Boolean(field.aiAssist) && !isLocked && !previewMode;
      return (
        <div key={field.key} className={`space-y-2 rounded-2xl ${missingRing}`} data-field={field.key}>
          <div className="flex items-center justify-between gap-3">
            {renderLabel(field, inputId)}
            {showRefine ? (
              <div className="relative" ref={openRefineMenu === field.key ? refineMenuRef : undefined}>
                <button
                  type="button"
                  onClick={() => setOpenRefineMenu(openRefineMenu === field.key ? null : field.key)}
                  disabled={isRefiningThis || !value.trim()}
                  title={
                    value.trim()
                      ? "Optional: polish or expand your draft with AI"
                      : "Type a rough draft first — then you can polish or expand it"
                  }
                  className="flex items-center gap-1.5 rounded-full border border-penn-blue/60 bg-rich-black/60 px-3 py-1.5 text-xs text-text-secondary transition hover:border-blue-ncs/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isRefiningThis ? (
                    <span className="inline-block h-3 w-3 animate-spin rounded-full border border-blue-ncs border-t-transparent" />
                  ) : (
                    <span aria-hidden>✦</span>
                  )}
                  {isRefiningThis ? "Refining..." : "Refine (optional)"}
                </button>
                {openRefineMenu === field.key ? (
                  <div className="absolute right-0 top-full z-10 mt-1 w-40 overflow-hidden rounded-2xl border border-penn-blue bg-oxford-blue shadow-lg">
                    <button
                      type="button"
                      onClick={() => void refineField(field.key, field.label, "polish")}
                      className="block w-full px-4 py-3 text-left text-sm text-text-primary transition hover:bg-blue-ncs/10 hover:text-white"
                    >
                      ✦ Polish
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setExpandModalField({ key: field.key, label: field.label });
                        setOpenRefineMenu(null);
                      }}
                      className="block w-full px-4 py-3 text-left text-sm text-text-primary transition hover:bg-blue-ncs/10 hover:text-white"
                    >
                      ↗ Expand
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
          <textarea
            id={inputId}
            value={value}
            onChange={(event) => updateField(activeStep.key, field.key, event.target.value)}
            disabled={isLocked || isRefiningThis}
            rows={4}
            aria-required={field.required || undefined}
            aria-invalid={isMissing || undefined}
            className="w-full rounded-2xl border border-penn-blue bg-rich-black px-4 py-3 text-sm text-white placeholder:text-text-secondary disabled:opacity-60"
            placeholder={field.placeholder}
          />
        </div>
      );
    }

    if (field.type === "person_list") {
      return (
        <div key={field.key} className="space-y-3" data-field={field.key}>
          {renderLabel(field)}
          <PersonListField
            value={value}
            onChange={(next) => updateField(activeStep.key, field.key, next)}
            disabled={isLocked}
          />
        </div>
      );
    }

    const inputType = field.type === "email" ? "email" : field.type === "url" ? "url" : "text";
    return (
      <div key={field.key} className={`space-y-2 rounded-2xl ${missingRing}`} data-field={field.key}>
        {renderLabel(field, inputId)}
        <input
          id={inputId}
          type={inputType}
          value={value}
          onChange={(event) => updateField(activeStep.key, field.key, event.target.value)}
          disabled={isLocked}
          aria-required={field.required || undefined}
          aria-invalid={isMissing || undefined}
          className="w-full rounded-2xl border border-penn-blue bg-rich-black px-4 py-3 text-sm text-white placeholder:text-text-secondary"
          placeholder={field.placeholder}
        />
      </div>
    );
  }

  const visibleFields = activeStep.fields.filter((field) => isFieldVisible(field, activeAnswers));

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
      <aside className="space-y-3 rounded-4xl border border-penn-blue bg-oxford-blue/80 p-5">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-blue-ncs">Onboarding progress</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Steps</h2>
        </div>

        <nav aria-label="Onboarding steps" className="space-y-3">
          {steps.map((step, index) => {
            const stepStatus = getStepStatus(step, responses);
            const isActive = step.key === activeStep.key;
            const isDirty = dirtySteps.has(step.key);

            return (
              <button
                key={step.key}
                type="button"
                onClick={() => goToStep(step.key)}
                aria-current={isActive ? "step" : undefined}
                className={`block w-full rounded-3xl border px-4 py-4 text-left transition focus-visible:ring-2 focus-visible:ring-blue-ncs ${
                  isActive ? "border-blue-ncs bg-blue-ncs/10" : "border-penn-blue bg-rich-black/40"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-white">
                    {index + 1}. {step.title}
                  </span>
                  <span className="flex flex-col items-end gap-1">
                    <span
                      className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.18em] ${stepStatusTone[stepStatus]}`}
                    >
                      {stepStatusLabels[stepStatus]}
                    </span>
                    {isDirty && !isLocked ? (
                      <span className="rounded-full bg-amber-500/15 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-amber-200">
                        Unsaved
                      </span>
                    ) : null}
                  </span>
                </div>
              </button>
            );
          })}
        </nav>

        {hasUnsavedChanges && !isLocked ? (
          <p className="text-xs leading-5 text-text-secondary">
            You have unsaved changes. Saving from any step keeps everything you&apos;ve typed.
          </p>
        ) : null}
      </aside>

      <section className="rounded-4xl border border-penn-blue bg-oxford-blue/80 p-6 md:p-8">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.2em] text-blue-ncs">
            Step {activeIndex + 1} of {steps.length}
          </p>
          <h3
            ref={headingRef}
            tabIndex={-1}
            className="text-3xl font-semibold text-white focus:outline-none"
          >
            {activeStep.title}
          </h3>
          <p className="max-w-3xl text-sm leading-7 text-text-secondary">{activeStep.description}</p>
        </div>

        {isReviewStep ? (
          <div className="mt-8 space-y-6">
            <OnboardingReviewSummary summary={summary} onEdit={isLocked ? undefined : goToStep} />
            <div className="space-y-6">{visibleFields.map(renderField)}</div>
            <div className="rounded-3xl border border-penn-blue bg-rich-black/40 p-4 text-sm leading-7 text-text-secondary">
              <p className="font-semibold text-white">What happens next</p>
              <p className="mt-1">
                Kyle reviews your answers and follows up on anything marked as sending later, needing
                help, or to discuss. Once submitted, this form locks. To send a correction or more
                materials later, open a support ticket in the portal — or ask Kyle to reopen this form.
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            {visibleFields.length === 0 ? (
              <p className="rounded-3xl border border-penn-blue bg-rich-black/40 p-4 text-sm leading-7 text-text-secondary">
                Nothing to answer here — you can move on to the next step.
              </p>
            ) : (
              visibleFields.map(renderField)
            )}
          </div>
        )}

        {missing.length > 0 ? (
          <div className="mt-6 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            <p className="font-semibold">A few required answers are still missing:</p>
            <ul className="mt-2 space-y-1">
              {missing.map((entry) => (
                <li key={`${entry.stepKey}-${entry.fieldKey}`}>
                  <button
                    type="button"
                    onClick={() => goToStep(entry.stepKey)}
                    className="underline decoration-amber-300/60 underline-offset-2 hover:text-white"
                  >
                    {entry.stepTitle}: {entry.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {error ? (
          <p role="alert" className="mt-6 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        ) : null}

        {message ? (
          <p role="status" className="mt-6 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {message}
          </p>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-3">
          {previousStepKey ? (
            <button
              type="button"
              onClick={() => goToStep(previousStepKey)}
              className="rounded-full border border-penn-blue px-5 py-3 font-semibold text-text-primary transition hover:border-blue-ncs"
            >
              Back
            </button>
          ) : null}

          {!isReviewStep ? (
            <button
              type="button"
              disabled={isLocked || isSaving}
              onClick={() => void saveAll(nextStepKey)}
              className="rounded-full bg-blue-ncs px-5 py-3 font-semibold text-white transition hover:bg-lapis-lazuli disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Save and continue"}
            </button>
          ) : null}

          <button
            type="button"
            disabled={isLocked || isSaving}
            onClick={() => void saveAll()}
            className="rounded-full border border-penn-blue px-5 py-3 font-semibold text-text-primary transition hover:border-blue-ncs disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Saving..." : "Save progress"}
          </button>

          {isReviewStep ? (
            <button
              type="button"
              disabled={isLocked || isSubmitting || isSaving}
              onClick={() => void submitOnboarding()}
              className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-5 py-3 font-semibold text-emerald-100 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Submitting..." : "Submit onboarding"}
            </button>
          ) : null}
        </div>
      </section>

      <ExpandQuestionnaireModal
        open={!!expandModalField}
        fieldKey={expandModalField?.key ?? ""}
        fieldLabel={expandModalField?.label ?? ""}
        currentValue={expandModalField ? responses[activeStep.key]?.[expandModalField.key] || "" : ""}
        context={responses}
        onClose={() => setExpandModalField(null)}
        onAccept={(text) => {
          if (expandModalField) updateField(activeStep.key, expandModalField.key, text);
          setExpandModalField(null);
        }}
      />
    </div>
  );
}
