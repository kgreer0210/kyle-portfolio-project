"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDateTime } from "@/lib/crm";
import { readTextStream } from "@/lib/readTextStream";

export interface ProjectUpdateItem {
  id: string;
  body: string;
  sent_at: string;
}

export default function ProjectUpdatesPanel({
  projectId,
  updates,
}: {
  projectId: string;
  updates: ProjectUpdateItem[];
}) {
  const router = useRouter();
  const abortRef = useRef<AbortController | null>(null);
  const [body, setBody] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"idle" | "drafting" | "sending">("idle");
  const [message, setMessage] = useState<{ tone: "error" | "ok"; text: string } | null>(null);

  async function draft() {
    if (body.trim() && !window.confirm("Replace the current update with an AI draft?")) {
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setMessage(null);
    setStatus("drafting");
    setBody("");

    try {
      const response = await fetch(`/api/admin/projects/${projectId}/updates/draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notes.trim() || null }),
        signal: controller.signal,
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error || "Couldn't draft an update.");
      }
      const text = await readTextStream(response, setBody);
      setBody(text.trim());
    } catch (draftError) {
      if (!controller.signal.aborted) {
        setMessage({
          tone: "error",
          text: draftError instanceof Error ? draftError.message : "Couldn't draft an update.",
        });
      }
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
        setStatus("idle");
      }
    }
  }

  async function send() {
    if (!body.trim()) return;
    setMessage(null);
    setStatus("sending");
    try {
      const response = await fetch(`/api/admin/projects/${projectId}/updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const payload = (await response.json()) as { error?: string; emailed?: boolean };
      if (!response.ok) {
        throw new Error(payload.error || "Unable to send the update.");
      }
      setBody("");
      setNotes("");
      setMessage({
        tone: "ok",
        text: payload.emailed
          ? "Update sent and posted to the portal."
          : "Update posted to the portal. No client members to email yet.",
      });
      router.refresh();
    } catch (sendError) {
      setMessage({
        tone: "error",
        text: sendError instanceof Error ? sendError.message : "Unable to send the update.",
      });
    } finally {
      setStatus("idle");
    }
  }

  const busy = status !== "idle";

  return (
    <section className="rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-6">
      <h3 className="text-xl font-semibold text-white">Updates</h3>
      <p className="mt-2 text-sm text-text-secondary">
        {updates[0]
          ? `Last sent ${formatDateTime(updates[0].sent_at)}.`
          : "No updates sent yet."}
      </p>

      <div className="mt-4 space-y-3">
        <label htmlFor={`update-notes-${projectId}`} className="sr-only">
          Notes for the AI draft
        </label>
        <input
          id={`update-notes-${projectId}`}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          maxLength={1000}
          placeholder="Optional notes, e.g. “staging link is live”"
          className="w-full rounded-2xl border border-penn-blue bg-rich-black px-4 py-2.5 text-sm"
        />
        <button
          type="button"
          onClick={() => void draft()}
          disabled={busy}
          className="rounded-full border border-penn-blue px-4 py-2 text-sm font-semibold text-text-primary transition hover:border-blue-ncs disabled:opacity-60"
        >
          {status === "drafting" ? "Drafting..." : "Draft with AI"}
        </button>
        <label htmlFor={`update-body-${projectId}`} className="sr-only">
          Update
        </label>
        <textarea
          id={`update-body-${projectId}`}
          rows={7}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          readOnly={status === "drafting"}
          maxLength={5000}
          placeholder="What got done, what's next, anything you need from them."
          className="w-full rounded-2xl border border-penn-blue bg-rich-black px-4 py-3 text-sm"
        />
        <button
          type="button"
          onClick={() => void send()}
          disabled={busy || !body.trim()}
          className="rounded-full bg-blue-ncs px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-lapis-lazuli disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "sending" ? "Sending..." : "Send to client"}
        </button>
        {message ? (
          <p
            role={message.tone === "error" ? "alert" : "status"}
            className={`rounded-2xl border px-4 py-3 text-sm ${
              message.tone === "error"
                ? "border-red-500/40 bg-red-500/10 text-red-200"
                : "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
            }`}
          >
            {message.text}
          </p>
        ) : null}
      </div>

      {updates.length > 0 ? (
        <details className="mt-5">
          <summary className="cursor-pointer text-sm font-medium text-text-secondary transition hover:text-white">
            Sent updates ({updates.length})
          </summary>
          <ul className="mt-3 space-y-3">
            {updates.map((update) => (
              <li key={update.id} className="rounded-2xl border border-penn-blue bg-rich-black/40 p-4">
                <p className="text-xs text-text-secondary">{formatDateTime(update.sent_at)}</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-text-primary">
                  {update.body}
                </p>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}
