import type {
  OnboardingAnswers,
  OnboardingChoice,
  OnboardingFlowVersion,
  OnboardingPlan,
  OnboardingStepDefinition,
  OnboardingStepField,
  OnboardingStepStatus,
  OnboardingSummaryBucket,
  ProjectType,
} from "@/types/crm";
import { legacyOnboardingSteps } from "./onboardingLegacySteps";
import { requestedItemDefinitions } from "./onboardingPresets";

/**
 * Pure helpers that turn an admin-prepared onboarding plan into the client
 * questionnaire and that reason about answers (visibility, completeness,
 * summaries). No I/O — safe to import from server routes, server components,
 * client components, and tests.
 */

export const V2_STEP_KEYS = {
  contact: "contact",
  project: "project",
  materials: "materials",
  review: "review",
} as const;

export interface KnownClientInfo {
  organizationName?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  websiteUrl?: string | null;
}

export interface BuildStepsInput {
  flowVersion: OnboardingFlowVersion | null | undefined;
  projectType?: ProjectType | null;
  plan?: OnboardingPlan | null;
  projectSummary?: string | null;
  known?: KnownClientInfo | null;
}

export const emptyPlan: OnboardingPlan = {
  deliverables: [],
  requestedItems: {},
  customItems: [],
  knownInfo: {},
};

export function normalizePlan(value: unknown): OnboardingPlan {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ...emptyPlan };
  }
  const raw = value as Partial<OnboardingPlan>;
  return {
    deliverables: Array.isArray(raw.deliverables)
      ? raw.deliverables.filter((d): d is string => typeof d === "string")
      : [],
    requestedItems:
      raw.requestedItems && typeof raw.requestedItems === "object"
        ? raw.requestedItems
        : {},
    customItems: Array.isArray(raw.customItems) ? raw.customItems : [],
    knownInfo:
      raw.knownInfo && typeof raw.knownInfo === "object" ? raw.knownInfo : {},
  };
}

// ---------------------------------------------------------------------------
// Choice sets
// ---------------------------------------------------------------------------

const materialChoices: OnboardingChoice[] = [
  { value: "ready", label: "I have it ready", outcome: "provided" },
  { value: "later", label: "I'll send it later", outcome: "later" },
  { value: "help", label: "I need help with this", outcome: "help" },
];

const yesNoUnsureChoices: OnboardingChoice[] = [
  { value: "yes", label: "Yes", outcome: "provided" },
  { value: "no", label: "No, not yet", outcome: "provided" },
  { value: "unsure", label: "Not sure", outcome: "help" },
];

// ---------------------------------------------------------------------------
// Step builders
// ---------------------------------------------------------------------------

function buildContactStep(
  plan: OnboardingPlan,
  known: KnownClientInfo,
): OnboardingStepDefinition {
  const fields: OnboardingStepField[] = [
    {
      key: "contact_name",
      label: "Your name",
      type: "text",
      required: true,
      prefill: known.contactName?.trim() || undefined,
      helpText: "The person we'll work with day to day. Correct it if we have it wrong.",
    },
    {
      key: "contact_email",
      label: "Best email",
      type: "email",
      required: true,
      prefill: known.contactEmail?.trim() || undefined,
      helpText:
        "Where project updates should go. Changing this doesn't change the email you sign in with.",
    },
    {
      key: "contact_title",
      label: "Your role",
      type: "text",
      prefill: plan.knownInfo.contactTitle?.trim() || undefined,
      placeholder: "Owner, office manager, marketing lead…",
    },
    {
      key: "contact_phone",
      label: "Phone number",
      type: "text",
      prefill: plan.knownInfo.contactPhone?.trim() || undefined,
      placeholder: "Best number to reach you",
      helpText: "Only used if something needs a quick call.",
    },
    {
      key: "preferred_contact",
      label: "How do you prefer we reach you?",
      type: "choice",
      required: true,
      choices: [
        { value: "email", label: "Email" },
        { value: "phone", label: "Phone or text" },
        { value: "portal", label: "Portal tickets" },
        { value: "other", label: "Something else" },
      ],
    },
    {
      key: "preferred_contact_other",
      label: "Tell us what works",
      type: "text",
      group: "preferred_contact",
      showWhen: { field: "preferred_contact", in: ["other"] },
      placeholder: "e.g. WhatsApp, Slack",
    },
    {
      key: "best_time_to_reach",
      label: "When is it convenient to reach you?",
      type: "choice",
      choices: [
        { value: "mornings", label: "Mornings" },
        { value: "afternoons", label: "Afternoons" },
        { value: "any_weekday", label: "Any time on weekdays" },
        { value: "email_first", label: "Email first, please" },
      ],
      helpText: "This just helps us pick good times to check in. It doesn't change anything in our agreement.",
    },
    {
      key: "has_other_approver",
      label: "Does anyone else need to approve the work?",
      type: "choice",
      choices: [
        { value: "just_me", label: "Just me" },
        { value: "someone_else", label: "Someone else also approves" },
      ],
    },
    {
      key: "approver_details",
      label: "Who else approves?",
      type: "person_list",
      group: "has_other_approver",
      showWhen: { field: "has_other_approver", in: ["someone_else"] },
      helpText: "Name and role is plenty. We'll include them on reviews.",
    },
  ];

  if (plan.knownInfo.supportCoverage?.trim()) {
    fields.push({
      key: "support_coverage",
      label: "Your support coverage",
      type: "static",
      content: plan.knownInfo.supportCoverage.trim(),
    });
  }

  return {
    key: V2_STEP_KEYS.contact,
    title: "Contact and communication",
    description:
      "Confirm how we reach you. We've filled in what we already know — just fix anything that's off.",
    fields,
  };
}

function buildProjectStep(
  plan: OnboardingPlan,
  projectSummary: string | null | undefined,
): OnboardingStepDefinition {
  const summaryLines: string[] = [];
  if (projectSummary?.trim()) {
    summaryLines.push(projectSummary.trim());
  }
  if (plan.deliverables.length > 0) {
    summaryLines.push("");
    summaryLines.push("Main deliverables:");
    for (const deliverable of plan.deliverables) {
      summaryLines.push(`• ${deliverable}`);
    }
  }

  return {
    key: V2_STEP_KEYS.project,
    title: "Project confirmation",
    description:
      "A plain-language recap of what we agreed. This is a confirmation aid — it doesn't change the signed agreement. Anything you flag here we'll talk through separately.",
    fields: [
      {
        key: "project_summary",
        label: "What we're building",
        type: "static",
        content:
          summaryLines.join("\n").trim() ||
          "Kyle hasn't added a summary yet. If this looks empty, choose \"There's something I'd like to discuss\" and let us know.",
      },
      {
        key: "project_confirmation",
        label: "Does this match your understanding?",
        type: "choice",
        required: true,
        choices: [
          { value: "confirmed", label: "Yes, looks right", outcome: "provided" },
          {
            value: "discuss",
            label: "There's something I'd like to discuss",
            outcome: "discuss",
          },
        ],
      },
      {
        key: "project_discussion_note",
        label: "What would you like to discuss? (optional)",
        type: "textarea",
        group: "project_confirmation",
        showWhen: { field: "project_confirmation", in: ["discuss"] },
        placeholder: "A sentence or two is plenty. We'll follow up with you.",
      },
    ],
  };
}

interface AskedItem {
  key: string;
  label: string;
  adminNote: string;
  question?: string;
  help?: string;
  noteLabel?: string;
  notePlaceholder?: string;
  kind: "material" | "domain" | "existing_site" | "existing_app" | "access";
}

function getAskedItems(plan: OnboardingPlan): AskedItem[] {
  const asked: AskedItem[] = [];

  for (const [key, selection] of Object.entries(plan.requestedItems)) {
    if (selection?.status !== "ask") continue;
    const definition = requestedItemDefinitions[key];
    if (!definition) continue;
    asked.push({
      key,
      label: definition.label,
      adminNote: selection.note?.trim() || "",
      question: definition.clientQuestion,
      help: definition.clientHelp,
      noteLabel: definition.noteLabel,
      notePlaceholder: definition.notePlaceholder,
      kind: definition.kind,
    });
  }

  for (const custom of plan.customItems) {
    const key = custom.key?.trim();
    if (!key) continue;
    const selection = plan.requestedItems[key];
    if (selection && selection.status !== "ask") continue;
    asked.push({
      key,
      label: custom.label?.trim() || key,
      adminNote: selection?.note?.trim() || "",
      question: custom.question?.trim() || custom.label,
      noteLabel: "Anything you can share now",
      notePlaceholder: "Paste a link or tell us where it lives",
      kind: "material",
    });
  }

  return asked;
}

function buildMaterialsStep(
  plan: OnboardingPlan,
  projectType: ProjectType,
  known: KnownClientInfo,
): OnboardingStepDefinition {
  const asked = getAskedItems(plan);
  const fields: OnboardingStepField[] = [];
  const accessItems: AskedItem[] = [];

  for (const item of asked) {
    switch (item.kind) {
      case "material": {
        fields.push({
          key: `${item.key}__status`,
          label: item.question || item.label,
          type: "choice",
          group: item.key,
          choices: materialChoices,
          helpText: item.help,
        });
        fields.push({
          key: `${item.key}__note`,
          label: item.noteLabel || "Where can we find it?",
          type: "text",
          group: item.key,
          showWhen: { field: `${item.key}__status`, in: ["ready"] },
          placeholder: item.notePlaceholder,
        });
        break;
      }
      case "domain": {
        const knownDomain = plan.knownInfo.domainName?.trim();
        fields.push({
          key: "domain__status",
          label: knownDomain
            ? `We have your domain as ${knownDomain}. Is that the one you'd like to use?`
            : "Do you already have a domain name you'd like to use?",
          type: "choice",
          group: "domain",
          choices: knownDomain
            ? [
                { value: "yes", label: "Yes, that's right", outcome: "provided" },
                { value: "different", label: "No, it's different", outcome: "provided" },
                { value: "unsure", label: "Not sure", outcome: "help" },
              ]
            : yesNoUnsureChoices,
          helpText:
            "A domain is your web address, like yourbusiness.com. If you're not sure whether you own one, choose Not sure and we'll check together.",
        });
        fields.push({
          key: "domain__note",
          label: "What's the domain?",
          type: "text",
          group: "domain",
          showWhen: { field: "domain__status", in: knownDomain ? ["different"] : ["yes"] },
          placeholder: "yourbusiness.com",
        });
        break;
      }
      case "existing_site": {
        const knownUrl = plan.knownInfo.existingUrl?.trim() || known.websiteUrl?.trim();
        if (knownUrl) {
          fields.push({
            key: "existing_site__status",
            label: `We have your website as ${knownUrl}. Is that right?`,
            type: "choice",
            required: true,
            group: "existing_site",
            choices: [
              { value: "yes", label: "Yes, that's right", outcome: "provided" },
              { value: "different", label: "No, it's different", outcome: "provided" },
            ],
          });
          fields.push({
            key: "existing_site__note",
            label: "What's the correct address?",
            type: "url",
            required: true,
            group: "existing_site",
            showWhen: { field: "existing_site__status", in: ["different"] },
            placeholder: "https://",
          });
        } else {
          fields.push({
            key: "existing_site__note",
            label: "What's the address of your current website?",
            type: "url",
            required: true,
            group: "existing_site",
            placeholder: "https://",
            helpText: "If you're not sure of the exact address, the name of the business is fine.",
          });
        }
        break;
      }
      case "existing_app": {
        fields.push({
          key: "existing_app__note",
          label: "Which app are we working on?",
          type: "text",
          required: true,
          group: "existing_app",
          placeholder: "Name or link",
          helpText: "The name you call it internally is fine. A link helps if you have one.",
        });
        fields.push({
          key: "existing_app__context",
          label: "Anything we should know about it? (optional)",
          type: "textarea",
          group: "existing_app",
          placeholder: "Who built it, where it runs, or anything that's been a headache.",
        });
        break;
      }
      case "access": {
        accessItems.push(item);
        break;
      }
    }
  }

  if (accessItems.length > 0) {
    const listLines = accessItems.map((item) =>
      item.adminNote ? `• ${item.label}: ${item.adminNote}` : `• ${item.label}`,
    );
    fields.push({
      key: "access__list",
      label: "Accounts we'll need access to",
      type: "static",
      content: `${listLines.join("\n")}\n\nWe'll send step-by-step instructions for each one. You never need to type a password into this form.`,
    });
    fields.push({
      key: "access_helper",
      label: "Who can help us get access?",
      type: "choice",
      group: "access",
      choices: [
        { value: "me", label: "I can", outcome: "provided" },
        { value: "someone_else", label: "Someone else on my team", outcome: "provided" },
        { value: "help", label: "I'm not sure — please help me", outcome: "help" },
      ],
    });
    fields.push({
      key: "access_contact",
      label: "Who should we contact?",
      type: "text",
      group: "access",
      showWhen: { field: "access_helper", in: ["someone_else"] },
      placeholder: "Name and email or phone",
    });
  }

  const descriptions: Record<ProjectType, string> = {
    new_website:
      "Share whatever you already have. Anything you don't have yet, you can send later or ask us for help.",
    existing_website:
      "Confirm the site we're working on and tell us who can help with access. Nothing here is urgent.",
    new_app:
      "Only the things we identified during scoping. Send what's ready; the rest we'll work through together.",
    existing_app:
      "Confirm the app we're working on and tell us who can help with access.",
  };

  return {
    key: V2_STEP_KEYS.materials,
    title: "Materials and access",
    description:
      fields.length === 0
        ? "Nothing is needed from you for this step right now. We already have what we need to start."
        : descriptions[projectType],
    fields,
  };
}

function buildReviewStep(): OnboardingStepDefinition {
  return {
    key: V2_STEP_KEYS.review,
    title: "Review and submit",
    description:
      "Check your answers. Anything marked as sending later or needing help stays on our shared list.",
    fields: [
      {
        key: "final_note",
        label: "Anything else before we start? (optional)",
        type: "textarea",
        outcome: "discuss",
        placeholder: "Questions, timing, or anything that's been on your mind.",
      },
    ],
  };
}

export function buildOnboardingSteps(
  input: BuildStepsInput,
): OnboardingStepDefinition[] {
  if (input.flowVersion !== "v2") {
    return legacyOnboardingSteps;
  }

  const plan = normalizePlan(input.plan);
  const known = input.known ?? {};
  const projectType: ProjectType = input.projectType ?? "new_website";

  return [
    buildContactStep(plan, known),
    buildProjectStep(plan, input.projectSummary),
    buildMaterialsStep(plan, projectType, known),
    buildReviewStep(),
  ];
}

// ---------------------------------------------------------------------------
// Answer helpers
// ---------------------------------------------------------------------------

export function isAnswered(value: string | undefined | null): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  // person_list stores JSON; treat empty lists as unanswered.
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.some((entry) => {
          if (!entry || typeof entry !== "object") return false;
          return Object.values(entry as Record<string, unknown>).some(
            (v) => typeof v === "string" && v.trim(),
          );
        });
      }
    } catch {
      return true;
    }
  }
  return true;
}

export function isFieldVisible(
  field: OnboardingStepField,
  stepAnswers: Record<string, string> | undefined,
): boolean {
  if (!field.showWhen) return true;
  const controlling = stepAnswers?.[field.showWhen.field] ?? "";
  return field.showWhen.in.includes(controlling);
}

export function isDataField(field: OnboardingStepField): boolean {
  return field.type !== "static";
}

export function getVisibleFields(
  step: OnboardingStepDefinition,
  answers: OnboardingAnswers,
): OnboardingStepField[] {
  const stepAnswers = answers[step.key];
  return step.fields.filter((field) => isFieldVisible(field, stepAnswers));
}

export function getStepStatus(
  step: OnboardingStepDefinition,
  answers: OnboardingAnswers,
): OnboardingStepStatus {
  const stepAnswers = answers[step.key] ?? {};
  const visible = getVisibleFields(step, answers).filter(isDataField);

  if (visible.length === 0) {
    return "complete";
  }

  const answeredCount = visible.filter((field) =>
    isAnswered(stepAnswers[field.key]),
  ).length;
  const missingRequired = visible.some(
    (field) => field.required && !isAnswered(stepAnswers[field.key]),
  );

  if (answeredCount === 0) {
    return "not_started";
  }
  if (missingRequired) {
    return "in_progress";
  }
  return "complete";
}

export const stepStatusLabels: Record<OnboardingStepStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  complete: "Complete",
};

export function computeCompletedSteps(
  steps: OnboardingStepDefinition[],
  answers: OnboardingAnswers,
): string[] {
  return steps
    .filter((step) => getStepStatus(step, answers) === "complete")
    .map((step) => step.key);
}

export interface MissingField {
  stepKey: string;
  stepTitle: string;
  fieldKey: string;
  label: string;
}

export function validateSubmission(
  steps: OnboardingStepDefinition[],
  answers: OnboardingAnswers,
): MissingField[] {
  const missing: MissingField[] = [];
  for (const step of steps) {
    const stepAnswers = answers[step.key] ?? {};
    for (const field of getVisibleFields(step, answers)) {
      if (!isDataField(field) || !field.required) continue;
      if (!isAnswered(stepAnswers[field.key])) {
        missing.push({
          stepKey: step.key,
          stepTitle: step.title,
          fieldKey: field.key,
          label: field.label,
        });
      }
    }
  }
  return missing;
}

/**
 * Keeps only known, visible-or-not data fields; trims and caps strings; and
 * preserves previously saved values for fields the client didn't send.
 */
export function sanitizeAnswers(
  steps: OnboardingStepDefinition[],
  incoming: unknown,
  existing: OnboardingAnswers = {},
): OnboardingAnswers {
  const result: OnboardingAnswers = {};
  const source =
    incoming && typeof incoming === "object" && !Array.isArray(incoming)
      ? (incoming as Record<string, unknown>)
      : {};

  for (const step of steps) {
    const incomingStep = source[step.key];
    const existingStep = existing[step.key] ?? {};
    if (
      !incomingStep ||
      typeof incomingStep !== "object" ||
      Array.isArray(incomingStep)
    ) {
      continue;
    }
    const incomingRecord = incomingStep as Record<string, unknown>;
    const next: Record<string, string> = {};
    for (const field of step.fields) {
      if (!isDataField(field)) continue;
      const value = incomingRecord[field.key];
      if (typeof value === "string") {
        next[field.key] = value.trim().slice(0, 5000);
      } else if (typeof existingStep[field.key] === "string") {
        next[field.key] = existingStep[field.key];
      }
    }
    result[step.key] = next;
  }

  return result;
}

/** Starting answers = saved answers, falling back to admin-known prefill values. */
export function buildInitialAnswers(
  steps: OnboardingStepDefinition[],
  saved: OnboardingAnswers,
): OnboardingAnswers {
  const result: OnboardingAnswers = {};
  for (const step of steps) {
    const savedStep = saved[step.key] ?? {};
    const next: Record<string, string> = { ...savedStep };
    for (const field of step.fields) {
      if (!isDataField(field)) continue;
      if (!isAnswered(next[field.key]) && field.prefill) {
        next[field.key] = field.prefill;
      }
    }
    result[step.key] = next;
  }
  return result;
}

// ---------------------------------------------------------------------------
// Summaries (client review step, portal recap, admin follow-up)
// ---------------------------------------------------------------------------

export interface SummaryEntry {
  stepKey: string;
  stepTitle: string;
  fieldKey: string;
  label: string;
  /** Human-readable value (choice labels resolved, details appended). */
  value: string;
  required: boolean;
}

export interface ResponseSummary {
  provided: SummaryEntry[];
  later: SummaryEntry[];
  help: SummaryEntry[];
  discuss: SummaryEntry[];
  /** Visible data fields without an answer. */
  unanswered: SummaryEntry[];
}

export function getChoiceLabel(
  field: OnboardingStepField,
  value: string,
): string {
  if (field.type === "choice") {
    return field.choices?.find((choice) => choice.value === value)?.label ?? value;
  }
  return value;
}

function formatPersonList(raw: string): string {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return parsed
        .map((entry) => {
          if (!entry || typeof entry !== "object") return "";
          const obj = entry as Record<string, unknown>;
          const name = typeof obj.name === "string" ? obj.name.trim() : "";
          const role = typeof obj.role === "string" ? obj.role.trim() : "";
          if (name && role) return `${name} — ${role}`;
          return name || role;
        })
        .filter(Boolean)
        .join("\n");
    }
  } catch {
    // fall through
  }
  return raw;
}

export function formatAnswer(field: OnboardingStepField, value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (field.type === "choice") return getChoiceLabel(field, trimmed);
  if (field.type === "person_list") return formatPersonList(trimmed);
  if (field.type === "checkboxes") return trimmed.split(",").filter(Boolean).join(", ");
  return trimmed;
}

export function summarizeResponses(
  steps: OnboardingStepDefinition[],
  answers: OnboardingAnswers,
): ResponseSummary {
  const summary: ResponseSummary = {
    provided: [],
    later: [],
    help: [],
    discuss: [],
    unanswered: [],
  };

  for (const step of steps) {
    const stepAnswers = answers[step.key] ?? {};
    const visible = getVisibleFields(step, answers).filter(isDataField);
    const handled = new Set<string>();

    for (const field of visible) {
      if (handled.has(field.key)) continue;

      const value = stepAnswers[field.key] ?? "";
      // A group is led by its choice field. The group id defaults to the
      // primary field key, so detail fields can point at it via `group`.
      const groupId = field.group ?? field.key;
      const primaryOf = (candidate: OnboardingStepField) =>
        visible.find(
          (f) =>
            f.type === "choice" &&
            f.key !== candidate.key &&
            (f.key === candidate.group || (f.group && f.group === candidate.group)),
        );
      const isDetail = field.type !== "choice" && Boolean(field.group) && Boolean(primaryOf(field));

      if (isDetail) {
        // Folded into the primary choice field below.
        continue;
      }

      const groupMembers =
        field.type === "choice"
          ? visible.filter(
              (f) => f.key !== field.key && f.type !== "choice" && f.group === groupId,
            )
          : [];

      const details = groupMembers
        .map((member) => {
          handled.add(member.key);
          const memberValue = stepAnswers[member.key] ?? "";
          return isAnswered(memberValue) ? formatAnswer(member, memberValue) : "";
        })
        .filter(Boolean);

      const entryBase = {
        stepKey: step.key,
        stepTitle: step.title,
        fieldKey: field.key,
        label: field.label,
        required: Boolean(field.required),
      };

      if (!isAnswered(value)) {
        summary.unanswered.push({ ...entryBase, value: "" });
        continue;
      }

      let bucket: OnboardingSummaryBucket = field.outcome ?? "provided";
      if (field.type === "choice") {
        bucket =
          field.choices?.find((choice) => choice.value === value)?.outcome ??
          "provided";
      }

      const formatted = [formatAnswer(field, value), ...details].join(" — ");
      summary[bucket].push({ ...entryBase, value: formatted });
    }
  }

  return summary;
}

export const summaryBucketLabels: Record<OnboardingSummaryBucket, string> = {
  provided: "Provided",
  later: "Sending later",
  help: "Needs help",
  discuss: "To discuss",
};
