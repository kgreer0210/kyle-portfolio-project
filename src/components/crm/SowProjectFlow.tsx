"use client";

import { ChangeEvent, DragEvent, useState } from "react";
import ProjectDraftForm from "@/components/crm/ProjectDraftForm";
import type { DraftClientInput, ProjectDraftInput } from "@/lib/projectDraft";
import { buildPendingSowPath, sowBucket } from "@/lib/sowStorage";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

const MAX_BYTES = 20 * 1024 * 1024;

interface ExtractResponse {
  client: Partial<DraftClientInput>;
  draft: ProjectDraftInput;
  notices: string[];
  extraction: Record<string, unknown>;
  model: string;
  error?: string;
}

type Stage =
  | { name: "pick" }
  | { name: "reading"; label: string }
  | {
      name: "review";
      result: ExtractResponse;
      sow?: { storagePath: string; fileName: string };
    };

const secondaryButton =
  "rounded-full border border-penn-blue px-5 py-3 font-semibold text-text-primary transition hover:border-blue-ncs disabled:opacity-60";

/**
 * Upload a signed SOW (or paste its text), let the model draft the client and
 * project, then hand off to the shared review form. Nothing is saved until
 * the admin clicks Create.
 */
export default function SowProjectFlow({ organizationId }: { organizationId?: string }) {
  const [stage, setStage] = useState<Stage>({ name: "pick" });
  const [error, setError] = useState("");
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pastedText, setPastedText] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  async function extract(body: Record<string, string>) {
    const response = await fetch("/api/admin/sow/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = (await response.json()) as ExtractResponse;
    if (!response.ok) {
      throw new Error(payload.error || "The SOW couldn't be read.");
    }
    return payload;
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError("");

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Upload the SOW as a PDF, or paste its text instead.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("SOW files must be 20MB or smaller.");
      return;
    }

    try {
      setStage({ name: "reading", label: "Uploading SOW…" });
      const storagePath = buildPendingSowPath(file.name);
      const { error: uploadError } = await createBrowserSupabaseClient()
        .storage.from(sowBucket)
        .upload(storagePath, file, { contentType: "application/pdf", upsert: false });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      setStage({ name: "reading", label: "Reading SOW… this can take up to a minute." });
      const result = await extract({ path: storagePath, fileName: file.name });
      setStage({ name: "review", result, sow: { storagePath, fileName: file.name } });
    } catch (flowError) {
      setError(flowError instanceof Error ? flowError.message : "The SOW couldn't be read.");
      setStage({ name: "pick" });
    }
  }

  async function handlePaste() {
    setError("");
    try {
      setStage({ name: "reading", label: "Reading SOW… this can take up to a minute." });
      const result = await extract({ text: pastedText });
      setStage({ name: "review", result });
    } catch (flowError) {
      setError(flowError instanceof Error ? flowError.message : "The SOW couldn't be read.");
      setStage({ name: "pick" });
    }
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);
    void handleFile(event.dataTransfer.files?.[0]);
  }

  if (stage.name === "review") {
    const { result, sow } = stage;
    return (
      <ProjectDraftForm
        organizationId={organizationId}
        initialClient={result.client}
        initialDraft={result.draft}
        notices={result.notices}
        onCancel={() => setStage({ name: "pick" })}
        sow={
          sow
            ? {
                storagePath: sow.storagePath,
                fileName: sow.fileName,
                extraction: result.extraction,
                model: result.model,
              }
            : undefined
        }
      />
    );
  }

  const isReading = stage.name === "reading";

  return (
    <section className="rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-6 md:p-8">
      {isReading ? (
        <div className="flex flex-col items-center gap-4 py-12 text-center" role="status">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-penn-blue border-t-blue-ncs" />
          <p className="text-sm text-text-secondary">{stage.label}</p>
        </div>
      ) : (
        <>
          <label
            htmlFor="sow-file"
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`flex cursor-pointer flex-col items-center gap-3 rounded-3xl border-2 border-dashed px-6 py-12 text-center transition ${
              isDragging ? "border-blue-ncs bg-blue-ncs/10" : "border-penn-blue bg-rich-black/40 hover:border-blue-ncs"
            }`}
          >
            <span className="text-lg font-semibold text-white">Drop the signed SOW here</span>
            <span className="text-sm text-text-secondary">
              PDF up to 20MB. AI drafts the client, project, milestones, and what you
              need from them. You review everything before it&apos;s saved.
            </span>
            <span className="mt-2 rounded-full bg-blue-ncs px-5 py-2 text-sm font-semibold text-white">
              Choose file
            </span>
            <input
              id="sow-file"
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                void handleFile(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
          </label>

          <div className="mt-5">
            {pasteOpen ? (
              <div className="space-y-3">
                <label htmlFor="sow-text" className="text-sm font-medium text-text-primary">
                  SOW text
                </label>
                <textarea
                  id="sow-text"
                  rows={10}
                  value={pastedText}
                  onChange={(event) => setPastedText(event.target.value)}
                  className="w-full rounded-2xl border border-penn-blue bg-rich-black px-4 py-3 text-sm"
                  placeholder="Paste the full SOW (e.g. from a Word document)"
                />
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => void handlePaste()}
                    disabled={pastedText.trim().length < 200}
                    className="rounded-full bg-blue-ncs px-5 py-3 font-semibold text-white transition hover:bg-lapis-lazuli disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Read SOW
                  </button>
                  <button type="button" className={secondaryButton} onClick={() => setPasteOpen(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setPasteOpen(true)}
                className="text-sm font-medium text-blue-ncs transition hover:text-white"
              >
                Have a Word doc? Paste the text instead
              </button>
            )}
          </div>
        </>
      )}

      {error ? (
        <p className="mt-5 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
