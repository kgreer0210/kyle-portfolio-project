"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  formatFileSize,
  maxTicketAttachmentBytes,
  maxTicketAttachmentsPerSubmission,
  validateAttachmentSelection,
} from "@/lib/crm";
import { readTextStream } from "@/lib/readTextStream";

interface TicketReplyFormProps {
  ticketId: string;
  allowInternalNote?: boolean;
  /** Admin only: show "Draft with AI". */
  allowAiDraft?: boolean;
}

export default function TicketReplyForm({
  ticketId,
  allowInternalNote = false,
  allowAiDraft = false,
}: TicketReplyFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [body, setBody] = useState("");
  const [instructions, setInstructions] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);

  async function handleDraft() {
    if (body.trim() && !window.confirm("Replace the current message with an AI draft?")) {
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setError("");
    setIsDrafting(true);
    setBody("");

    try {
      const response = await fetch(`/api/admin/tickets/${ticketId}/draft-reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instructions: instructions.trim() || null }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error || "Couldn't draft a reply.");
      }

      const draft = await readTextStream(response, setBody);
      setBody(draft.trim());
    } catch (draftError) {
      if (controller.signal.aborted) return;
      setError(draftError instanceof Error ? draftError.message : "Couldn't draft a reply.");
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
        setIsDrafting(false);
      }
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);
    const selectedFiles = formData
      .getAll("attachments")
      .filter(
        (entry): entry is File => entry instanceof File && entry.size > 0,
      );
    const fileError = validateAttachmentSelection(selectedFiles);

    if (fileError) {
      setError(fileError);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/crm/tickets/${ticketId}/messages`, {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "Unable to send reply.");
      }

      formRef.current?.reset();
      setBody("");
      setInstructions("");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to send reply.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      {allowInternalNote ? (
        <div className="space-y-2">
          <label
            htmlFor={`reply-visibility-${ticketId}`}
            className="text-sm font-medium text-text-primary"
          >
            Visibility
          </label>
          <select
            id={`reply-visibility-${ticketId}`}
            name="visibility"
            defaultValue="public"
            className="w-full rounded-2xl border border-penn-blue bg-rich-black px-4 py-3"
          >
            <option value="public">Public reply</option>
            <option value="internal">Internal note</option>
          </select>
        </div>
      ) : null}

      {allowAiDraft ? (
        <div className="space-y-2 rounded-3xl border border-penn-blue bg-rich-black/40 p-4">
          <label
            htmlFor={`reply-instructions-${ticketId}`}
            className="text-sm font-medium text-text-primary"
          >
            Draft with AI
          </label>
          <input
            id={`reply-instructions-${ticketId}`}
            value={instructions}
            onChange={(event) => setInstructions(event.target.value)}
            maxLength={1000}
            placeholder="Optional steer, e.g. “fixed and deployed, ask them to confirm”"
            className="w-full rounded-2xl border border-penn-blue bg-rich-black px-4 py-2.5 text-sm"
          />
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void handleDraft()}
              disabled={isDrafting || isSubmitting}
              className="rounded-full border border-penn-blue px-4 py-2 text-sm font-semibold text-text-primary transition hover:border-blue-ncs disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDrafting ? "Drafting..." : "Draft reply"}
            </button>
            <p className="text-xs text-text-secondary">
              Uses the thread, internal notes, and project scope. Review before sending.
            </p>
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        <label
          htmlFor={`reply-body-${ticketId}`}
          className="text-sm font-medium text-text-primary"
        >
          Message
        </label>
        <textarea
          id={`reply-body-${ticketId}`}
          name="body"
          rows={allowAiDraft ? 7 : 5}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          maxLength={5000}
          readOnly={isDrafting}
          className="w-full rounded-2xl border border-penn-blue bg-rich-black px-4 py-3"
          required
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor={`reply-attachments-${ticketId}`}
          className="text-sm font-medium text-text-primary"
        >
          Attachments
        </label>
        <input
          id={`reply-attachments-${ticketId}`}
          name="attachments"
          type="file"
          multiple
          className="w-full rounded-2xl border border-dashed border-penn-blue bg-rich-black px-4 py-3"
        />
        <p className="text-xs text-text-secondary">
          Up to {maxTicketAttachmentsPerSubmission} files,{" "}
          {formatFileSize(maxTicketAttachmentBytes)} each.
        </p>
      </div>

      {error ? (
        <p className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting || isDrafting}
        className="rounded-full bg-blue-ncs px-5 py-3 font-semibold text-white transition hover:bg-lapis-lazuli disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Sending..." : "Send reply"}
      </button>
    </form>
  );
}
