import { z } from "zod";

/**
 * The editable shape behind "create a project". The SOW extractor produces
 * one, the admin review form edits one, and the create route turns one into
 * rows. Validation here is for request bodies (not model output), so zod
 * length/range constraints are fine.
 */

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((value) => (value ? value : null));

const dateOnly = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((value) => (value ? value : null))
  .refine((value) => value === null || /^\d{4}-\d{2}-\d{2}$/.test(value), {
    message: "Dates must be YYYY-MM-DD.",
  });

const optionalAmount = (max: number) =>
  z
    .union([z.number(), z.string(), z.null()])
    .optional()
    .transform((value, ctx) => {
      if (value === null || value === undefined || value === "") return null;
      const parsed = typeof value === "number" ? value : Number(value);
      if (!Number.isFinite(parsed) || parsed < 0 || parsed > max) {
        ctx.addIssue({ code: "custom", message: `Must be between 0 and ${max}.` });
        return z.NEVER;
      }
      return Math.round(parsed * 100) / 100;
    });

export const draftTaskSchema = z.object({
  title: z.string().trim().min(1, "Every task needs a title.").max(200),
  client_visible: z.boolean().default(true),
});

export const draftMilestoneSchema = z.object({
  title: z.string().trim().min(1, "Every milestone needs a title.").max(200),
  description: optionalText(2000),
  due_date: dateOnly,
  tasks: z.array(draftTaskSchema).max(50).default([]),
});

export const draftRequestSchema = z.object({
  kind: z.enum(["material", "access", "decision", "info"]).default("material"),
  title: z.string().trim().min(1, "Every request needs a title.").max(200),
  instructions: optionalText(2000),
  due_date: dateOnly,
});

export const draftClientSchema = z.object({
  organization_name: z.string().trim().min(1, "Organization name is required.").max(200),
  contact_name: z.string().trim().min(1, "Contact name is required.").max(200),
  contact_email: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Contact email is invalid."),
  website_url: optionalText(500),
  billing_type: z
    .enum(["trade", "monthly_plan", "per_project"])
    .optional()
    .nullable()
    .transform((value) => value ?? null),
  notes: optionalText(5000),
});

export const draftProjectSchema = z.object({
  title: z.string().trim().min(1, "Project title is required.").max(200),
  summary: optionalText(5000),
  start_date: dateOnly,
  target_date: dateOnly,
  contract_amount: optionalAmount(99_999_999),
  deposit_percent: optionalAmount(100),
});

export const projectDraftSchema = z.object({
  project: draftProjectSchema,
  milestones: z.array(draftMilestoneSchema).max(30).default([]),
  requests: z.array(draftRequestSchema).max(50).default([]),
  out_of_scope: z.array(z.string().trim().min(1).max(500)).max(30).default([]),
});

export type ProjectDraft = z.infer<typeof projectDraftSchema>;
export type ProjectDraftInput = z.input<typeof projectDraftSchema>;
export type DraftClient = z.infer<typeof draftClientSchema>;
export type DraftClientInput = z.input<typeof draftClientSchema>;

export function emptyProjectDraft(): ProjectDraftInput {
  return {
    project: { title: "", summary: "" },
    milestones: [],
    requests: [],
    out_of_scope: [],
  };
}

/** First human-readable validation message, for a single error banner. */
export function firstIssueMessage(error: z.ZodError): string {
  const issue = error.issues[0];
  return issue?.message || "Invalid project details.";
}

export interface ProjectRows {
  milestones: Array<{
    id: string;
    project_id: string;
    organization_id: string;
    title: string;
    description: string | null;
    due_date: string | null;
    position: number;
  }>;
  tasks: Array<{
    project_id: string;
    organization_id: string;
    milestone_id: string;
    title: string;
    client_visible: boolean;
    position: number;
  }>;
  requests: Array<{
    project_id: string;
    organization_id: string;
    kind: ProjectDraft["requests"][number]["kind"];
    title: string;
    instructions: string | null;
    due_date: string | null;
    position: number;
  }>;
}

/**
 * Turn a validated draft into insert rows. Milestone ids are generated here
 * so tasks can reference them and each table needs only one insert.
 */
export function buildProjectRows(
  projectId: string,
  organizationId: string,
  draft: ProjectDraft,
  newId: () => string = () => crypto.randomUUID(),
): ProjectRows {
  const rows: ProjectRows = { milestones: [], tasks: [], requests: [] };

  draft.milestones.forEach((milestone, milestoneIndex) => {
    const milestoneId = newId();
    rows.milestones.push({
      id: milestoneId,
      project_id: projectId,
      organization_id: organizationId,
      title: milestone.title,
      description: milestone.description,
      due_date: milestone.due_date,
      position: milestoneIndex,
    });

    milestone.tasks.forEach((task, taskIndex) => {
      rows.tasks.push({
        project_id: projectId,
        organization_id: organizationId,
        milestone_id: milestoneId,
        title: task.title,
        client_visible: task.client_visible,
        position: taskIndex,
      });
    });
  });

  draft.requests.forEach((request, index) => {
    rows.requests.push({
      project_id: projectId,
      organization_id: organizationId,
      kind: request.kind,
      title: request.title,
      instructions: request.instructions,
      due_date: request.due_date,
      position: index,
    });
  });

  return rows;
}
