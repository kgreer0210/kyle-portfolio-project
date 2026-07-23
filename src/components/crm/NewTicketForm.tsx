"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import TicketAssistPanel, {
  type AssistSummary,
} from "@/components/crm/TicketAssistPanel";
import {
  formatFileSize,
  maxTicketAttachmentBytes,
  maxTicketAttachmentsPerSubmission,
  ticketCategories,
  ticketCategoryLabels,
  ticketPriorities,
  ticketPriorityLabels,
  validateAttachmentSelection,
} from "@/lib/crm";

const MAX_DESCRIPTION_LENGTH = 5000;

export default function NewTicketForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleApplySummary(summary: AssistSummary) {
    if (summary.title && !title.trim()) {
      setTitle(summary.title.slice(0, 200));
    }

    setDescription((prev) => {
      const combined = prev.trim()
        ? `${prev.trim()}\n\n${summary.description}`
        : summary.description;
      return combined.slice(0, MAX_DESCRIPTION_LENGTH);
    });
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
      const response = await fetch("/api/crm/tickets", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as {
        error?: string;
        ticketId?: string;
      };

      if (!response.ok || !payload.ticketId) {
        throw new Error(payload.error || "Unable to create ticket.");
      }

      formRef.current?.reset();
      setTitle("");
      setDescription("");
      router.push(`/portal/tickets/${payload.ticketId}`);
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to create ticket.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 md:grid-cols-[200px_1fr]">
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary">Type</label>
          <select
            name="type"
            className="w-full rounded-2xl border border-penn-blue bg-rich-black px-4 py-3"
            defaultValue="request"
          >
            <option value="request">Request</option>
            <option value="issue">Issue</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary">Title</label>
          <input
            name="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full rounded-2xl border border-penn-blue bg-rich-black px-4 py-3"
            required
          />
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary">
            Priority
          </label>
          <select
            name="priority"
            className="w-full rounded-2xl border border-penn-blue bg-rich-black px-4 py-3"
            defaultValue="normal"
          >
            {ticketPriorities.map((value) => (
              <option key={value} value={value}>
                {ticketPriorityLabels[value]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary">
            Category
          </label>
          <select
            name="category"
            className="w-full rounded-2xl border border-penn-blue bg-rich-black px-4 py-3"
            defaultValue=""
          >
            <option value="">General</option>
            {ticketCategories.map((value) => (
              <option key={value} value={value}>
                {ticketCategoryLabels[value]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <TicketAssistPanel
        draftTitle={title}
        draftDescription={description}
        onApplySummary={handleApplySummary}
      />

      <div className="space-y-2">
        <label className="text-sm font-medium text-text-primary">
          Description
        </label>
        <textarea
          name="description"
          rows={5}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={MAX_DESCRIPTION_LENGTH}
          className="w-full rounded-2xl border border-penn-blue bg-rich-black px-4 py-3"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-text-primary">
          Attachments
        </label>
        <input
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
        disabled={isSubmitting}
        className="rounded-full bg-blue-ncs px-5 py-3 font-semibold text-white transition hover:bg-lapis-lazuli disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Creating..." : "Create ticket"}
      </button>
    </form>
  );
}
