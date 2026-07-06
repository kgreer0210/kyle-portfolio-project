"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function OrgNoteForm({
  organizationId,
}: {
  organizationId: string;
}) {
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
      const body = String(formData.get("body") || "").trim();
      const response = await fetch(
        `/api/admin/organizations/${organizationId}/notes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ body }),
        },
      );

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "Unable to save the note.");
      }

      formRef.current?.reset();
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to save the note.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-text-primary">
          Add a private note
        </label>
        <textarea
          name="body"
          rows={3}
          placeholder="Only you can see these notes."
          className="w-full rounded-2xl border border-penn-blue bg-rich-black px-4 py-3"
          required
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
        {isSubmitting ? "Saving..." : "Save note"}
      </button>
    </form>
  );
}
