"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ProgressBar, formatDueDate } from "@/components/crm/ProjectProgress";
import {
  computeProgress,
  groupMilestones,
  isRequestOverdue,
  projectRequestKindLabels,
  projectRequestKinds,
  projectRequestStatusLabels,
  projectStatusLabels,
  projectStatuses,
} from "@/lib/projects";
import type {
  Project,
  ProjectMilestone,
  ProjectRequest,
  ProjectRequestKind,
  ProjectRequestStatus,
  ProjectStatus,
  ProjectTask,
} from "@/types/crm";

const inputClass =
  "w-full rounded-2xl border border-penn-blue bg-rich-black px-4 py-2.5 text-sm";
const cardClass = "rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-6";
const smallButton =
  "rounded-full border border-penn-blue px-3 py-1.5 text-xs font-semibold text-text-primary transition hover:border-blue-ncs disabled:opacity-60";
const primarySmall =
  "rounded-full bg-blue-ncs px-4 py-2 text-sm font-semibold text-white transition hover:bg-lapis-lazuli disabled:opacity-60";
const ghostButton =
  "rounded-full px-2 py-1 text-xs text-text-secondary transition hover:text-red-300 disabled:opacity-60";

export interface ProjectEditorProps {
  project: Project;
  milestones: ProjectMilestone[];
  tasks: ProjectTask[];
  requests: ProjectRequest[];
  today: string;
  sowFileUrl: string | null;
  sowFileName: string | null;
  outOfScope: string[];
}

export default function ProjectEditor({
  project,
  milestones,
  tasks,
  requests,
  today,
  sowFileUrl,
  sowFileName,
  outOfScope,
}: ProjectEditorProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [editingDetails, setEditingDetails] = useState(false);

  const base = `/api/admin/projects/${project.id}`;
  const progress = computeProgress(tasks);
  const internalCount = tasks.filter((task) => !task.client_visible).length;
  const grouped = groupMilestones(milestones, tasks);

  async function call(url: string, init: RequestInit) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(url, {
        ...init,
        headers: { "Content-Type": "application/json" },
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Something went wrong.");
      }
      router.refresh();
      return true;
    } catch (callError) {
      setError(callError instanceof Error ? callError.message : "Something went wrong.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  const patchProject = (body: Record<string, unknown>) =>
    call(base, { method: "PATCH", body: JSON.stringify(body) });
  const addItem = (body: Record<string, unknown>) =>
    call(`${base}/items`, { method: "POST", body: JSON.stringify(body) });
  const patchItem = (id: string, body: Record<string, unknown>) =>
    call(`${base}/items/${id}`, { method: "PATCH", body: JSON.stringify(body) });
  const deleteItem = (id: string, type: string) =>
    call(`${base}/items/${id}?type=${type}`, { method: "DELETE" });

  async function handleDeleteProject() {
    if (
      !window.confirm(
        `Delete "${project.title}" and all its milestones, tasks, and requests? Tickets are kept.`,
      )
    ) {
      return;
    }
    const ok = await call(base, { method: "DELETE" });
    if (ok) {
      router.push(`/admin/clients/${project.organization_id}`);
    }
  }

  function handleDetailsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    void patchProject({
      title: String(form.get("title") || ""),
      summary: String(form.get("summary") || ""),
      start_date: String(form.get("start_date") || ""),
      target_date: String(form.get("target_date") || ""),
      contract_amount: String(form.get("contract_amount") || ""),
      deposit_percent: String(form.get("deposit_percent") || ""),
    }).then((ok) => ok && setEditingDetails(false));
  }

  function renderTask(task: ProjectTask) {
    return (
      <li key={task.id} className="flex flex-wrap items-center gap-2 py-1.5">
        <input
          type="checkbox"
          checked={Boolean(task.done_at)}
          disabled={busy}
          onChange={(e) => void patchItem(task.id, { type: "task", done: e.target.checked })}
          className="h-4 w-4"
          aria-label={`Mark "${task.title}" ${task.done_at ? "not done" : "done"}`}
        />
        <span
          className={`min-w-0 flex-1 text-sm ${
            task.done_at ? "text-text-secondary line-through" : "text-text-primary"
          }`}
        >
          {task.title}
        </span>
        <button
          type="button"
          className={smallButton}
          disabled={busy}
          aria-pressed={task.client_visible}
          onClick={() =>
            void patchItem(task.id, { type: "task", client_visible: !task.client_visible })
          }
        >
          {task.client_visible ? "Visible" : "Internal"}
        </button>
        <button
          type="button"
          className={ghostButton}
          disabled={busy}
          onClick={() => void deleteItem(task.id, "task")}
          aria-label={`Delete task ${task.title}`}
        >
          ✕
        </button>
      </li>
    );
  }

  function renderAddTaskForm(milestoneId: string | null) {
    return (
      <form
        className="mt-2 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const formElement = event.currentTarget;
          const title = String(new FormData(formElement).get("title") || "").trim();
          if (!title) return;
          void addItem({ type: "task", title, milestone_id: milestoneId }).then(
            (ok) => ok && formElement.reset(),
          );
        }}
      >
        <label htmlFor={`add-task-${milestoneId ?? "none"}`} className="sr-only">
          New task
        </label>
        <input
          id={`add-task-${milestoneId ?? "none"}`}
          name="title"
          placeholder="Add a task"
          className={`${inputClass} py-2`}
        />
        <button type="submit" className={smallButton} disabled={busy}>
          Add
        </button>
      </form>
    );
  }

  return (
    <div className="space-y-6">
      <section className={`${cardClass} md:p-8`}>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.2em] text-blue-ncs">Project</p>
            <h2 className="mt-2 text-3xl font-semibold text-white">{project.title}</h2>
            <p className="mt-2 text-sm text-text-secondary">
              {[
                project.start_date ? `Start ${formatDueDate(project.start_date)}` : null,
                project.target_date ? `Target ${formatDueDate(project.target_date)}` : null,
                project.contract_amount != null
                  ? `$${Number(project.contract_amount).toLocaleString("en-US")}`
                  : null,
                project.deposit_percent != null ? `${project.deposit_percent}% deposit` : null,
              ]
                .filter(Boolean)
                .join(" · ") || "No dates or amounts set"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="project-status" className="sr-only">
              Project status
            </label>
            <select
              id="project-status"
              value={project.status}
              disabled={busy}
              onChange={(e) => void patchProject({ status: e.target.value as ProjectStatus })}
              className="rounded-full border border-penn-blue bg-rich-black px-4 py-2 text-sm"
            >
              {projectStatuses.map((status) => (
                <option key={status} value={status}>
                  {projectStatusLabels[status]}
                </option>
              ))}
            </select>
            <button
              type="button"
              className={smallButton}
              onClick={() => setEditingDetails((value) => !value)}
            >
              {editingDetails ? "Close" : "Edit details"}
            </button>
          </div>
        </div>

        <div className="mt-6">
          <ProgressBar progress={progress} />
          <p className="mt-2 text-xs text-text-secondary">
            {progress
              ? `${progress.done} of ${progress.total} client-visible tasks done`
              : "No client-visible tasks yet"}
            {internalCount > 0 ? ` · ${internalCount} internal` : ""}
          </p>
        </div>

        {editingDetails ? (
          <form onSubmit={handleDetailsSubmit} className="mt-6 grid gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <label htmlFor="edit-title" className="text-sm text-text-primary">Title</label>
              <input id="edit-title" name="title" defaultValue={project.title} className={inputClass} required />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="edit-summary" className="text-sm text-text-primary">
                Summary (client-facing)
              </label>
              <textarea
                id="edit-summary"
                name="summary"
                rows={4}
                defaultValue={project.summary || ""}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="edit-start" className="text-sm text-text-primary">Start date</label>
              <input id="edit-start" name="start_date" type="date" defaultValue={project.start_date || ""} className={inputClass} />
            </div>
            <div>
              <label htmlFor="edit-target" className="text-sm text-text-primary">Target date</label>
              <input id="edit-target" name="target_date" type="date" defaultValue={project.target_date || ""} className={inputClass} />
            </div>
            <div>
              <label htmlFor="edit-amount" className="text-sm text-text-primary">Contract amount ($)</label>
              <input id="edit-amount" name="contract_amount" type="number" min="0" step="0.01" defaultValue={project.contract_amount ?? ""} className={inputClass} />
            </div>
            <div>
              <label htmlFor="edit-deposit" className="text-sm text-text-primary">Deposit (%)</label>
              <input id="edit-deposit" name="deposit_percent" type="number" min="0" max="100" defaultValue={project.deposit_percent ?? ""} className={inputClass} />
            </div>
            <div className="flex flex-wrap items-center gap-3 md:col-span-2">
              <button type="submit" className={primarySmall} disabled={busy}>
                Save details
              </button>
              <button
                type="button"
                onClick={() => void handleDeleteProject()}
                className="ml-auto text-sm text-red-300 transition hover:text-red-200"
                disabled={busy}
              >
                Delete project
              </button>
            </div>
          </form>
        ) : project.summary ? (
          <p className="mt-5 max-w-3xl whitespace-pre-wrap text-sm leading-7 text-text-secondary">
            {project.summary}
          </p>
        ) : null}
      </section>

      {error ? (
        <p className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200" role="alert">
          {error}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className={cardClass}>
          <h3 className="text-xl font-semibold text-white">Milestones and tasks</h3>
          <div className="mt-5 space-y-4">
            {grouped.milestones.map((milestone) => {
              const doneCount = milestone.tasks.filter((t) => t.done_at).length;
              return (
                <div
                  key={milestone.id}
                  className="rounded-3xl border border-penn-blue bg-rich-black/40 p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span aria-hidden="true" className="text-sm text-text-secondary">
                      {milestone.state === "done" ? "✓" : milestone.state === "current" ? "▸" : "○"}
                    </span>
                    <p className="min-w-0 flex-1 font-semibold text-white">
                      {milestone.title}{" "}
                      <span className="text-sm font-normal text-text-secondary">
                        ({doneCount}/{milestone.tasks.length})
                      </span>
                    </p>
                    <label htmlFor={`due-${milestone.id}`} className="sr-only">
                      Due date for {milestone.title}
                    </label>
                    <input
                      id={`due-${milestone.id}`}
                      type="date"
                      defaultValue={milestone.due_date || ""}
                      disabled={busy}
                      onBlur={(e) => {
                        if ((e.target.value || null) !== milestone.due_date) {
                          void patchItem(milestone.id, {
                            type: "milestone",
                            due_date: e.target.value || null,
                          });
                        }
                      }}
                      className="rounded-full border border-penn-blue bg-rich-black px-3 py-1 text-xs"
                    />
                    <button
                      type="button"
                      className={ghostButton}
                      disabled={busy}
                      onClick={() => {
                        if (
                          window.confirm(`Delete milestone "${milestone.title}" and its tasks?`)
                        ) {
                          void deleteItem(milestone.id, "milestone");
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                  <ul className="mt-2">{milestone.tasks.map(renderTask)}</ul>
                  {renderAddTaskForm(milestone.id)}
                </div>
              );
            })}

            {grouped.unassigned.length > 0 ? (
              <div className="rounded-3xl border border-penn-blue bg-rich-black/40 p-4">
                <p className="font-semibold text-white">Other tasks</p>
                <ul className="mt-2">{grouped.unassigned.map(renderTask)}</ul>
                {renderAddTaskForm(null)}
              </div>
            ) : null}

            <form
              className="flex flex-wrap gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                const formElement = event.currentTarget;
                const form = new FormData(formElement);
                const title = String(form.get("title") || "").trim();
                if (!title) return;
                void addItem({
                  type: "milestone",
                  title,
                  due_date: String(form.get("due_date") || "") || null,
                }).then((ok) => ok && formElement.reset());
              }}
            >
              <label htmlFor="new-milestone" className="sr-only">New milestone</label>
              <input id="new-milestone" name="title" placeholder="New milestone" className={`${inputClass} min-w-0 flex-1`} />
              <label htmlFor="new-milestone-due" className="sr-only">Due date</label>
              <input id="new-milestone-due" name="due_date" type="date" className={`${inputClass} w-auto`} />
              <button type="submit" className={smallButton} disabled={busy}>
                + Milestone
              </button>
            </form>
          </div>
        </section>

        <div className="space-y-6">
          <section className={cardClass}>
            <h3 className="text-xl font-semibold text-white">Needs from client</h3>
            <ul className="mt-5 space-y-3">
              {requests.length === 0 ? (
                <li className="text-sm text-text-secondary">Nothing requested.</li>
              ) : null}
              {requests.map((item) => {
                const overdue = isRequestOverdue(item, today);
                return (
                  <li
                    key={item.id}
                    className={`rounded-3xl border bg-rich-black/40 p-4 ${
                      overdue ? "border-amber-500/40" : "border-penn-blue"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">
                          {projectRequestKindLabels[item.kind]}
                          {item.due_date
                            ? ` · ${overdue ? "overdue " : "due "}${formatDueDate(item.due_date)}`
                            : ""}
                        </p>
                        <p className="mt-1 font-semibold text-white">{item.title}</p>
                      </div>
                      <label htmlFor={`req-status-${item.id}`} className="sr-only">
                        Status for {item.title}
                      </label>
                      <select
                        id={`req-status-${item.id}`}
                        value={item.status}
                        disabled={busy}
                        onChange={(e) =>
                          void patchItem(item.id, {
                            type: "request",
                            status: e.target.value as ProjectRequestStatus,
                          })
                        }
                        className="rounded-full border border-penn-blue bg-rich-black px-3 py-1 text-xs"
                      >
                        {(["open", "later", "done"] as const).map((status) => (
                          <option key={status} value={status}>
                            {projectRequestStatusLabels[status]}
                          </option>
                        ))}
                      </select>
                    </div>
                    {item.instructions ? (
                      <p className="mt-2 whitespace-pre-wrap text-sm text-text-secondary">
                        {item.instructions}
                      </p>
                    ) : null}
                    {item.client_note ? (
                      <p className="mt-2 text-sm text-text-primary">
                        <span className="text-text-secondary">Client note:</span> {item.client_note}
                      </p>
                    ) : null}
                    <div className="mt-3 flex items-center gap-3">
                      {item.ticket_id ? (
                        <Link
                          href={`/admin/tickets/${item.ticket_id}`}
                          className="text-sm font-medium text-blue-ncs transition hover:text-white"
                        >
                          Files and conversation
                        </Link>
                      ) : null}
                      <button
                        type="button"
                        className={`${ghostButton} ml-auto`}
                        disabled={busy}
                        onClick={() => void deleteItem(item.id, "request")}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>

            <form
              className="mt-5 space-y-2 border-t border-penn-blue pt-5"
              onSubmit={(event) => {
                event.preventDefault();
                const formElement = event.currentTarget;
                const form = new FormData(formElement);
                const title = String(form.get("title") || "").trim();
                if (!title) return;
                void addItem({
                  type: "request",
                  kind: String(form.get("kind") || "material") as ProjectRequestKind,
                  title,
                  instructions: String(form.get("instructions") || ""),
                  due_date: String(form.get("due_date") || "") || null,
                }).then((ok) => ok && formElement.reset());
              }}
            >
              <p className="text-sm font-medium text-text-primary">Add a request</p>
              <div className="flex gap-2">
                <label htmlFor="new-request-kind" className="sr-only">Kind</label>
                <select id="new-request-kind" name="kind" className={`${inputClass} w-auto`}>
                  {projectRequestKinds.map((kind) => (
                    <option key={kind} value={kind}>
                      {projectRequestKindLabels[kind]}
                    </option>
                  ))}
                </select>
                <label htmlFor="new-request-due" className="sr-only">Due date</label>
                <input id="new-request-due" name="due_date" type="date" className={`${inputClass} w-auto`} />
              </div>
              <label htmlFor="new-request-title" className="sr-only">Title</label>
              <input id="new-request-title" name="title" placeholder="e.g. Photos of your team" className={inputClass} />
              <label htmlFor="new-request-instructions" className="sr-only">Instructions</label>
              <textarea
                id="new-request-instructions"
                name="instructions"
                rows={2}
                placeholder="Instructions the client will see"
                className={inputClass}
              />
              <button type="submit" className={smallButton} disabled={busy}>
                + Request
              </button>
            </form>
          </section>

          <section className={cardClass}>
            <h3 className="text-xl font-semibold text-white">Scope (internal)</h3>
            {sowFileName ? (
              <p className="mt-3 text-sm">
                {sowFileUrl ? (
                  <a
                    href={sowFileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-blue-ncs transition hover:text-white"
                  >
                    {sowFileName} ↗
                  </a>
                ) : (
                  <span className="text-text-secondary">{sowFileName}</span>
                )}
              </p>
            ) : null}
            {outOfScope.length > 0 ? (
              <>
                <p className="mt-3 text-sm text-text-secondary">Out of scope:</p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-text-primary">
                  {outOfScope.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="mt-3 text-sm text-text-secondary">No out-of-scope notes.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
