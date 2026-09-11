"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDateTime } from "@/lib/crm";
import { buildInitialAnswers, buildOnboardingSteps } from "@/lib/onboardingFlow";
import {
  applyPresetToPlan,
  createDefaultPlan,
  getPresetItems,
  projectTypeDescriptions,
  projectTypeLabels,
  projectTypes,
  requestedItemDefinitions,
  requestedItemStatusLabels,
  requestedItemStatuses,
} from "@/lib/onboardingPresets";
import type {
  OnboardingPlan,
  ProjectType,
  RequestedItemStatus,
} from "@/types/crm";
import OnboardingChecklist from "./OnboardingChecklist";

interface PrepareOnboardingFormProps {
  organizationId: string;
  organizationName: string;
  contactName: string | null;
  contactEmail: string | null;
  websiteUrl: string | null;
  billingLabel: string | null;
  initialProjectType: ProjectType | null;
  initialProjectSummary: string;
  initialPlan: OnboardingPlan | null;
  planSentAt: string | null;
  planUpdatedAt: string | null;
  memberCount: number;
  hasActiveMember: boolean;
  isLocked: boolean;
  clientHasStarted: boolean;
}

const inputClass =
  "w-full rounded-2xl border border-penn-blue bg-rich-black px-4 py-3 text-sm text-white placeholder:text-text-secondary disabled:opacity-60";
const labelClass = "text-sm font-medium text-text-primary";

function SectionHeading({
  step,
  title,
  description,
}: {
  step: number;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-blue-ncs">Step {step}</p>
      <h3 className="mt-1 text-xl font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-text-secondary">{description}</p>
    </div>
  );
}

export default function PrepareOnboardingForm({
  organizationId,
  organizationName,
  contactName,
  contactEmail,
  websiteUrl: initialWebsiteUrl,
  billingLabel,
  initialProjectType,
  initialProjectSummary,
  initialPlan,
  planSentAt: initialPlanSentAt,
  planUpdatedAt: initialPlanUpdatedAt,
  memberCount,
  hasActiveMember,
  isLocked,
  clientHasStarted,
}: PrepareOnboardingFormProps) {
  const router = useRouter();
  const [projectType, setProjectType] = useState<ProjectType | null>(initialProjectType);
  const [projectSummary, setProjectSummary] = useState(initialProjectSummary);
  const [websiteUrl, setWebsiteUrl] = useState(initialWebsiteUrl ?? "");
  const [plan, setPlan] = useState<OnboardingPlan>(
    initialPlan ?? (initialProjectType ? createDefaultPlan(initialProjectType) : createDefaultPlan("new_website")),
  );
  const [deliverableDraft, setDeliverableDraft] = useState("");
  const [customLabel, setCustomLabel] = useState("");
  const [customQuestion, setCustomQuestion] = useState("");
  const [savedAt, setSavedAt] = useState<string | null>(initialPlanUpdatedAt);
  const [sentAt, setSentAt] = useState<string | null>(initialPlanSentAt);
  const [dirty, setDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const disabled = isLocked;

  function markDirty() {
    setDirty(true);
    setMessage("");
  }

  function choosePresetType(type: ProjectType) {
    setProjectType(type);
    setPlan((current) => applyPresetToPlan(current, type));
    markDirty();
  }

  function setItemStatus(key: string, status: RequestedItemStatus) {
    setPlan((current) => ({
      ...current,
      requestedItems: {
        ...current.requestedItems,
        [key]: { ...(current.requestedItems[key] ?? { status }), status },
      },
    }));
    markDirty();
  }

  function setItemNote(key: string, note: string) {
    setPlan((current) => ({
      ...current,
      requestedItems: {
        ...current.requestedItems,
        [key]: { ...(current.requestedItems[key] ?? { status: "ask" }), note },
      },
    }));
    markDirty();
  }

  function setKnown(key: keyof OnboardingPlan["knownInfo"], value: string) {
    setPlan((current) => ({
      ...current,
      knownInfo: { ...current.knownInfo, [key]: value },
    }));
    markDirty();
  }

  function addDeliverable() {
    const value = deliverableDraft.trim();
    if (!value) return;
    setPlan((current) => ({ ...current, deliverables: [...current.deliverables, value] }));
    setDeliverableDraft("");
    markDirty();
  }

  function removeDeliverable(index: number) {
    setPlan((current) => ({
      ...current,
      deliverables: current.deliverables.filter((_, i) => i !== index),
    }));
    markDirty();
  }

  function addCustomItem() {
    const label = customLabel.trim();
    if (!label) return;
    const key = `custom_${label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 40)}`;
    if (plan.customItems.some((item) => item.key === key)) {
      setError("You already added an item with that name.");
      return;
    }
    setPlan((current) => ({
      ...current,
      customItems: [...current.customItems, { key, label, question: customQuestion.trim() || label }],
      requestedItems: { ...current.requestedItems, [key]: { status: "ask" } },
    }));
    setCustomLabel("");
    setCustomQuestion("");
    setError("");
    markDirty();
  }

  function removeCustomItem(key: string) {
    setPlan((current) => {
      const requestedItems = { ...current.requestedItems };
      delete requestedItems[key];
      return {
        ...current,
        customItems: current.customItems.filter((item) => item.key !== key),
        requestedItems,
      };
    });
    markDirty();
  }

  const previewSteps = useMemo(
    () =>
      buildOnboardingSteps({
        flowVersion: "v2",
        projectType: projectType ?? "new_website",
        plan,
        projectSummary,
        known: {
          organizationName,
          contactName,
          contactEmail,
          websiteUrl: websiteUrl || null,
        },
      }),
    [projectType, plan, projectSummary, organizationName, contactName, contactEmail, websiteUrl],
  );
  const previewKey = useMemo(() => JSON.stringify(previewSteps), [previewSteps]);
  // Count questions the client actually sees up front: choice pills and
  // always-visible text fields. Conditional follow-ups are not counted.
  const askedCount = projectType
    ? previewSteps
        .find((step) => step.key === "materials")
        ?.fields.filter(
          (field) => field.type !== "static" && !field.showWhen,
        ).length ?? 0
    : 0;

  async function savePlan(): Promise<boolean> {
    if (!projectType) {
      setError("Choose a project type first.");
      return false;
    }
    setIsSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/admin/onboarding/${organizationId}/plan`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectType, projectSummary, plan, websiteUrl }),
      });
      const payload = (await response.json()) as { error?: string; planUpdatedAt?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to save the plan.");
      setSavedAt(payload.planUpdatedAt ?? new Date().toISOString());
      setDirty(false);
      setMessage("Plan saved.");
      router.refresh();
      return true;
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save the plan.");
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  async function sendPlan() {
    setIsSending(true);
    setError("");
    setMessage("");
    try {
      if (dirty || !savedAt) {
        const saved = await savePlan();
        if (!saved) return;
      }
      const response = await fetch(`/api/admin/onboarding/${organizationId}/send`, {
        method: "POST",
      });
      const payload = (await response.json()) as {
        error?: string;
        method?: "invite" | "magiclink" | "ready_email";
        sentAt?: string;
      };
      if (!response.ok) throw new Error(payload.error || "Unable to send onboarding.");
      setSentAt(payload.sentAt ?? new Date().toISOString());
      setMessage(
        payload.method === "invite"
          ? `Portal invitation sent to ${contactEmail}.`
          : payload.method === "magiclink"
            ? `Sign-in link emailed to ${contactEmail} (that address was already registered).`
            : `Onboarding-ready email sent to the client.`,
      );
      router.refresh();
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Unable to send onboarding.");
    } finally {
      setIsSending(false);
    }
  }

  const presetItems = projectType ? getPresetItems(projectType) : [];
  const sendDescription =
    memberCount === 0
      ? `Sends the portal invitation to ${contactEmail ?? "the primary contact"}. When they accept, they land in this onboarding.`
      : hasActiveMember
        ? `Emails ${contactEmail ?? "the client"} that their onboarding is ready. They already have portal access.`
        : `Emails ${contactEmail ?? "the client"} that their onboarding is ready. They were invited but haven't activated yet.`;

  return (
    <div className="space-y-8">
      {/* 1. Project type */}
      <section className="rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-6">
        <SectionHeading
          step={1}
          title="Project type"
          description="Sets sensible defaults for what to ask. You can adjust every item in step 3."
        />
        <div className="mt-5 grid gap-4 md:grid-cols-2" role="radiogroup" aria-label="Project type">
          {projectTypes.map((type) => {
            const selected = projectType === type;
            return (
              <button
                key={type}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={disabled}
                onClick={() => choosePresetType(type)}
                className={`rounded-3xl border px-5 py-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  selected ? "border-blue-ncs bg-blue-ncs/10" : "border-penn-blue bg-rich-black/50 hover:border-blue-ncs/60"
                }`}
              >
                <div className="font-semibold text-white">{projectTypeLabels[type]}</div>
                <p className="mt-2 text-sm leading-6 text-text-secondary">{projectTypeDescriptions[type]}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. Known information */}
      <section className="rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-6">
        <SectionHeading
          step={2}
          title="Known information"
          description="Pulled from the client record. The client confirms or corrects these instead of typing them again."
        />
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-penn-blue bg-rich-black/40 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Primary contact</p>
            <p className="mt-2 font-semibold text-white">{contactName || "No name on file"}</p>
            <p className="mt-1 text-sm text-text-secondary">{contactEmail || "No email on file"}</p>
            <p className="mt-2 text-xs text-text-secondary">Edit on the client record if this is wrong.</p>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="known-website" className={labelClass}>
                Website address {projectType === "existing_website" ? "(the site we're working on)" : "(optional)"}
              </label>
              <input
                id="known-website"
                type="url"
                value={websiteUrl}
                disabled={disabled}
                onChange={(event) => {
                  setWebsiteUrl(event.target.value);
                  markDirty();
                }}
                placeholder="https://"
                className={inputClass}
              />
            </div>
            {projectType === "new_website" ? (
              <div className="space-y-2">
                <label htmlFor="known-domain" className={labelClass}>
                  Domain already chosen (optional)
                </label>
                <input
                  id="known-domain"
                  value={plan.knownInfo.domainName ?? ""}
                  disabled={disabled}
                  onChange={(event) => setKnown("domainName", event.target.value)}
                  placeholder="yourbusiness.com"
                  className={inputClass}
                />
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label htmlFor="known-title" className={labelClass}>Contact role (optional)</label>
            <input
              id="known-title"
              value={plan.knownInfo.contactTitle ?? ""}
              disabled={disabled}
              onChange={(event) => setKnown("contactTitle", event.target.value)}
              placeholder="Owner"
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="known-phone" className={labelClass}>Contact phone (optional)</label>
            <input
              id="known-phone"
              value={plan.knownInfo.contactPhone ?? ""}
              disabled={disabled}
              onChange={(event) => setKnown("contactPhone", event.target.value)}
              placeholder="If already known"
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="known-coverage" className={labelClass}>Agreed support coverage (optional)</label>
            <input
              id="known-coverage"
              value={plan.knownInfo.supportCoverage ?? ""}
              disabled={disabled}
              onChange={(event) => setKnown("supportCoverage", event.target.value)}
              placeholder={billingLabel ? `e.g. ${billingLabel}: small fixes included` : "Shown to the client, never asked"}
              className={inputClass}
            />
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <label htmlFor="project-summary" className={labelClass}>
            Client-friendly project summary
          </label>
          <p className="text-xs leading-5 text-text-secondary">
            Two to four plain sentences describing what we agreed to build. This is a
            confirmation aid for the client; it does not replace or amend the signed
            statement of work.
          </p>
          <textarea
            id="project-summary"
            rows={4}
            value={projectSummary}
            disabled={disabled}
            onChange={(event) => {
              setProjectSummary(event.target.value);
              markDirty();
            }}
            placeholder="We're building a new five-page website for Acme Plumbing with online booking…"
            className={inputClass}
          />
        </div>

        <div className="mt-4 space-y-2">
          <label htmlFor="deliverable-input" className={labelClass}>Main deliverables</label>
          <ul className="space-y-2">
            {plan.deliverables.map((deliverable, index) => (
              <li
                key={`${deliverable}-${index}`}
                className="flex items-center justify-between gap-3 rounded-2xl border border-penn-blue bg-rich-black/40 px-4 py-2 text-sm text-white"
              >
                <span>{deliverable}</span>
                {!disabled ? (
                  <button
                    type="button"
                    onClick={() => removeDeliverable(index)}
                    className="text-xs text-text-secondary transition hover:text-white"
                    aria-label={`Remove ${deliverable}`}
                  >
                    Remove
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <input
              id="deliverable-input"
              value={deliverableDraft}
              disabled={disabled}
              onChange={(event) => setDeliverableDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addDeliverable();
                }
              }}
              placeholder="e.g. Home, Services, About, Contact pages"
              className={inputClass}
            />
            <button
              type="button"
              disabled={disabled || !deliverableDraft.trim()}
              onClick={addDeliverable}
              className="shrink-0 rounded-full border border-penn-blue px-4 py-2 text-sm font-semibold text-text-primary transition hover:border-blue-ncs disabled:cursor-not-allowed disabled:opacity-60"
            >
              Add
            </button>
          </div>
        </div>
      </section>

      {/* 3. Requested items */}
      <section className="rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-6">
        <SectionHeading
          step={3}
          title="Requested information and materials"
          description="For each item decide whether you already have it, want to ask the client, or don't need it. Only “Ask client” items appear in the client flow; notes on asked access items are shown to the client, other notes are for you."
        />

        {!projectType ? (
          <p className="mt-5 text-sm text-text-secondary">Choose a project type first.</p>
        ) : (
          <div className="mt-5 space-y-3">
            {presetItems.map((preset) => {
              const definition = requestedItemDefinitions[preset.key];
              if (!definition) return null;
              const selection = plan.requestedItems[preset.key] ?? { status: preset.status };
              return (
                <div key={preset.key} className="rounded-3xl border border-penn-blue bg-rich-black/40 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-md">
                      <p className="font-semibold text-white">{definition.label}</p>
                      <p className="mt-1 text-xs leading-5 text-text-secondary">{definition.description}</p>
                    </div>
                    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={`${definition.label} decision`}>
                      {requestedItemStatuses.map((status) => {
                        const selected = selection.status === status;
                        return (
                          <button
                            key={status}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            disabled={disabled}
                            onClick={() => setItemStatus(preset.key, status)}
                            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                              selected
                                ? status === "ask"
                                  ? "border-blue-ncs bg-blue-ncs/20 text-white"
                                  : status === "have"
                                    ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-100"
                                    : "border-slate-500/50 bg-slate-500/10 text-slate-200"
                                : "border-penn-blue text-text-secondary hover:border-blue-ncs/60 hover:text-white"
                            }`}
                          >
                            {requestedItemStatusLabels[status]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {selection.status !== "not_needed" ? (
                    <input
                      value={selection.note ?? ""}
                      disabled={disabled}
                      onChange={(event) => setItemNote(preset.key, event.target.value)}
                      aria-label={`${definition.label} note`}
                      placeholder={
                        selection.status === "have"
                          ? definition.adminNotePlaceholder ?? "Where it is or what we have"
                          : definition.kind === "access"
                            ? "Which accounts (shown to the client)"
                            : "Context for you (not shown to the client)"
                      }
                      className={`${inputClass} mt-3`}
                    />
                  ) : null}
                </div>
              );
            })}

            {plan.customItems.map((item) => {
              const selection = plan.requestedItems[item.key] ?? { status: "ask" as RequestedItemStatus };
              return (
                <div key={item.key} className="rounded-3xl border border-blue-ncs/40 bg-rich-black/40 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-md">
                      <p className="font-semibold text-white">{item.label}</p>
                      <p className="mt-1 text-xs leading-5 text-text-secondary">Asks: “{item.question}”</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={`${item.label} decision`}>
                        {requestedItemStatuses.map((status) => (
                          <button
                            key={status}
                            type="button"
                            role="radio"
                            aria-checked={selection.status === status}
                            disabled={disabled}
                            onClick={() => setItemStatus(item.key, status)}
                            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-60 ${
                              selection.status === status
                                ? "border-blue-ncs bg-blue-ncs/20 text-white"
                                : "border-penn-blue text-text-secondary hover:border-blue-ncs/60 hover:text-white"
                            }`}
                          >
                            {requestedItemStatusLabels[status]}
                          </button>
                        ))}
                      </div>
                      {!disabled ? (
                        <button
                          type="button"
                          onClick={() => removeCustomItem(item.key)}
                          className="text-xs text-text-secondary transition hover:text-white"
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}

            {!disabled ? (
              <div className="rounded-3xl border border-dashed border-penn-blue p-4">
                <p className="text-sm font-medium text-text-primary">Add a custom item</p>
                <div className="mt-3 grid gap-3 md:grid-cols-[1fr_2fr_auto]">
                  <input
                    value={customLabel}
                    onChange={(event) => setCustomLabel(event.target.value)}
                    placeholder="Item name (e.g. Menu PDF)"
                    aria-label="Custom item name"
                    className={inputClass}
                  />
                  <input
                    value={customQuestion}
                    onChange={(event) => setCustomQuestion(event.target.value)}
                    placeholder="Question the client sees (optional)"
                    aria-label="Custom item question"
                    className={inputClass}
                  />
                  <button
                    type="button"
                    disabled={!customLabel.trim()}
                    onClick={addCustomItem}
                    className="rounded-full border border-penn-blue px-4 py-2 text-sm font-semibold text-text-primary transition hover:border-blue-ncs disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Add item
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </section>

      {/* 4. Preview and send */}
      <section className="rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-6">
        <SectionHeading
          step={4}
          title="Preview and send"
          description="This is exactly what the client will see, including their prefilled details. Nothing in the preview is saved."
        />

        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-text-secondary">
          <span className="rounded-full border border-penn-blue px-3 py-1">
            {!projectType
              ? "Choose a project type"
              : askedCount === 0
                ? "No materials questions"
                : `${askedCount} material/access question${askedCount === 1 ? "" : "s"}`}
          </span>
          <span className="rounded-full border border-penn-blue px-3 py-1">
            {savedAt ? `Plan saved ${formatDateTime(savedAt)}` : "Plan not saved yet"}
          </span>
          {sentAt ? (
            <span className="rounded-full border border-emerald-500/40 px-3 py-1 text-emerald-200">
              Sent {formatDateTime(sentAt)}
            </span>
          ) : null}
          {dirty ? (
            <span className="rounded-full border border-amber-500/40 px-3 py-1 text-amber-200">Unsaved changes</span>
          ) : null}
        </div>

        {clientHasStarted ? (
          <p className="mt-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            The client has already started answering. Saving changes the questions they see; their existing answers are kept.
          </p>
        ) : null}

        <div className="mt-5">
          <button
            type="button"
            onClick={() => setShowPreview((current) => !current)}
            disabled={!projectType}
            aria-expanded={showPreview}
            className="rounded-full border border-penn-blue px-5 py-3 font-semibold text-text-primary transition hover:border-blue-ncs disabled:cursor-not-allowed disabled:opacity-60"
          >
            {showPreview ? "Hide client preview" : "Show client preview"}
          </button>
        </div>

        {showPreview && projectType ? (
          <div className="mt-6 rounded-[2rem] border border-blue-ncs/30 bg-rich-black/30 p-4 md:p-6" data-testid="client-preview">
            <p className="mb-4 text-xs uppercase tracking-[0.2em] text-blue-ncs">Client preview</p>
            <OnboardingChecklist
              key={previewKey}
              organizationId={organizationId}
              status="in_progress"
              initialStep={previewSteps[0].key}
              initialResponses={buildInitialAnswers(previewSteps, {})}
              steps={previewSteps}
              previewMode
            />
          </div>
        ) : null}

        <div className="mt-6 rounded-3xl border border-penn-blue bg-rich-black/40 p-4">
          <p className="text-sm font-semibold text-white">What “Send” does</p>
          <p className="mt-1 text-sm leading-6 text-text-secondary">{sendDescription}</p>
          <p className="mt-2 text-xs leading-5 text-text-secondary">
            Send this after the agreement is signed and the deposit has cleared.
            Submission by the client never marks the project ready — that stays your call on the review page.
          </p>
        </div>

        {error ? (
          <p role="alert" className="mt-5 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        ) : null}
        {message ? (
          <p role="status" className="mt-5 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {message}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={disabled || isSaving || !projectType}
            onClick={() => void savePlan()}
            className="rounded-full bg-blue-ncs px-5 py-3 font-semibold text-white transition hover:bg-lapis-lazuli disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Saving..." : "Save plan"}
          </button>
          <button
            type="button"
            disabled={disabled || isSending || isSaving || !projectType || !contactEmail}
            onClick={() => void sendPlan()}
            className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-5 py-3 font-semibold text-emerald-100 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSending ? "Sending..." : sentAt ? "Send again" : "Send to client"}
          </button>
        </div>
        {isLocked ? (
          <p className="mt-3 text-xs text-text-secondary">
            This onboarding has been submitted. Reopen it from the review page before changing the plan.
          </p>
        ) : null}
      </section>
    </div>
  );
}
