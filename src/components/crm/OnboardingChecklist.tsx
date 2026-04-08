"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { onboardingSteps } from "@/lib/crm";
import type { OnboardingStatus } from "@/types/crm";

interface OnboardingChecklistProps {
  organizationId: string;
  status: OnboardingStatus;
  initialStep: string;
  initialCompletedSteps: string[];
  initialResponses: Record<string, Record<string, string>>;
}

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

  const activeStep = useMemo(
    () => onboardingSteps.find((step) => step.key === currentStep) || onboardingSteps[0],
    [currentStep],
  );

  const isLocked =
    status === "submitted" || status === "completed" || status === "skipped_legacy";

  function updateField(stepKey: string, fieldKey: string, value: string) {
    setResponses((current) => ({
      ...current,
      [stepKey]: {
        ...(current[stepKey] || {}),
        [fieldKey]: value,
      },
    }));
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

      const nextCompleted = Array.from(new Set([...completedSteps, activeStep.key]));
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
      <aside className="space-y-3 rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-5">
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

      <section className="rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-6 md:p-8">
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

            return (
              <div key={field.key} className="space-y-2">
                <label className="text-sm font-medium text-text-primary">
                  {field.label}
                </label>
                {field.type === "textarea" ? (
                  <textarea
                    value={value}
                    onChange={(event) =>
                      updateField(activeStep.key, field.key, event.target.value)
                    }
                    disabled={isLocked}
                    rows={5}
                    className="w-full rounded-2xl border border-penn-blue bg-rich-black px-4 py-3"
                    placeholder={field.placeholder}
                  />
                ) : (
                  <input
                    type={field.type}
                    value={value}
                    onChange={(event) =>
                      updateField(activeStep.key, field.key, event.target.value)
                    }
                    disabled={isLocked}
                    className="w-full rounded-2xl border border-penn-blue bg-rich-black px-4 py-3"
                    placeholder={field.placeholder}
                  />
                )}
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
    </div>
  );
}
