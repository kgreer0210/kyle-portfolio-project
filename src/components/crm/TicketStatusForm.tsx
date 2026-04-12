"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { TicketStatus } from "@/types/crm";

const statuses: TicketStatus[] = [
  "new",
  "open",
  "waiting_on_client",
  "in_progress",
  "resolved",
  "closed",
];

export default function TicketStatusForm({
  ticketId,
  currentStatus,
}: {
  ticketId: string;
  currentStatus: TicketStatus;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<TicketStatus>(currentStatus);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/tickets/${ticketId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "Unable to update ticket status.");
      }

      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to update ticket status.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-text-primary">Status</label>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as TicketStatus)}
          className="w-full rounded-2xl border border-penn-blue bg-rich-black px-4 py-3"
        >
          {statuses.map((value) => (
            <option key={value} value={value}>
              {value.replaceAll("_", " ")}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <p className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-full border border-penn-blue px-5 py-3 font-semibold text-text-primary transition hover:border-blue-ncs disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Updating..." : "Update status"}
      </button>
    </form>
  );
}
