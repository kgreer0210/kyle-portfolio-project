import { describe, expect, it } from "vitest";
import {
  assessBillability,
  buildTriageUserPrompt,
  formatTriageNote,
  resolveTriagedCategory,
  resolveTriagedPriority,
} from "@/lib/ticketTriage";

describe("resolveTriagedPriority", () => {
  it("lets the AI escalate above the client's choice", () => {
    expect(resolveTriagedPriority("normal", "urgent")).toBe("urgent");
  });

  it("never drops below the client's choice", () => {
    expect(resolveTriagedPriority("high", "low")).toBe("high");
  });

  it("keeps the client's choice when they match", () => {
    expect(resolveTriagedPriority("normal", "normal")).toBe("normal");
  });
});

describe("resolveTriagedCategory", () => {
  it("fills a blank category regardless of confidence", () => {
    expect(resolveTriagedCategory(null, "hosting", "low")).toBe("hosting");
  });

  it("overrides an explicit choice only with high confidence", () => {
    expect(resolveTriagedCategory("website", "hosting", "high")).toBe("hosting");
    expect(resolveTriagedCategory("website", "hosting", "medium")).toBe(
      "website",
    );
  });
});

describe("assessBillability", () => {
  it("treats trade and per-project clients as billable", () => {
    expect(assessBillability("trade", "minor")).toMatch(/^Billable/);
    expect(assessBillability("per_project", "minor")).toMatch(/^Billable/);
  });

  it("sizes monthly-plan work by scope", () => {
    expect(assessBillability("monthly_plan", "minor")).toMatch(/covered/);
    expect(assessBillability("monthly_plan", "moderate")).toMatch(/Judgment/);
    expect(assessBillability("monthly_plan", "major")).toMatch(/billable/);
  });

  it("flags a missing billing arrangement", () => {
    expect(assessBillability(null, "major")).toMatch(/No billing arrangement/);
  });
});

describe("buildTriageUserPrompt", () => {
  const base = {
    type: "request" as const,
    title: "Add a booking page",
    description: "Can we add online booking?",
    clientPriority: "normal" as const,
    clientCategory: null,
    organizationName: "Acme",
    billingType: "per_project" as const,
    attachmentNames: [],
  };

  it("states that no project scope is available", () => {
    const prompt = buildTriageUserPrompt(base);
    expect(prompt).toContain("Project scope: none provided");
    expect(prompt).not.toContain("Client-selected");
  });

  it("includes the summary, milestones, and exclusions when scoped", () => {
    const prompt = buildTriageUserPrompt({
      ...base,
      projectScope: {
        title: "Marketing site",
        summary: "Five-page site.",
        milestones: ["Design", "Build"],
        outOfScope: ["Online booking", "E-commerce"],
      },
    });
    expect(prompt).toContain("Project: Marketing site");
    expect(prompt).toContain("Milestones: Design; Build");
    expect(prompt).toContain("Explicitly out of scope: Online booking; E-commerce");
    expect(prompt.indexOf("Project scope (agreed")).toBeLessThan(prompt.indexOf("Title:"));
  });
});

describe("formatTriageNote scope line", () => {
  const triage = {
    summary: "Wants booking.",
    suggested_priority: "normal" as const,
    priority_reasoning: "No urgency.",
    suggested_category: "website" as const,
    category_confidence: "high" as const,
    missing_info: [],
    clarifying_questions: [],
    work_scope: "major" as const,
    work_scope_reasoning: "New feature.",
    likely_out_of_scope: true,
    scope_reasoning: "Booking is listed as out of scope.",
  };
  const applied = {
    clientPriority: "normal" as const,
    clientCategory: null,
    appliedPriority: "normal" as const,
    appliedCategory: "website" as const,
    billingType: "per_project" as const,
  };

  it("flags likely out-of-scope work only when scope was provided", () => {
    expect(formatTriageNote(triage, { ...applied, hasProjectScope: true })).toContain(
      "LIKELY OUT OF SCOPE",
    );
    expect(formatTriageNote(triage, applied)).not.toContain("Project scope:");
  });

  it("never mentions client-selected values", () => {
    expect(formatTriageNote(triage, applied)).not.toContain("client selected");
  });
});
