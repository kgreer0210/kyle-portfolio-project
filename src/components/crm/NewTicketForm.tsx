"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function NewTicketForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const formData = new FormData(event.currentTarget);
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
            className="w-full rounded-2xl border border-penn-blue bg-rich-black px-4 py-3"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-text-primary">
          Description
        </label>
        <textarea
          name="description"
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
        {isSubmitting ? "Creating..." : "Create ticket"}
      </button>
    </form>
  );
}
