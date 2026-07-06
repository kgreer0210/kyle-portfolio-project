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

  async function handleDelete() {
    if (!window.confirm("Delete this note?")) {
      return;
    }

    setIsDeleting(true);

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
    } catch {
      setIsDeleting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isDeleting}
      className="text-xs font-semibold uppercase tracking-[0.18em] text-text-secondary transition hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isDeleting ? "Deleting..." : "Delete"}
    </button>
  );
}
