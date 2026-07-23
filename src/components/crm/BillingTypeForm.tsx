"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { BillingType } from "@/types/crm";
import { billingTypes, billingTypeLabels } from "@/lib/crm";

export default function BillingTypeForm({
  organizationId,
  currentBillingType,
}: {
  organizationId: string;
  currentBillingType: BillingType | null;
}) {
  const router = useRouter();
  const [billingType, setBillingType] = useState<string>(
    currentBillingType || "",
  );
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch(
        `/api/admin/organizations/${organizationId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ billing_type: billingType || null }),
        },
      );

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "Unable to update billing type.");
      }

      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to update billing type.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <select
        value={billingType}
        onChange={(event) => setBillingType(event.target.value)}
        className="w-full rounded-2xl border border-penn-blue bg-rich-black px-4 py-3 text-sm"
      >
        <option value="">Not set</option>
        {billingTypes.map((value) => (
          <option key={value} value={value}>
            {billingTypeLabels[value]}
          </option>
        ))}
      </select>

      {error ? (
        <p className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-full border border-penn-blue px-4 py-2 text-sm font-semibold text-text-primary transition hover:border-blue-ncs disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Saving..." : "Save billing type"}
      </button>
    </form>
  );
}
