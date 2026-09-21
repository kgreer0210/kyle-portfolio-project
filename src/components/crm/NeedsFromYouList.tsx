"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDueDate } from "@/components/crm/ProjectProgress";
import {
  formatFileSize,
  maxTicketAttachmentBytes,
  maxTicketAttachmentsPerSubmission,
  validateAttachmentSelection,
} from "@/lib/crm";
import {
  isRequestOverdue,
  projectRequestKindLabels,
  projectRequestStatusLabels,
  type ClientRequestAction,
} from "@/lib/projects";
import type { ProjectRequest } from "@/types/crm";

type Panel = "upload" | "help" | null;

const primaryButton =
  "rounded-full bg-blue-ncs px-4 py-2 text-sm font-semibold text-white transition hover:bg-lapis-lazuli disabled:cursor-not-allowed disabled:opacity-60";
const secondaryButton =
  "rounded-full border border-penn-blue px-4 py-2 text-sm font-semibold text-text-primary transition hover:border-blue-ncs disabled:cursor-not-allowed disabled:opacity-60";

function RequestItem({
  item,
  today,
}: {
  item: ProjectRequest;
  today: string;
}) {
  const router = useRouter();
  const [panel, setPanel] = useState<Panel>(null);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const overdue = isRequestOverdue(item, today);
  const due = formatDueDate(item.due_date);
  const isMaterial = item.kind === "material";

  async function send(action: ClientRequestAction, formData = new FormData()) {
    setError("");
    setIsSaving(true);
    formData.set("action", action);

    try {
      const response = await fetch(`/api/crm/projects/requests/${item.id}`, {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Unable to save.");
      }
      setPanel(null);
      router.refresh();
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Unable to save.");
    } finally {
      setIsSaving(false);
    }
  }

  function handlePanelSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    if (panel === "upload") {
      const files = formData
        .getAll("attachments")
        .filter((entry): entry is File => entry instanceof File && entry.size > 0);
      if (files.length === 0) {
        setError("Choose at least one file.");
        return;
      }
      const fileError = validateAttachmentSelection(files);
      if (fileError) {
        setError(fileError);
        return;
      }
    }

    void send(panel === "upload" ? "upload" : "help", formData);
  }

  return (
    <li
      className={`rounded-3xl border bg-rich-black/40 p-4 ${
        overdue ? "border-amber-500/40" : "border-penn-blue"
      }`}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">
            {projectRequestKindLabels[item.kind]}
          </p>
          <p className="mt-1 font-semibold text-white">{item.title}</p>
          {item.instructions ? (
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-text-secondary">
              {item.instructions}
            </p>
          ) : null}
        </div>
        <div className="shrink-0 text-sm">
          {item.status === "later" ? (
            <span className="text-text-secondary">
              {projectRequestStatusLabels.later}
            </span>
          ) : due ? (
            <span className={overdue ? "text-amber-200" : "text-text-secondary"}>
              {overdue ? "Overdue · " : "Due "}
              {due}
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {isMaterial ? (
          <button
            type="button"
            className={primaryButton}
            disabled={isSaving}
            onClick={() => setPanel(panel === "upload" ? null : "upload")}
            aria-expanded={panel === "upload"}
          >
            Upload files
          </button>
        ) : (
          <button
            type="button"
            className={primaryButton}
            disabled={isSaving}
            onClick={() => void send("done")}
          >
            Done
          </button>
        )}
        {item.status !== "later" ? (
          <button
            type="button"
            className={secondaryButton}
            disabled={isSaving}
            onClick={() => void send("later")}
          >
            I&apos;ll send it later
          </button>
        ) : null}
        <button
          type="button"
          className={secondaryButton}
          disabled={isSaving}
          onClick={() => setPanel(panel === "help" ? null : "help")}
          aria-expanded={panel === "help"}
        >
          Help me with this
        </button>
        {item.ticket_id ? (
          <Link
            href={`/portal/tickets/${item.ticket_id}`}
            className="self-center px-2 text-sm font-medium text-blue-ncs transition hover:text-white"
          >
            View conversation
          </Link>
        ) : null}
      </div>

      {panel ? (
        <form onSubmit={handlePanelSubmit} className="mt-4 space-y-3">
          {panel === "upload" ? (
            <div className="space-y-2">
              <label
                htmlFor={`files-${item.id}`}
                className="text-sm font-medium text-text-primary"
              >
                Files
              </label>
              <input
                id={`files-${item.id}`}
                name="attachments"
                type="file"
                multiple
                className="w-full rounded-2xl border border-dashed border-penn-blue bg-rich-black px-4 py-3 text-sm"
              />
              <p className="text-xs text-text-secondary">
                Up to {maxTicketAttachmentsPerSubmission} files,{" "}
                {formatFileSize(maxTicketAttachmentBytes)} each. Have a
                Drive or Dropbox link instead? Paste it in the note.
              </p>
            </div>
          ) : null}
          <div className="space-y-2">
            <label
              htmlFor={`note-${item.id}`}
              className="text-sm font-medium text-text-primary"
            >
              {panel === "help" ? "What do you need help with?" : "Note (optional)"}
            </label>
            <textarea
              id={`note-${item.id}`}
              name="note"
              rows={3}
              maxLength={2000}
              required={panel === "help"}
              className="w-full rounded-2xl border border-penn-blue bg-rich-black px-4 py-3 text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="submit" className={primaryButton} disabled={isSaving}>
              {isSaving ? "Sending..." : panel === "upload" ? "Send files" : "Ask Kyle"}
            </button>
            <button
              type="button"
              className={secondaryButton}
              disabled={isSaving}
              onClick={() => setPanel(null)}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {error ? (
        <p className="mt-3 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}
    </li>
  );
}

export default function NeedsFromYouList({
  requests,
  today,
}: {
  requests: ProjectRequest[];
  today: string;
}) {
  const router = useRouter();
  const [reopeningId, setReopeningId] = useState<string | null>(null);
  const pending = requests.filter((item) => item.status !== "done");
  const completed = requests.filter((item) => item.status === "done");

  async function reopen(id: string) {
    setReopeningId(id);
    const formData = new FormData();
    formData.set("action", "reopen");
    await fetch(`/api/crm/projects/requests/${id}`, {
      method: "POST",
      body: formData,
    }).catch(() => undefined);
    setReopeningId(null);
    router.refresh();
  }

  return (
    <div>
      {pending.length === 0 ? (
        <p className="text-sm leading-7 text-text-secondary">
          Nothing needed from you right now. Thanks!
        </p>
      ) : (
        <ul className="space-y-3">
          {pending.map((item) => (
            <RequestItem key={item.id} item={item} today={today} />
          ))}
        </ul>
      )}

      {completed.length > 0 ? (
        <details className="mt-5">
          <summary className="cursor-pointer text-sm font-medium text-text-secondary transition hover:text-white">
            Completed ({completed.length})
          </summary>
          <ul className="mt-3 space-y-2">
            {completed.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-penn-blue bg-rich-black/30 px-4 py-3 text-sm"
              >
                <span className="text-text-secondary">
                  <span aria-hidden="true" className="mr-2 text-emerald-300">
                    ✓
                  </span>
                  {item.title}
                </span>
                <button
                  type="button"
                  onClick={() => void reopen(item.id)}
                  disabled={reopeningId === item.id}
                  className="text-xs font-medium text-blue-ncs transition hover:text-white disabled:opacity-60"
                >
                  Undo
                </button>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
