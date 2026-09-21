"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const inputClass =
  "w-full rounded-2xl border border-penn-blue bg-rich-black px-4 py-3";

/** Contact-only client, for work that has no SOW or project yet. */
export default function CreateClientForm() {
  const router = useRouter();
  const [organizationName, setOrganizationName] = useState("");
  const [primaryContactName, setPrimaryContactName] = useState("");
  const [primaryContactEmail, setPrimaryContactEmail] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [sendInviteNow, setSendInviteNow] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/admin/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organizationName,
          primaryContactName,
          primaryContactEmail,
          websiteUrl,
          notes,
          sendInviteNow,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        organizationId?: string;
      };

      if (!payload.organizationId) {
        throw new Error(payload.error || "Unable to create client.");
      }

      // 207: the client exists but the invite failed. Go to the record anyway
      // so the admin can retry from there.
      router.push(`/admin/clients/${payload.organizationId}`);
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to create client.",
      );
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="new-client-org" className="text-sm font-medium text-text-primary">
            Organization name
          </label>
          <input
            id="new-client-org"
            value={organizationName}
            onChange={(event) => setOrganizationName(event.target.value)}
            className={inputClass}
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="new-client-website" className="text-sm font-medium text-text-primary">
            Website (optional)
          </label>
          <input
            id="new-client-website"
            value={websiteUrl}
            onChange={(event) => setWebsiteUrl(event.target.value)}
            className={inputClass}
            placeholder="https://"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="new-client-contact" className="text-sm font-medium text-text-primary">
            Primary contact name
          </label>
          <input
            id="new-client-contact"
            value={primaryContactName}
            onChange={(event) => setPrimaryContactName(event.target.value)}
            className={inputClass}
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="new-client-email" className="text-sm font-medium text-text-primary">
            Primary contact email
          </label>
          <input
            id="new-client-email"
            type="email"
            value={primaryContactEmail}
            onChange={(event) => setPrimaryContactEmail(event.target.value)}
            className={inputClass}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="new-client-notes" className="text-sm font-medium text-text-primary">
          Notes
        </label>
        <textarea
          id="new-client-notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={4}
          className={inputClass}
          placeholder="Optional internal context for this client."
        />
      </div>

      <label className="flex items-center gap-3 text-sm text-text-primary">
        <input
          type="checkbox"
          checked={sendInviteNow}
          onChange={(event) => setSendInviteNow(event.target.checked)}
          className="h-4 w-4"
        />
        Invite the client to the portal now
      </label>

      {error ? (
        <p className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
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
