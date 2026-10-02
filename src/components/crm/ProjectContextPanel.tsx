"use client";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
const payloadSchema = z.object({
  sources: z.array(
    z.object({
      id: z.string(),
      kind: z.enum(["manual", "website", "github"]),
      label: z.string(),
      locator: z.string(),
      enabled: z.boolean(),
      last_success_at: z.string().nullable(),
      last_error: z.string().nullable(),
      config: z.object({
        content: z.string().optional(),
        audience: z.enum(["admin", "client"]).optional(),
      }),
    }),
  ),
  runs: z.array(
    z.object({
      id: z.string(),
      source_id: z.string(),
      status: z.string(),
      coverage: z.string().nullable(),
    }),
  ),
  entries: z.array(
    z.object({
      id: z.string(),
      source_id: z.string(),
      title: z.string(),
      content: z.string(),
      locator: z.string(),
      audience: z.string(),
    }),
  ),
  githubConfigured: z.boolean(),
});
type PanelData = z.infer<typeof payloadSchema>;
const input =
  "w-full rounded-2xl border border-penn-blue bg-rich-black px-4 py-3 text-sm";
const button =
  "rounded-full border border-penn-blue px-4 py-2 text-sm font-semibold transition hover:border-blue-ncs disabled:opacity-50";
export default function ProjectContextPanel({
  projectId,
  websiteUrl,
}: {
  projectId: string;
  websiteUrl?: string | null;
}) {
  const [data, setData] = useState<PanelData | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [kind, setKind] = useState<"manual" | "website" | "github">("manual");
  const [editing, setEditing] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [label, setLabel] = useState("");
  const [clientSafe, setClientSafe] = useState(false);
  const base = `/api/admin/projects/${projectId}/context`;
  const refresh = useCallback(async () => {
    try {
      const res = await fetch(base);
      const json = await res.json();
      if (!res.ok)
        throw new Error(json.error || "Unable to load project context.");
      setData(payloadSchema.parse(json));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load context.");
    }
  }, [base]);
  useEffect(() => {
    let cancelled = false;
    fetch(base)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok)
          throw new Error(json.error || "Unable to load project context.");
        if (!cancelled) setData(payloadSchema.parse(json));
      })
      .catch((e) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Unable to load context.");
      });
    return () => {
      cancelled = true;
    };
  }, [base]);
  const pending = data?.runs.some(
    (r) => r.status === "queued" || r.status === "running",
  );
  useEffect(() => {
    if (!pending) return;
    const timer = setInterval(() => void refresh(), 3000);
    return () => clearInterval(timer);
  }, [pending, refresh]);
  async function mutate(method: string, body?: unknown, id?: string) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(id ? `${base}?id=${id}` : base, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Unable to save context.");
      await refresh();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save context.");
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    const source =
      kind === "manual"
        ? {
            kind,
            label,
            locator: "",
            config: {
              content: note,
              audience: clientSafe ? "client" : "admin",
            },
          }
        : kind === "website"
          ? { kind, label, locator: String(f.get("locator")), config: {} }
          : {
              kind,
              label,
              locator: String(f.get("locator")),
              config: {
                installation_id: Number(f.get("installation")),
                branch: String(f.get("branch") || "main"),
              },
            };
    const ok = await mutate(
      editing ? "PATCH" : "POST",
      editing ? { id: editing, action: "edit", source } : source,
    );
    if (ok) {
      setShowAdd(false);
      setEditing(null);
      setNote("");
      setLabel("");
      setClientSafe(false);
    }
  }
  function startNoteEdit(source: NonNullable<PanelData>["sources"][number]) {
    setKind("manual");
    setEditing(source.id);
    setNote(source.config.content || "");
    setLabel(source.label);
    setClientSafe(source.config.audience === "client");
    setShowAdd(true);
  }
  return (
    <section
      className="rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-6 md:p-8"
      aria-labelledby="project-context-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-blue-ncs">
            Support knowledge
          </p>
          <h3
            id="project-context-heading"
            className="mt-2 text-xl font-semibold text-white"
          >
            Project context
          </h3>
          <p className="mt-2 max-w-2xl text-sm text-text-secondary">
            Give reply drafts context from this project’s pages, code, and
            workflows. Only approved workflow notes are used by the client
            ticket assistant.
          </p>
        </div>
        <button
          type="button"
          className={button}
          onClick={() => {
            setShowAdd(!showAdd);
            setEditing(null);
            setLabel("");
            setNote("");
            setClientSafe(false);
          }}
        >
          {showAdd ? "Close" : "Add source"}
        </button>
      </div>
      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-2xl border border-red-500/40 p-4 text-sm text-red-200"
        >
          {error}
        </p>
      ) : null}
      {showAdd ? (
        <form
          onSubmit={add}
          className="mt-6 space-y-4 rounded-3xl border border-penn-blue bg-rich-black/40 p-5"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm">
              Source type
              <select
                aria-label="Source type"
                className={input}
                value={kind}
                disabled={Boolean(editing)}
                onChange={(e) =>
                  setKind(
                    z
                      .enum(["manual", "website", "github"])
                      .parse(e.target.value),
                  )
                }
              >
                <option value="manual">Workflow note</option>
                <option value="website">Public website</option>
                <option value="github" disabled={!data?.githubConfigured}>
                  GitHub repository
                  {!data?.githubConfigured ? " (setup required)" : ""}
                </option>
              </select>
            </label>
            <label className="space-y-2 text-sm">
              Name
              <input
                className={input}
                aria-label="Source name"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                maxLength={160}
                required
                placeholder="e.g. Submission approval"
              />
            </label>
          </div>
          {kind === "manual" ? (
            <>
              <label className="block space-y-2 text-sm">
                Workflow details
                <textarea
                  className={input}
                  aria-label="Workflow details"
                  rows={5}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={16000}
                  required
                  placeholder="Describe the screen, who can access it, its actions, and expected behavior."
                />
              </label>
              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={clientSafe}
                  onChange={(e) => setClientSafe(e.target.checked)}
                  className="mt-1"
                />
                <span>
                  Approved for the client assistant
                  <span className="mt-1 block text-xs text-text-secondary">
                    Include only information the client is allowed to know. Do
                    not include secrets, private code, internal notes, or SOW
                    details.
                  </span>
                </span>
              </label>
            </>
          ) : (
            <label className="block space-y-2 text-sm">
              {kind === "website" ? "Website URL" : "Repository"}
              <input
                name="locator"
                aria-label="Source location"
                className={input}
                type={kind === "website" ? "url" : "text"}
                defaultValue={kind === "website" ? websiteUrl || "" : ""}
                placeholder={
                  kind === "website"
                    ? "https://example.com"
                    : "owner/repository"
                }
                required
              />
            </label>
          )}
          {kind === "github" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm">
                GitHub App installation ID
                <input
                  className={input}
                  name="installation"
                  type="number"
                  min={1}
                  required
                />
              </label>
              <label className="space-y-2 text-sm">
                Branch
                <input
                  className={input}
                  name="branch"
                  defaultValue="main"
                  required
                />
              </label>
              <p className="text-xs text-text-secondary sm:col-span-2">
                Install the configured read-only GitHub App on the selected
                repository first. The server verifies its access when
                connecting. Code context is private and does not prove what is
                deployed.
              </p>
            </div>
          ) : null}
          <button
            className="rounded-full bg-blue-ncs px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
            disabled={busy}
          >
            {busy ? "Saving…" : editing ? "Save note" : "Connect source"}
          </button>
        </form>
      ) : null}
      <div className="mt-6 space-y-3">
        {!data && !error ? (
          <p className="text-sm text-text-secondary">Loading sources…</p>
        ) : null}
        {data?.sources.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-penn-blue p-6">
            <p className="font-medium text-white">
              Add context before the next ticket arrives.
            </p>
            <p className="mt-2 text-sm text-text-secondary">
              Start with a workflow note or public website. For private screens,
              use repository context and curated notes.
            </p>
          </div>
        ) : null}
        {data?.sources.map((source) => {
          const runs = data.runs.filter((r) => r.source_id === source.id);
          const status = !source.enabled
            ? "Disabled"
            : runs[0]?.status || "Not synced";
          const entries = data.entries.filter((e) => e.source_id === source.id);
          return (
            <article
              key={source.id}
              className="rounded-3xl border border-penn-blue bg-rich-black/40 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wider text-text-secondary">
                    {source.kind === "manual"
                      ? "Workflow note"
                      : source.kind === "github"
                        ? "Repository"
                        : "Website"}{" "}
                    ·{" "}
                    {source.config.audience === "client"
                      ? "Client-approved"
                      : "Private"}
                  </p>
                  <h4 className="mt-1 break-words font-semibold text-white">
                    {source.label}
                  </h4>
                  <p className="mt-1 break-all text-xs text-text-secondary">
                    {source.locator}
                  </p>
                </div>
                <span className="rounded-full border border-penn-blue px-3 py-1 text-xs">
                  {status}
                </span>
              </div>
              <p className="mt-3 text-xs text-text-secondary">
                {source.last_success_at
                  ? `Last checked ${new Date(source.last_success_at).toLocaleString()}`
                  : "No successful refresh yet"}{" "}
                · {entries.length} entries
              </p>
              {source.last_error ? (
                <p className="mt-2 text-sm text-amber-200">
                  {source.last_error}
                </p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  className={button}
                  type="button"
                  disabled={busy || !source.enabled}
                  onClick={() =>
                    void mutate("PATCH", { id: source.id, action: "refresh" })
                  }
                >
                  Refresh
                </button>
                {source.kind === "manual" ? (
                  <button
                    type="button"
                    className={button}
                    disabled={busy}
                    onClick={() => startNoteEdit(source)}
                  >
                    Edit note
                  </button>
                ) : null}
                <button
                  className={button}
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void mutate("PATCH", {
                      id: source.id,
                      action: "toggle",
                      enabled: !source.enabled,
                    })
                  }
                >
                  {source.enabled ? "Disable" : "Enable"}
                </button>
                <button
                  className={button}
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    if (
                      window.confirm(
                        `Disconnect ${source.label} and delete its stored context?`,
                      )
                    )
                      void mutate("DELETE", undefined, source.id);
                  }}
                >
                  Disconnect
                </button>
              </div>
              {entries.length ? (
                <details className="mt-4 text-sm">
                  <summary className="cursor-pointer text-blue-ncs">
                    Inspect stored context
                  </summary>
                  <div className="mt-3 space-y-3">
                    {entries.map((e) => (
                      <details
                        key={e.id}
                        className="rounded-2xl border border-penn-blue p-3"
                      >
                        <summary className="cursor-pointer break-words">
                          {e.title}
                        </summary>
                        <p className="mt-2 break-all text-xs text-text-secondary">
                          {e.locator}
                        </p>
                        <p className="mt-3 whitespace-pre-wrap break-words text-xs text-text-secondary">
                          {e.content}
                        </p>
                      </details>
                    ))}
                  </div>
                </details>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
