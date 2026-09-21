"use client";

import { FormEvent, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { billingTypeLabels, billingTypes } from "@/lib/crm";
import { projectRequestKindLabels, projectRequestKinds } from "@/lib/projects";
import type {
  DraftClientInput,
  ProjectDraftInput,
} from "@/lib/projectDraft";
import type { ProjectRequestKind } from "@/types/crm";

const inputClass =
  "w-full rounded-2xl border border-penn-blue bg-rich-black px-4 py-3 text-sm";
const labelClass = "text-sm font-medium text-text-primary";
const cardClass =
  "rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-6 md:p-8";
const smallButton =
  "rounded-full border border-penn-blue px-3 py-1.5 text-xs font-semibold text-text-primary transition hover:border-blue-ncs";
const removeButton =
  "rounded-full px-2 py-1 text-xs text-text-secondary transition hover:text-red-300";

interface TaskState {
  key: string;
  title: string;
  client_visible: boolean;
}

interface MilestoneState {
  key: string;
  title: string;
  description: string;
  due_date: string;
  tasks: TaskState[];
}

interface RequestState {
  key: string;
  kind: ProjectRequestKind;
  title: string;
  instructions: string;
  due_date: string;
}

const newKey = () => crypto.randomUUID();

function toMilestoneState(draft: ProjectDraftInput): MilestoneState[] {
  return (draft.milestones || []).map((milestone) => ({
    key: newKey(),
    title: milestone.title || "",
    description: milestone.description || "",
    due_date: milestone.due_date || "",
    tasks: (milestone.tasks || []).map((task) => ({
      key: newKey(),
      title: task.title || "",
      client_visible: task.client_visible ?? true,
    })),
  }));
}

function toRequestState(draft: ProjectDraftInput): RequestState[] {
  return (draft.requests || []).map((request) => ({
    key: newKey(),
    kind: request.kind || "material",
    title: request.title || "",
    instructions: request.instructions || "",
    due_date: request.due_date || "",
  }));
}

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      {children}
    </div>
  );
}

export interface ProjectDraftFormProps {
  /** Existing client: hide client fields and attach the project to it. */
  organizationId?: string;
  initialClient?: Partial<DraftClientInput>;
  initialDraft: ProjectDraftInput;
  /** AI notes shown above the form (Phase 2 SOW extraction). */
  notices?: string[];
  submitLabel?: string;
  onCancel?: () => void;
  /** Uploaded SOW to attach (Phase 2). */
  sow?: {
    storagePath: string;
    fileName: string;
    extraction: Record<string, unknown>;
    model: string | null;
  };
}

export default function ProjectDraftForm({
  organizationId,
  initialClient,
  initialDraft,
  notices = [],
  submitLabel,
  onCancel,
  sow,
}: ProjectDraftFormProps) {
  const router = useRouter();
  const isNewClient = !organizationId;

  const [client, setClient] = useState({
    organization_name: initialClient?.organization_name || "",
    contact_name: initialClient?.contact_name || "",
    contact_email: initialClient?.contact_email || "",
    website_url: initialClient?.website_url || "",
    billing_type: initialClient?.billing_type || "",
    notes: initialClient?.notes || "",
  });
  const [project, setProject] = useState({
    title: initialDraft.project.title || "",
    summary: initialDraft.project.summary || "",
    start_date: initialDraft.project.start_date || "",
    target_date: initialDraft.project.target_date || "",
    contract_amount:
      initialDraft.project.contract_amount != null
        ? String(initialDraft.project.contract_amount)
        : "",
    deposit_percent:
      initialDraft.project.deposit_percent != null
        ? String(initialDraft.project.deposit_percent)
        : "",
  });
  const [milestones, setMilestones] = useState(() => toMilestoneState(initialDraft));
  const [requests, setRequests] = useState(() => toRequestState(initialDraft));
  const [outOfScope, setOutOfScope] = useState(
    (initialDraft.out_of_scope || []).join("\n"),
  );
  const [invite, setInvite] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateMilestone(key: string, patch: Partial<MilestoneState>) {
    setMilestones((current) =>
      current.map((m) => (m.key === key ? { ...m, ...patch } : m)),
    );
  }

  function updateTask(milestoneKey: string, taskKey: string, patch: Partial<TaskState>) {
    setMilestones((current) =>
      current.map((m) =>
        m.key === milestoneKey
          ? {
              ...m,
              tasks: m.tasks.map((t) => (t.key === taskKey ? { ...t, ...patch } : t)),
            }
          : m,
      ),
    );
  }

  function updateRequest(key: string, patch: Partial<RequestState>) {
    setRequests((current) =>
      current.map((r) => (r.key === key ? { ...r, ...patch } : r)),
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const draft: ProjectDraftInput = {
      project: {
        ...project,
        contract_amount: project.contract_amount || null,
        deposit_percent: project.deposit_percent || null,
      },
      milestones: milestones.map((m) => ({
        title: m.title,
        description: m.description,
        due_date: m.due_date,
        tasks: m.tasks.map((t) => ({ title: t.title, client_visible: t.client_visible })),
      })),
      requests: requests.map((r) => ({
        kind: r.kind,
        title: r.title,
        instructions: r.instructions,
        due_date: r.due_date,
      })),
      out_of_scope: outOfScope
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    };

    try {
      const response = await fetch("/api/admin/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isNewClient
            ? {
                client: { ...client, billing_type: client.billing_type || null },
                draft,
                invite,
                sow,
              }
            : { organizationId, draft, sow },
        ),
      });
      const payload = (await response.json()) as {
        error?: string;
        organizationId?: string;
        projectId?: string;
        inviteError?: string | null;
      };

      if (!response.ok || !payload.projectId || !payload.organizationId) {
        throw new Error(payload.error || "Unable to create the project.");
      }

      const target = `/admin/clients/${payload.organizationId}/projects/${payload.projectId}`;
      router.push(
        payload.inviteError
          ? `${target}?inviteError=${encodeURIComponent(payload.inviteError)}`
          : target,
      );
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Unable to create the project.",
      );
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {notices.length > 0 ? (
        <section className="rounded-[2rem] border border-amber-500/30 bg-oxford-blue/80 p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-amber-200">
            Check before creating
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6 text-text-secondary">
            {notices.map((notice) => (
              <li key={notice}>{notice}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {isNewClient ? (
        <section className={cardClass}>
          <h3 className="text-xl font-semibold text-white">Client</h3>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Field id="client-org" label="Organization name">
              <input
                id="client-org"
                className={inputClass}
                value={client.organization_name}
                onChange={(e) => setClient({ ...client, organization_name: e.target.value })}
                required
              />
            </Field>
            <Field id="client-website" label="Website (optional)">
              <input
                id="client-website"
                className={inputClass}
                value={client.website_url}
                onChange={(e) => setClient({ ...client, website_url: e.target.value })}
                placeholder="https://"
              />
            </Field>
            <Field id="client-contact" label="Contact name">
              <input
                id="client-contact"
                className={inputClass}
                value={client.contact_name}
                onChange={(e) => setClient({ ...client, contact_name: e.target.value })}
                required
              />
            </Field>
            <Field id="client-email" label="Contact email">
              <input
                id="client-email"
                type="email"
                className={inputClass}
                value={client.contact_email}
                onChange={(e) => setClient({ ...client, contact_email: e.target.value })}
                required
              />
            </Field>
            <Field id="client-billing" label="Billing arrangement">
              <select
                id="client-billing"
                className={inputClass}
                value={client.billing_type}
                onChange={(e) => setClient({ ...client, billing_type: e.target.value })}
              >
                <option value="">Not set</option>
                {billingTypes.map((value) => (
                  <option key={value} value={value}>
                    {billingTypeLabels[value]}
                  </option>
                ))}
              </select>
            </Field>
            <Field id="client-notes" label="Internal notes (optional)">
              <input
                id="client-notes"
                className={inputClass}
                value={client.notes}
                onChange={(e) => setClient({ ...client, notes: e.target.value })}
              />
            </Field>
          </div>
        </section>
      ) : null}

      <section className={cardClass}>
        <h3 className="text-xl font-semibold text-white">Project</h3>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Field id="project-title" label="Title">
              <input
                id="project-title"
                className={inputClass}
                value={project.title}
                onChange={(e) => setProject({ ...project, title: e.target.value })}
                required
              />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field id="project-summary" label="Summary (the client sees this)">
              <textarea
                id="project-summary"
                rows={4}
                className={inputClass}
                value={project.summary}
                onChange={(e) => setProject({ ...project, summary: e.target.value })}
              />
            </Field>
          </div>
          <Field id="project-start" label="Start date">
            <input
              id="project-start"
              type="date"
              className={inputClass}
              value={project.start_date}
              onChange={(e) => setProject({ ...project, start_date: e.target.value })}
            />
          </Field>
          <Field id="project-target" label="Target date">
            <input
              id="project-target"
              type="date"
              className={inputClass}
              value={project.target_date}
              onChange={(e) => setProject({ ...project, target_date: e.target.value })}
            />
          </Field>
          <Field id="project-amount" label="Contract amount ($)">
            <input
              id="project-amount"
              type="number"
              min="0"
              step="0.01"
              className={inputClass}
              value={project.contract_amount}
              onChange={(e) => setProject({ ...project, contract_amount: e.target.value })}
            />
          </Field>
          <Field id="project-deposit" label="Deposit (%)">
            <input
              id="project-deposit"
              type="number"
              min="0"
              max="100"
              step="1"
              className={inputClass}
              value={project.deposit_percent}
              onChange={(e) => setProject({ ...project, deposit_percent: e.target.value })}
            />
          </Field>
        </div>
      </section>

      <section className={cardClass}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-xl font-semibold text-white">Milestones and tasks</h3>
          <button
            type="button"
            className={smallButton}
            onClick={() =>
              setMilestones((current) => [
                ...current,
                { key: newKey(), title: "", description: "", due_date: "", tasks: [] },
              ])
            }
          >
            + Milestone
          </button>
        </div>
        <p className="mt-2 text-sm text-text-secondary">
          Hidden tasks stay on your list but don&apos;t appear or count toward the
          client&apos;s progress bar.
        </p>
        <div className="mt-5 space-y-4">
          {milestones.length === 0 ? (
            <p className="text-sm text-text-secondary">No milestones yet.</p>
          ) : null}
          {milestones.map((milestone, index) => (
            <div
              key={milestone.key}
              className="rounded-3xl border border-penn-blue bg-rich-black/40 p-4"
            >
              <div className="grid gap-3 md:grid-cols-[1fr_180px_auto] md:items-end">
                <Field id={`m-title-${milestone.key}`} label={`Milestone ${index + 1}`}>
                  <input
                    id={`m-title-${milestone.key}`}
                    className={inputClass}
                    value={milestone.title}
                    onChange={(e) => updateMilestone(milestone.key, { title: e.target.value })}
                    required
                  />
                </Field>
                <Field id={`m-due-${milestone.key}`} label="Due">
                  <input
                    id={`m-due-${milestone.key}`}
                    type="date"
                    className={inputClass}
                    value={milestone.due_date}
                    onChange={(e) => updateMilestone(milestone.key, { due_date: e.target.value })}
                  />
                </Field>
                <button
                  type="button"
                  className={removeButton}
                  onClick={() =>
                    setMilestones((current) => current.filter((m) => m.key !== milestone.key))
                  }
                >
                  Remove
                </button>
              </div>

              <ul className="mt-4 space-y-2">
                {milestone.tasks.map((task) => (
                  <li key={task.key} className="flex flex-wrap items-center gap-2">
                    <label htmlFor={`t-${task.key}`} className="sr-only">
                      Task title
                    </label>
                    <input
                      id={`t-${task.key}`}
                      className={`${inputClass} min-w-0 flex-1 py-2`}
                      value={task.title}
                      onChange={(e) =>
                        updateTask(milestone.key, task.key, { title: e.target.value })
                      }
                      placeholder="Task"
                      required
                    />
                    <button
                      type="button"
                      className={smallButton}
                      aria-pressed={task.client_visible}
                      onClick={() =>
                        updateTask(milestone.key, task.key, {
                          client_visible: !task.client_visible,
                        })
                      }
                    >
                      {task.client_visible ? "Visible to client" : "Internal"}
                    </button>
                    <button
                      type="button"
                      className={removeButton}
                      aria-label={`Remove task ${task.title}`}
                      onClick={() =>
                        updateMilestone(milestone.key, {
                          tasks: milestone.tasks.filter((t) => t.key !== task.key),
                        })
                      }
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className={`${smallButton} mt-3`}
                onClick={() =>
                  updateMilestone(milestone.key, {
                    tasks: [
                      ...milestone.tasks,
                      { key: newKey(), title: "", client_visible: true },
                    ],
                  })
                }
              >
                + Task
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className={cardClass}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-xl font-semibold text-white">Needs from client</h3>
          <button
            type="button"
            className={smallButton}
            onClick={() =>
              setRequests((current) => [
                ...current,
                { key: newKey(), kind: "material", title: "", instructions: "", due_date: "" },
              ])
            }
          >
            + Request
          </button>
        </div>
        <p className="mt-2 text-sm text-text-secondary">
          Files, access, decisions, or info you need to start. Never ask for
          passwords; describe how to grant access instead.
        </p>
        <div className="mt-5 space-y-3">
          {requests.length === 0 ? (
            <p className="text-sm text-text-secondary">Nothing needed from the client.</p>
          ) : null}
          {requests.map((request) => (
            <div
              key={request.key}
              className="grid gap-3 rounded-3xl border border-penn-blue bg-rich-black/40 p-4 md:grid-cols-[160px_1fr_160px_auto] md:items-start"
            >
              <div>
                <label htmlFor={`r-kind-${request.key}`} className="sr-only">
                  Kind
                </label>
                <select
                  id={`r-kind-${request.key}`}
                  className={inputClass}
                  value={request.kind}
                  onChange={(e) =>
                    updateRequest(request.key, { kind: e.target.value as ProjectRequestKind })
                  }
                >
                  {projectRequestKinds.map((kind) => (
                    <option key={kind} value={kind}>
                      {projectRequestKindLabels[kind]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor={`r-title-${request.key}`} className="sr-only">
                  Request title
                </label>
                <input
                  id={`r-title-${request.key}`}
                  className={inputClass}
                  value={request.title}
                  onChange={(e) => updateRequest(request.key, { title: e.target.value })}
                  placeholder="e.g. Logo files"
                  required
                />
                <label htmlFor={`r-instr-${request.key}`} className="sr-only">
                  Instructions
                </label>
                <textarea
                  id={`r-instr-${request.key}`}
                  rows={2}
                  className={inputClass}
                  value={request.instructions}
                  onChange={(e) => updateRequest(request.key, { instructions: e.target.value })}
                  placeholder="Instructions the client will see"
                />
              </div>
              <div>
                <label htmlFor={`r-due-${request.key}`} className="sr-only">
                  Due date
                </label>
                <input
                  id={`r-due-${request.key}`}
                  type="date"
                  className={inputClass}
                  value={request.due_date}
                  onChange={(e) => updateRequest(request.key, { due_date: e.target.value })}
                />
              </div>
              <button
                type="button"
                className={removeButton}
                onClick={() =>
                  setRequests((current) => current.filter((r) => r.key !== request.key))
                }
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className={cardClass}>
        <Field id="out-of-scope" label="Out of scope (internal, one per line)">
          <textarea
            id="out-of-scope"
            rows={3}
            className={inputClass}
            value={outOfScope}
            onChange={(e) => setOutOfScope(e.target.value)}
            placeholder="e.g. E-commerce, ongoing content writing"
          />
        </Field>
        <p className="mt-2 text-xs text-text-secondary">
          Never shown to the client. Ticket triage uses it to flag likely change
          requests.
        </p>
      </section>

      {error ? (
        <p className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-4">
        {isNewClient ? (
          <label className="mr-auto flex items-center gap-3 text-sm text-text-primary">
            <input
              type="checkbox"
              checked={invite}
              onChange={(e) => setInvite(e.target.checked)}
              className="h-4 w-4"
            />
            Invite the client to the portal now
          </label>
        ) : null}
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-penn-blue px-5 py-3 font-semibold text-text-primary transition hover:border-blue-ncs"
          >
            Discard
          </button>
        ) : null}
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-blue-ncs px-5 py-3 font-semibold text-white transition hover:bg-lapis-lazuli disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting
            ? "Creating..."
            : submitLabel || (isNewClient ? "Create client and project" : "Create project")}
        </button>
      </div>
    </form>
  );
}
