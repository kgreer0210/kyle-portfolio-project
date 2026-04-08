"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type AdminOnboardingReviewStatus = "completed" | "reopened";

export default function AdminOnboardingReviewForm({
  organizationId,
  currentStatus,
}: {
  organizationId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<AdminOnboardingReviewStatus>(
    currentStatus === "reopened" ? "reopened" : "completed",
  );
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/admin/onboarding/${organizationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "Unable to update onboarding.");
      }

      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to update onboarding.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-text-primary">Decision</label>
        <select
          value={status}
          onChange={(event) =>
            setStatus(event.target.value as AdminOnboardingReviewStatus)
          }
          className="w-full rounded-2xl border border-penn-blue bg-rich-black px-4 py-3"
        >
          <option value="completed">Mark onboarding complete</option>
          <option value="reopened">Reopen for client updates</option>
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
        className="rounded-full bg-blue-ncs px-5 py-3 font-semibold text-white transition hover:bg-lapis-lazuli disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Saving..." : "Save decision"}
      </button>
    </form>
  );
}
