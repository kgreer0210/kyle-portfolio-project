"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { onboardingSteps } from "@/lib/crm";
import type { OnboardingStatus } from "@/types/crm";
import ExpandQuestionnaireModal from "./ExpandQuestionnaireModal";
import HelpTooltip from "./HelpTooltip";
import PersonListField from "./PersonListField";

interface OnboardingChecklistProps {
  organizationId: string;
  status: OnboardingStatus;
  initialStep: string;
  initialCompletedSteps: string[];
  initialResponses: Record<string, Record<string, string>>;
}

const SUPPORT_HOURS_CUSTOM_SENTINEL = "Custom";
const PREFERRED_CHANNEL_OTHER_SENTINEL = "Other";

export default function OnboardingChecklist({
  organizationId,
  status,
  initialStep,
  initialCompletedSteps,
  initialResponses,
}: OnboardingChecklistProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(
    initialStep || onboardingSteps[0].key,
  );
  const [completedSteps, setCompletedSteps] = useState(initialCompletedSteps);
  const [responses, setResponses] = useState(initialResponses);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refiningField, setRefiningField] = useState<string | null>(null);
  const [openRefineMenu, setOpenRefineMenu] = useState<string | null>(null);
  const [expandModalField, setExpandModalField] = useState<{
    key: string;
    label: string;
  } | null>(null);
  const refineMenuRef = useRef<HTMLDivElement>(null);

  const activeStep = useMemo(
    () =>
      onboardingSteps.find((step) => step.key === currentStep) ||
      onboardingSteps[0],
    [currentStep],
  );

  const isLocked =
    status === "submitted" ||
    status === "completed" ||
    status === "skipped_legacy";

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
    const idx = selected.indexOf(option);
    let next: string[];
    if (idx === -1) {
      next = [...selected, option];
    } else {
      next = selected.filter((v) => v !== option);
    }
    updateField(stepKey, fieldKey, next.join(","));
  }

  async function refineField(
    fieldKey: string,
    fieldLabel: string,
    action: "polish" | "expand",
  ) {
    const currentValue = responses[activeStep.key]?.[fieldKey] || "";
    if (!currentValue.trim()) return;

    setRefiningField(fieldKey);
    setOpenRefineMenu(null);

    try {
      const response = await fetch("/api/crm/onboarding/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fieldKey,
          fieldLabel,
          action,
          currentValue,
          context: responses,
        }),
      });

      const payload = (await response.json()) as {
        result?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || "Unable to refine field.");
      }

      if (payload.result) {
        updateField(activeStep.key, fieldKey, payload.result);
      }
    } catch (refineError) {
      setError(
        refineError instanceof Error
          ? refineError.message
          : "Unable to refine field.",
      );
    } finally {
      setRefiningField(null);
    }
  }

  async function saveStep(nextStep?: string): Promise<boolean> {
    setIsSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/crm/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organizationId,
          stepKey: activeStep.key,
          response: responses[activeStep.key] || {},
          currentStep: nextStep || activeStep.key,
          completedSteps: Array.from(
            new Set([...completedSteps, activeStep.key]),
          ),
        }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "Unable to save onboarding draft.");
      }

      const nextCompleted = Array.from(
        new Set([...completedSteps, activeStep.key]),
      );
      setCompletedSteps(nextCompleted);
      if (nextStep) {
        setCurrentStep(nextStep);
      }
      setMessage("Draft saved.");
      router.refresh();
      return true;
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save onboarding draft.",
      );
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  async function submitOnboarding() {
    setIsSubmitting(true);
    setError("");
    setMessage("");

    try {
      const saved = await saveStep(activeStep.key);

      if (!saved) {
        return;
      }

      const response = await fetch("/api/crm/onboarding/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organizationId,
          completedSteps: Array.from(
            new Set([...completedSteps, activeStep.key]),
          ),
        }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "Unable to submit onboarding.");
      }

      setMessage("Onboarding submitted.");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to submit onboarding.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
      <aside className="space-y-3 rounded-4xl border border-penn-blue bg-oxford-blue/80 p-5">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-blue-ncs">
            Onboarding Progress
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">Checklist</h2>
        </div>

        {onboardingSteps.map((step, index) => {
          const isComplete = completedSteps.includes(step.key);
          const isActive = step.key === activeStep.key;

          return (
            <button
              key={step.key}
              type="button"
              onClick={() => setCurrentStep(step.key)}
              className={`block w-full rounded-3xl border px-4 py-4 text-left transition ${
                isActive
                  ? "border-blue-ncs bg-blue-ncs/10"
                  : "border-penn-blue bg-rich-black/40"
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-semibold text-white">
                  {index + 1}. {step.title}
                </span>
                <span
                  className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.18em] ${
                    isComplete
                      ? "bg-emerald-500/15 text-emerald-200"
                      : "bg-slate-500/15 text-slate-300"
                  }`}
                >
                  {isComplete ? "Done" : "Open"}
                </span>
              </div>
            </button>
          );
        })}
      </aside>

      <section className="rounded-4xl border border-penn-blue bg-oxford-blue/80 p-6 md:p-8">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.2em] text-blue-ncs">
            {activeStep.title}
          </p>
          <h3 className="text-3xl font-semibold text-white">
            {activeStep.title}
          </h3>
          <p className="max-w-3xl text-sm leading-7 text-text-secondary">
            {activeStep.description}
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {activeStep.fields.map((field) => {
            const value = responses[activeStep.key]?.[field.key] || "";
            const isRefiningThis = refiningField === field.key;

            if (field.type === "radio" && field.options) {
              // Last option may be a "custom" catch-all (Custom / Other).
              // Clicking it stores the option label as a sentinel so the pill
              // stays highlighted. Typing in the text input below then replaces
              // the sentinel with the actual typed value.
              const lastOption = field.options[field.options.length - 1];
              const isLastOptionCustom =
                lastOption === SUPPORT_HOURS_CUSTOM_SENTINEL ||
                lastOption === PREFERRED_CHANNEL_OTHER_SENTINEL;
              const standardOptions = isLastOptionCustom
                ? field.options.slice(0, -1)
                : field.options;
              const isCustomActive =
                isLastOptionCustom &&
                value !== "" &&
                !standardOptions.includes(value);
              // Which pill appears selected
              const selectedOption = isCustomActive ? lastOption : value;
              // What to display inside the custom text input
              const customInputValue = value === lastOption ? "" : value;

              return (
                <div key={field.key} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-text-primary">
                      {field.label}
                    </label>
                    {field.helpText ? (
                      <HelpTooltip
                        text={field.helpText}
                        label={`${field.label} help`}
                      />
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {field.options.map((option) => {
                      const isSelected = selectedOption === option;
                      return (
                        <button
                          key={option}
                          type="button"
                          disabled={isLocked}
                          onClick={() =>
                            updateField(activeStep.key, field.key, option)
                          }
                          className={`rounded-full border px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
                            isSelected
                              ? "border-blue-ncs bg-blue-ncs/20 text-white"
                              : "border-penn-blue bg-rich-black/40 text-text-secondary hover:border-blue-ncs/60 hover:text-white"
                          }`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                  {isCustomActive && (
                    <input
                      type="text"
                      value={customInputValue}
                      onChange={(e) =>
                        updateField(activeStep.key, field.key, e.target.value)
                      }
                      disabled={isLocked}
                      autoFocus
                      className="w-full rounded-2xl border border-penn-blue bg-rich-black px-4 py-3 text-sm text-white placeholder:text-text-secondary"
                      placeholder={
                        field.key === "support_hours"
                          ? "Describe your preferred support hours"
                          : "Describe your preferred channel"
                      }
                    />
                  )}
                </div>
              );
            }

            if (field.type === "checkboxes" && field.options) {
              const selected = value ? value.split(",") : [];
              return (
                <div key={field.key} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-text-primary">
                      {field.label}
                    </label>
                    {field.helpText ? (
                      <HelpTooltip
                        text={field.helpText}
                        label={`${field.label} help`}
                      />
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {field.options.map((option) => {
                      const isChecked = selected.includes(option);
                      return (
                        <button
                          key={option}
                          type="button"
                          disabled={isLocked}
                          onClick={() =>
                            toggleCheckbox(activeStep.key, field.key, option)
                          }
                          className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
                            isChecked
                              ? "border-blue-ncs bg-blue-ncs/20 text-white"
                              : "border-penn-blue bg-rich-black/40 text-text-secondary hover:border-blue-ncs/60 hover:text-white"
                          }`}
                        >
                          <span
                            className={`flex h-4 w-4 items-center justify-center rounded border text-[10px] ${
                              isChecked
                                ? "border-blue-ncs bg-blue-ncs text-white"
                                : "border-slate-500"
                            }`}
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
              return (
                <div key={field.key} className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-text-primary">
                        {field.label}
                      </label>
                      {field.helpText ? (
                        <HelpTooltip
                          text={field.helpText}
                          label={`${field.label} help`}
                        />
                      ) : null}
                    </div>
                    {!isLocked && (
                      <div
                        className="relative"
                        ref={
                          openRefineMenu === field.key
                            ? refineMenuRef
                            : undefined
                        }
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setOpenRefineMenu(
                              openRefineMenu === field.key ? null : field.key,
                            )
                          }
                          disabled={isRefiningThis || !value.trim()}
                          title={
                            value.trim()
                              ? "Polish or expand your draft with AI"
                              : "Type a rough draft first — then polish or expand it"
                          }
                          className="flex items-center gap-1.5 rounded-full border border-penn-blue/60 bg-rich-black/60 px-3 py-1.5 text-xs text-text-secondary transition hover:border-blue-ncs/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {isRefiningThis ? (
                            <span className="inline-block h-3 w-3 animate-spin rounded-full border border-blue-ncs border-t-transparent" />
                          ) : (
                            <span>✦</span>
                          )}
                          {isRefiningThis ? "Refining..." : "Refine"}
                        </button>
                        {openRefineMenu === field.key && (
                          <div className="absolute right-0 top-full z-10 mt-1 w-36 overflow-hidden rounded-2xl border border-penn-blue bg-oxford-blue shadow-lg">
                            <button
                              type="button"
                              onClick={() =>
                                void refineField(
                                  field.key,
                                  field.label,
                                  "polish",
                                )
                              }
                              className="block w-full px-4 py-3 text-left text-sm text-text-primary transition hover:bg-blue-ncs/10 hover:text-white"
                            >
                              ✦ Polish
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setExpandModalField({
                                  key: field.key,
                                  label: field.label,
                                });
                                setOpenRefineMenu(null);
                              }}
                              className="block w-full px-4 py-3 text-left text-sm text-text-primary transition hover:bg-blue-ncs/10 hover:text-white"
                            >
                              ↗ Expand
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <textarea
                    value={value}
                    onChange={(event) =>
                      updateField(activeStep.key, field.key, event.target.value)
                    }
                    disabled={isLocked || isRefiningThis}
                    rows={5}
                    className="w-full rounded-2xl border border-penn-blue bg-rich-black px-4 py-3 text-sm text-white placeholder:text-text-secondary disabled:opacity-60"
                    placeholder={field.placeholder}
                  />
                </div>
              );
            }

            if (field.type === "person_list") {
              return (
                <div key={field.key} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-text-primary">
                      {field.label}
                    </label>
                    {field.helpText ? (
                      <HelpTooltip
                        text={field.helpText}
                        label={`${field.label} help`}
                      />
                    ) : null}
                  </div>
                  <PersonListField
                    value={value}
                    onChange={(next) =>
                      updateField(activeStep.key, field.key, next)
                    }
                    disabled={isLocked}
                  />
                </div>
              );
            }

            return (
              <div key={field.key} className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-text-primary">
                    {field.label}
                  </label>
                  {field.helpText ? (
                    <HelpTooltip
                      text={field.helpText}
                      label={`${field.label} help`}
                    />
                  ) : null}
                </div>
                <input
                  type={field.type}
                  value={value}
                  onChange={(event) =>
                    updateField(activeStep.key, field.key, event.target.value)
                  }
                  disabled={isLocked}
                  className="w-full rounded-2xl border border-penn-blue bg-rich-black px-4 py-3 text-sm text-white placeholder:text-text-secondary"
                  placeholder={field.placeholder}
                />
              </div>
            );
          })}
        </div>

        {error ? (
          <p className="mt-6 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        ) : null}

        {message ? (
          <p className="mt-6 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {message}
          </p>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-3">
          {activeStep.key !== "review-and-submit" ? (
            <button
              type="button"
              disabled={isLocked || isSaving}
              onClick={() => {
                const currentIndex = onboardingSteps.findIndex(
                  (step) => step.key === activeStep.key,
                );
                const nextStep = onboardingSteps[currentIndex + 1]?.key;
                void saveStep(nextStep);
              }}
              className="rounded-full bg-blue-ncs px-5 py-3 font-semibold text-white transition hover:bg-lapis-lazuli disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Save and continue"}
            </button>
          ) : null}

          <button
            type="button"
            disabled={isLocked || isSaving}
            onClick={() => void saveStep()}
            className="rounded-full border border-penn-blue px-5 py-3 font-semibold text-text-primary transition hover:border-blue-ncs"
          >
            Save draft
          </button>

          {activeStep.key === "review-and-submit" ? (
            <button
              type="button"
              disabled={isLocked || isSubmitting}
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
        currentValue={
          expandModalField
            ? responses[activeStep.key]?.[expandModalField.key] || ""
            : ""
        }
        context={responses}
        onClose={() => setExpandModalField(null)}
        onAccept={(text) => {
          if (expandModalField) {
            updateField(activeStep.key, expandModalField.key, text);
          }
          setExpandModalField(null);
        }}
      />
    </div>
  );
}
