"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface TicketReplyFormProps {
  ticketId: string;
  allowInternalNote?: boolean;
}

export default function TicketReplyForm({
  ticketId,
  allowInternalNote = false,
}: TicketReplyFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const formData = new FormData(event.currentTarget);
      const response = await fetch(`/api/crm/tickets/${ticketId}/messages`, {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "Unable to send reply.");
      }

      formRef.current?.reset();
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
          <label className="text-sm font-medium text-text-primary">
            Visibility
          </label>
          <select
            name="visibility"
            defaultValue="public"
            className="w-full rounded-2xl border border-penn-blue bg-rich-black px-4 py-3"
          >
            <option value="public">Public reply</option>
            <option value="internal">Internal note</option>
          </select>
        </div>
      ) : null}

      <div className="space-y-2">
        <label className="text-sm font-medium text-text-primary">Message</label>
        <textarea
          name="body"
          rows={5}
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
        {isSubmitting ? "Sending..." : "Send reply"}
      </button>
    </form>
  );
}
