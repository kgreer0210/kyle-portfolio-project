"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OrgNoteDeleteButton({
  organizationId,
  noteId,
}: {
  organizationId: string;
  noteId: string;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    if (!window.confirm("Delete this note?")) {
      return;
    }

    setIsDeleting(true);
    setError("");

    try {
      const response = await fetch(
        `/api/admin/organizations/${organizationId}/notes/${noteId}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || "Unable to delete the note.");
      }

      router.refresh();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete the note.",
      );
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleDelete}
        disabled={isDeleting}
        className="text-xs font-semibold uppercase tracking-[0.18em] text-text-secondary transition hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isDeleting ? "Deleting..." : "Delete"}
      </button>
      {error ? <p className="text-xs text-red-300">{error}</p> : null}
    </div>
  );
}
