"use client";

import { useState } from "react";
import CreateClientForm from "@/components/crm/CreateClientForm";
import ProjectDraftForm from "@/components/crm/ProjectDraftForm";
import SowProjectFlow from "@/components/crm/SowProjectFlow";
import { emptyProjectDraft } from "@/lib/projectDraft";

type Mode = "sow" | "manual" | "contact";

const modeOptions: Array<{ value: Mode; label: string; description: string }> = [
  {
    value: "sow",
    label: "From SOW",
    description: "Upload the signed SOW. AI drafts everything for you to review.",
  },
  {
    value: "manual",
    label: "Enter by hand",
    description: "Type in the project, milestones, and what you need from the client.",
  },
  {
    value: "contact",
    label: "Contact only",
    description: "Just the client record and portal access. Add a project later.",
  },
];

/**
 * Entry point for creating a project: for a new client (all three modes) or
 * an existing one (`organizationId`, no contact-only mode).
 */
export default function NewClientFlow({ organizationId }: { organizationId?: string }) {
  const [mode, setMode] = useState<Mode>("sow");
  const options = organizationId
    ? modeOptions.filter((option) => option.value !== "contact")
    : modeOptions;

  return (
    <div className="space-y-6">
      <div
        className={`grid gap-4 ${options.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2"}`}
        role="radiogroup"
        aria-label="How to create the project"
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={mode === option.value}
            onClick={() => setMode(option.value)}
            className={`rounded-3xl border px-5 py-4 text-left transition ${
              mode === option.value
                ? "border-blue-ncs bg-blue-ncs/10"
                : "border-penn-blue bg-rich-black/50 hover:border-blue-ncs"
            }`}
          >
            <div className="font-semibold text-white">{option.label}</div>
            <p className="mt-2 text-sm text-text-secondary">{option.description}</p>
          </button>
        ))}
      </div>

      {mode === "sow" ? (
        <SowProjectFlow organizationId={organizationId} />
      ) : mode === "manual" ? (
        <ProjectDraftForm organizationId={organizationId} initialDraft={emptyProjectDraft()} />
      ) : (
        <section className="rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-6 md:p-8">
          <CreateClientForm />
        </section>
      )}
    </div>
  );
}
