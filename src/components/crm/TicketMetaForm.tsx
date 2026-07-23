"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { TicketCategory, TicketPriority } from "@/types/crm";
import {
  ticketCategories,
  ticketCategoryLabels,
  ticketPriorities,
  ticketPriorityLabels,
} from "@/lib/crm";

export default function TicketMetaForm({
  ticketId,
  currentPriority,
  currentCategory,
  currentCost,
}: {
  ticketId: string;
  currentPriority: TicketPriority;
  currentCategory: TicketCategory | null;
  currentCost?: number | null;
}) {
  const router = useRouter();
  const [priority, setPriority] = useState<TicketPriority>(currentPriority);
  const [category, setCategory] = useState<string>(currentCategory || "");
  const [cost, setCost] = useState<string>(
    currentCost !== null && currentCost !== undefined ? String(currentCost) : "",
  );
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const trimmedCost = cost.trim();

      if (trimmedCost && !Number.isFinite(Number(trimmedCost))) {
        throw new Error("Cost must be a number.");
      }

      const response = await fetch(`/api/admin/tickets/${ticketId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priority,
          category: category || null,
          cost_amount: trimmedCost ? Number(trimmedCost) : null,
        }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "Unable to update the ticket.");
      }

      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to update the ticket.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-text-primary">Priority</label>
        <select
          value={priority}
          onChange={(event) => setPriority(event.target.value as TicketPriority)}
          className="w-full rounded-2xl border border-penn-blue bg-rich-black px-4 py-3"
        >
          {ticketPriorities.map((value) => (
            <option key={value} value={value}>
              {ticketPriorityLabels[value]}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-text-primary">Category</label>
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="w-full rounded-2xl border border-penn-blue bg-rich-black px-4 py-3"
        >
          <option value="">Uncategorized</option>
          {ticketCategories.map((value) => (
            <option key={value} value={value}>
              {ticketCategoryLabels[value]}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="ticket-cost-amount"
          className="text-sm font-medium text-text-primary"
        >
          Cost (USD)
        </label>
        <input
          id="ticket-cost-amount"
          type="number"
          min="0"
          step="0.01"
          inputMode="decimal"
          value={cost}
          onChange={(event) => setCost(event.target.value)}
          placeholder="Leave blank if not billed"
          className="w-full rounded-2xl border border-penn-blue bg-rich-black px-4 py-3"
        />
        <p className="text-xs text-text-secondary">
          Visible to the client on their ticket once set.
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
        className="rounded-full border border-penn-blue px-5 py-3 font-semibold text-text-primary transition hover:border-blue-ncs disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Saving..." : "Save ticket details"}
      </button>
    </form>
  );
}
