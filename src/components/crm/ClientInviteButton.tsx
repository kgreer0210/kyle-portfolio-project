"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ClientInviteButtonProps {
  organizationId: string;
  hasMember: boolean;
}

/** Let an admin send the deferred invite or resend an expired invitation. */
export default function ClientInviteButton({
  organizationId,
  hasMember,
}: ClientInviteButtonProps) {
  const router = useRouter();
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function sendInvite() {
    setIsSending(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`/api/admin/clients/${organizationId}/invite`, {
        method: "POST",
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Unable to send the portal invite.");
      }

      setMessage(hasMember ? "Portal invite resent." : "Portal invite sent.");
      router.refresh();
    } catch (sendError) {
      setError(
        sendError instanceof Error
          ? sendError.message
          : "Unable to send the portal invite.",
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="mt-4 space-y-2">
      <button
        type="button"
        onClick={sendInvite}
        disabled={isSending}
        className="rounded-full border border-blue-ncs px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-ncs/20 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSending
          ? "Sending..."
          : hasMember
            ? "Resend portal invite"
            : "Send portal invite"}
      </button>
      {message ? <p className="text-sm text-emerald-300">{message}</p> : null}
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
    </div>
  );
}
