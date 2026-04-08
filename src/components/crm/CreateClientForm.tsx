"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type ClientMode = "new" | "existing";

export default function CreateClientForm() {
  const router = useRouter();
  const [organizationName, setOrganizationName] = useState("");
  const [slug, setSlug] = useState("");
  const [primaryContactName, setPrimaryContactName] = useState("");
  const [primaryContactEmail, setPrimaryContactEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [clientType, setClientType] = useState<ClientMode>("new");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organizationName,
          slug,
          primaryContactName,
          primaryContactEmail,
          notes,
          clientType,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        organizationId?: string;
      };

      if (!response.ok || !payload.organizationId) {
        throw new Error(payload.error || "Unable to create client.");
      }

      setSuccess("Client created successfully.");
      setOrganizationName("");
      setSlug("");
      setPrimaryContactName("");
      setPrimaryContactEmail("");
      setNotes("");
      router.push(`/admin/clients/${payload.organizationId}`);
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to create client.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary">
            Organization name
          </label>
          <input
            value={organizationName}
            onChange={(event) => setOrganizationName(event.target.value)}
            className="w-full rounded-2xl border border-penn-blue bg-rich-black px-4 py-3"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary">
            Slug
          </label>
          <input
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            className="w-full rounded-2xl border border-penn-blue bg-rich-black px-4 py-3"
            placeholder="optional-custom-slug"
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary">
            Primary contact name
          </label>
          <input
            value={primaryContactName}
            onChange={(event) => setPrimaryContactName(event.target.value)}
            className="w-full rounded-2xl border border-penn-blue bg-rich-black px-4 py-3"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary">
            Primary contact email
          </label>
          <input
            type="email"
            value={primaryContactEmail}
            onChange={(event) => setPrimaryContactEmail(event.target.value)}
            className="w-full rounded-2xl border border-penn-blue bg-rich-black px-4 py-3"
            required
          />
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium text-text-primary">Client type</label>
        <div className="grid gap-4 md:grid-cols-2">
          <button
            type="button"
            onClick={() => setClientType("new")}
            className={`rounded-3xl border px-5 py-4 text-left transition ${
              clientType === "new"
                ? "border-blue-ncs bg-blue-ncs/10"
                : "border-penn-blue bg-rich-black/50"
            }`}
          >
            <div className="font-semibold text-white">New client</div>
            <p className="mt-2 text-sm text-text-secondary">
              Invite into the full onboarding flow before portal work begins.
            </p>
          </button>
          <button
            type="button"
            onClick={() => setClientType("existing")}
            className={`rounded-3xl border px-5 py-4 text-left transition ${
              clientType === "existing"
                ? "border-blue-ncs bg-blue-ncs/10"
                : "border-penn-blue bg-rich-black/50"
            }`}
          >
            <div className="font-semibold text-white">Existing client</div>
            <p className="mt-2 text-sm text-text-secondary">
              Skip onboarding and give them immediate ticket access as a legacy account.
            </p>
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-text-primary">Notes</label>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={5}
          className="w-full rounded-2xl border border-penn-blue bg-rich-black px-4 py-3"
          placeholder="Optional internal context for this client."
        />
      </div>

      {error ? (
        <p className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      {success ? (
        <p className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {success}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-full bg-blue-ncs px-6 py-3 font-semibold text-white transition hover:bg-lapis-lazuli disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Creating client..." : "Create client"}
      </button>
    </form>
  );
}
