import { describe, expect, it } from "vitest";
import {
  buildInitialAnswers,
  buildOnboardingSteps,
  computeCompletedSteps,
  getStepStatus,
  getVisibleFields,
  sanitizeAnswers,
  summarizeResponses,
  validateSubmission,
} from "@/lib/onboardingFlow";
import { legacyOnboardingSteps } from "@/lib/onboardingLegacySteps";
import { createDefaultPlan, projectTypes } from "@/lib/onboardingPresets";
import type { OnboardingAnswers, OnboardingPlan, ProjectType } from "@/types/crm";

const known = {
  organizationName: "Acme Plumbing",
  contactName: "Jane Doe",
  contactEmail: "jane@acme.test",
  websiteUrl: "https://acme.test",
};

function stepsFor(projectType: ProjectType, planOverride?: Partial<OnboardingPlan>) {
  const plan = { ...createDefaultPlan(projectType), ...planOverride };
  return buildOnboardingSteps({
    flowVersion: "v2",
    projectType,
    plan,
    projectSummary: "A five-page marketing site.",
    known,
  });
}

function fieldKeys(projectType: ProjectType, stepKey: string, planOverride?: Partial<OnboardingPlan>) {
  const step = stepsFor(projectType, planOverride).find((s) => s.key === stepKey);
  return step ? step.fields.map((f) => f.key) : [];
}

describe("buildOnboardingSteps", () => {
  it("returns the legacy questionnaire for v1 records unchanged", () => {
    expect(buildOnboardingSteps({ flowVersion: "v1" })).toBe(legacyOnboardingSteps);
    expect(buildOnboardingSteps({ flowVersion: null })).toBe(legacyOnboardingSteps);
  });

  it("produces four steps for every preset", () => {
    for (const projectType of projectTypes) {
      const steps = stepsFor(projectType);
      expect(steps.map((s) => s.key)).toEqual(["contact", "project", "materials", "review"]);
    }
  });

  it("never asks about support hours or discovery topics in v2", () => {
    for (const projectType of projectTypes) {
      const keys = stepsFor(projectType).flatMap((s) => s.fields.map((f) => f.key));
      expect(keys).not.toContain("support_hours");
      expect(keys).not.toContain("project_goals");
      expect(keys).not.toContain("known_constraints");
      expect(keys).not.toContain("current_stack");
    }
  });

  it("new website asks about brand, photos, content and domain but never an existing site", () => {
    const keys = fieldKeys("new_website", "materials");
    expect(keys).toEqual(
      expect.arrayContaining([
        "logo_brand__status",
        "photos__status",
        "written_content__status",
        "domain__status",
      ]),
    );
    expect(keys.some((k) => k.startsWith("existing_site"))).toBe(false);
    expect(keys.some((k) => k.startsWith("existing_app"))).toBe(false);
  });

  it("existing website confirms the known address instead of asking for it", () => {
    const step = stepsFor("existing_website").find((s) => s.key === "materials")!;
    const confirm = step.fields.find((f) => f.key === "existing_site__status");
    expect(confirm?.type).toBe("choice");
    expect(confirm?.label).toContain("https://acme.test");
    expect(confirm?.required).toBe(true);
    expect(step.fields.some((f) => f.key === "domain__status")).toBe(false);
    // access helper present because hosting access is asked by default
    expect(step.fields.some((f) => f.key === "access_helper")).toBe(true);
  });

  it("existing website with no known address asks for the link", () => {
    const steps = buildOnboardingSteps({
      flowVersion: "v2",
      projectType: "existing_website",
      plan: createDefaultPlan("existing_website"),
      known: { ...known, websiteUrl: null },
    });
    const step = steps.find((s) => s.key === "materials")!;
    const link = step.fields.find((f) => f.key === "existing_site__note");
    expect(link?.required).toBe(true);
    expect(link?.showWhen).toBeUndefined();
    expect(step.fields.some((f) => f.key === "existing_site__status")).toBe(false);
  });

  it("new app asks only about brand, connected systems and access", () => {
    const keys = fieldKeys("new_app", "materials");
    expect(keys).toContain("logo_brand__status");
    expect(keys).toContain("connected_systems__status");
    expect(keys).toContain("access_helper");
    expect(keys).not.toContain("photos__status");
    expect(keys).not.toContain("domain__status");
    expect(keys.some((k) => k.startsWith("existing_app"))).toBe(false);
  });

  it("existing app asks which app and who can help with access", () => {
    const keys = fieldKeys("existing_app", "materials");
    expect(keys).toContain("existing_app__note");
    expect(keys).toContain("access_helper");
    expect(keys).not.toContain("logo_brand__status");
  });

  it("admin selections drive what the client sees", () => {
    const plan = createDefaultPlan("new_website");
    plan.requestedItems.logo_brand = { status: "have", note: "In Drive" };
    plan.requestedItems.photos = { status: "not_needed" };
    plan.requestedItems.hosting_access = { status: "ask", note: "GoDaddy" };
    plan.customItems = [{ key: "menu_pdf", label: "Menu PDF", question: "Do you have your latest menu as a PDF?" }];

    const step = stepsFor("new_website", plan).find((s) => s.key === "materials")!;
    const keys = step.fields.map((f) => f.key);
    expect(keys).not.toContain("logo_brand__status");
    expect(keys).not.toContain("photos__status");
    expect(keys).toContain("written_content__status");
    expect(keys).toContain("menu_pdf__status");
    expect(keys).toContain("access_helper");
    const accessList = step.fields.find((f) => f.key === "access__list");
    expect(accessList?.content).toContain("GoDaddy");
    expect(accessList?.content).toContain("never need to type a password");
  });

  it("shows agreed support coverage read-only when known", () => {
    const plan = createDefaultPlan("new_website", { supportCoverage: "Monthly plan: small fixes included" });
    const contact = stepsFor("new_website", plan).find((s) => s.key === "contact")!;
    const coverage = contact.fields.find((f) => f.key === "support_coverage");
    expect(coverage?.type).toBe("static");
    expect(coverage?.content).toContain("Monthly plan");
    expect(contact.fields.some((f) => f.key === "support_hours")).toBe(false);
  });

  it("prefills known contact details and never preselects the confirmation", () => {
    const steps = stepsFor("new_website");
    const answers = buildInitialAnswers(steps, {});
    expect(answers.contact.contact_name).toBe("Jane Doe");
    expect(answers.contact.contact_email).toBe("jane@acme.test");
    expect(answers.project.project_confirmation).toBeUndefined();
  });

  it("saved answers win over prefill", () => {
    const steps = stepsFor("new_website");
    const answers = buildInitialAnswers(steps, { contact: { contact_name: "Janet" } });
    expect(answers.contact.contact_name).toBe("Janet");
  });
});

describe("conditional fields", () => {
  it("reveals the domain address only when the client says yes", () => {
    const steps = stepsFor("new_website");
    const materials = steps.find((s) => s.key === "materials")!;
    const hidden = getVisibleFields(materials, { materials: { domain__status: "no" } });
    expect(hidden.some((f) => f.key === "domain__note")).toBe(false);
    const unsure = getVisibleFields(materials, { materials: { domain__status: "unsure" } });
    expect(unsure.some((f) => f.key === "domain__note")).toBe(false);
    const shown = getVisibleFields(materials, { materials: { domain__status: "yes" } });
    expect(shown.some((f) => f.key === "domain__note")).toBe(true);
  });

  it("reveals the discussion note only when the client wants to discuss", () => {
    const project = stepsFor("new_website").find((s) => s.key === "project")!;
    expect(getVisibleFields(project, {}).some((f) => f.key === "project_discussion_note")).toBe(false);
    expect(
      getVisibleFields(project, { project: { project_confirmation: "discuss" } }).some(
        (f) => f.key === "project_discussion_note",
      ),
    ).toBe(true);
  });

  it("reveals the access contact when someone else handles access", () => {
    const materials = stepsFor("existing_website").find((s) => s.key === "materials")!;
    expect(
      getVisibleFields(materials, { materials: { access_helper: "help" } }).some((f) => f.key === "access_contact"),
    ).toBe(false);
    expect(
      getVisibleFields(materials, { materials: { access_helper: "someone_else" } }).some(
        (f) => f.key === "access_contact",
      ),
    ).toBe(true);
  });
});

describe("step status and validation", () => {
  const steps = stepsFor("new_website");
  const contact = steps.find((s) => s.key === "contact")!;
  const project = steps.find((s) => s.key === "project")!;

  it("does not call a blank step complete", () => {
    expect(getStepStatus(contact, {})).toBe("not_started");
    expect(getStepStatus(project, {})).toBe("not_started");
  });

  it("is in progress while required answers are missing", () => {
    const answers: OnboardingAnswers = { contact: { contact_name: "Jane" } };
    expect(getStepStatus(contact, answers)).toBe("in_progress");
  });

  it("is complete once required visible fields are answered", () => {
    const answers: OnboardingAnswers = {
      contact: { contact_name: "Jane", contact_email: "jane@acme.test", preferred_contact: "email" },
    };
    expect(getStepStatus(contact, answers)).toBe("complete");
    expect(computeCompletedSteps(steps, answers)).toEqual(["contact"]);
  });

  it("treats a step with no client-facing fields as complete", () => {
    const plan = createDefaultPlan("new_website");
    for (const key of Object.keys(plan.requestedItems)) {
      plan.requestedItems[key] = { status: "have" };
    }
    const materials = stepsFor("new_website", plan).find((s) => s.key === "materials")!;
    expect(materials.fields).toHaveLength(0);
    expect(getStepStatus(materials, {})).toBe("complete");
  });

  it("blocks submission until the confirmation and contact basics are answered", () => {
    const missing = validateSubmission(steps, { contact: { contact_name: "Jane" } });
    const keys = missing.map((m) => m.fieldKey);
    expect(keys).toContain("project_confirmation");
    expect(keys).toContain("contact_email");
    expect(keys).toContain("preferred_contact");
    expect(keys).not.toContain("logo_brand__status");
  });

  it("requires a corrected address only when the client says the known one is wrong", () => {
    const existing = stepsFor("existing_website");
    const ok = validateSubmission(existing, {
      contact: { contact_name: "J", contact_email: "j@x.test", preferred_contact: "email" },
      project: { project_confirmation: "confirmed" },
      materials: { existing_site__status: "yes" },
    });
    expect(ok).toEqual([]);
    const wrong = validateSubmission(existing, {
      contact: { contact_name: "J", contact_email: "j@x.test", preferred_contact: "email" },
      project: { project_confirmation: "confirmed" },
      materials: { existing_site__status: "different" },
    });
    expect(wrong.map((m) => m.fieldKey)).toEqual(["existing_site__note"]);
  });
});

describe("sanitizeAnswers", () => {
  const steps = stepsFor("new_website");

  it("drops unknown keys, trims values, and never stores static fields", () => {
    const result = sanitizeAnswers(steps, {
      contact: { contact_name: "  Jane ", bogus: "x" },
      project: { project_summary: "should not persist", project_confirmation: "confirmed" },
    });
    expect(result.contact).toEqual({ contact_name: "Jane" });
    expect(result.project).toEqual({ project_confirmation: "confirmed" });
  });

  it("preserves previously saved fields that the client did not send", () => {
    const result = sanitizeAnswers(
      steps,
      { contact: { contact_phone: "555" } },
      { contact: { contact_name: "Jane", contact_email: "jane@acme.test" } },
    );
    expect(result.contact).toEqual({ contact_name: "Jane", contact_email: "jane@acme.test", contact_phone: "555" });
  });

  it("ignores steps that were not sent", () => {
    const result = sanitizeAnswers(steps, { contact: { contact_name: "Jane" } });
    expect(Object.keys(result)).toEqual(["contact"]);
  });
});

describe("summarizeResponses", () => {
  const steps = stepsFor("new_website");

  it("buckets ready / later / help / discuss and folds detail fields into their group", () => {
    const summary = summarizeResponses(steps, {
      contact: { contact_name: "Jane", contact_email: "jane@acme.test", preferred_contact: "other", preferred_contact_other: "WhatsApp" },
      project: { project_confirmation: "discuss", project_discussion_note: "Can we add a blog?" },
      materials: {
        logo_brand__status: "ready",
        logo_brand__note: "https://drive.example/logo",
        photos__status: "later",
        written_content__status: "help",
        domain__status: "unsure",
      },
      review: { final_note: "Excited to start." },
    });

    const providedKeys = summary.provided.map((e) => e.fieldKey);
    expect(providedKeys).toContain("logo_brand__status");
    expect(summary.provided.find((e) => e.fieldKey === "logo_brand__status")?.value).toContain("https://drive.example/logo");
    expect(summary.provided.find((e) => e.fieldKey === "preferred_contact")?.value).toBe("Something else — WhatsApp");
    expect(providedKeys).not.toContain("preferred_contact_other");

    expect(summary.later.map((e) => e.fieldKey)).toEqual(["photos__status"]);
    expect(summary.help.map((e) => e.fieldKey)).toEqual(["written_content__status", "domain__status"]);

    const discussKeys = summary.discuss.map((e) => e.fieldKey);
    expect(discussKeys).toEqual(["project_confirmation", "final_note"]);
    expect(summary.discuss[0].value).toContain("Can we add a blog?");

    expect(summary.unanswered.map((e) => e.fieldKey)).toEqual(
      expect.arrayContaining(["contact_title", "contact_phone", "best_time_to_reach", "has_other_approver"]),
    );
  });

  it("lists a confirmed project under provided and keeps blank optional notes out of discuss", () => {
    const summary = summarizeResponses(steps, {
      project: { project_confirmation: "confirmed" },
      review: { final_note: "" },
    });
    expect(summary.provided.map((e) => e.fieldKey)).toContain("project_confirmation");
    expect(summary.discuss).toEqual([]);
    expect(summary.unanswered.find((e) => e.fieldKey === "project_confirmation")).toBeUndefined();
    expect(summary.unanswered.find((e) => e.fieldKey === "contact_name")?.required).toBe(true);
  });
});
