import { z } from "zod";
import {
  draftMilestoneSchema,
  draftProjectSchema,
  draftRequestSchema,
  draftTaskSchema,
} from "@/lib/projectDraft";

/**
 * Admin edits to an existing project and its items. Create payloads reuse the
 * draft schemas; patches accept any subset of fields.
 */

export const projectItemTypes = ["milestone", "task", "request"] as const;
export type ProjectItemType = (typeof projectItemTypes)[number];

export const projectItemTables: Record<ProjectItemType, string> = {
  milestone: "project_milestones",
  task: "project_tasks",
  request: "project_requests",
};

export const projectPatchSchema = draftProjectSchema
  .extend({ status: z.enum(["active", "paused", "done"]) })
  .partial();

const position = z.number().int().min(0).max(10_000);

export const createItemSchema = z.discriminatedUnion("type", [
  draftMilestoneSchema
    .omit({ tasks: true })
    .extend({ type: z.literal("milestone") }),
  draftTaskSchema.extend({
    type: z.literal("task"),
    milestone_id: z.uuid().nullable().default(null),
  }),
  draftRequestSchema.extend({ type: z.literal("request") }),
]);

export const patchItemSchema = z.discriminatedUnion("type", [
  draftMilestoneSchema
    .omit({ tasks: true })
    .partial()
    .extend({ type: z.literal("milestone"), position: position.optional() }),
  draftTaskSchema.partial().extend({
    type: z.literal("task"),
    milestone_id: z.uuid().nullable().optional(),
    position: position.optional(),
    done: z.boolean().optional(),
  }),
  draftRequestSchema.partial().extend({
    type: z.literal("request"),
    status: z.enum(["open", "later", "done"]).optional(),
    position: position.optional(),
  }),
]);

export type CreateItemInput = z.infer<typeof createItemSchema>;
export type PatchItemInput = z.infer<typeof patchItemSchema>;

/**
 * Keep only keys the caller actually sent. The shared field schemas apply
 * defaults and turn missing optional text into null (right for creates), and
 * zod v4 applies those even under `.partial()`, so without this a patch that
 * only renames a task would also reset its visibility and clear notes.
 */
export function onlyProvided<T extends Record<string, unknown>>(
  parsed: T,
  raw: unknown,
): Partial<T> {
  if (!raw || typeof raw !== "object") {
    return {};
  }
  const sent = new Set(Object.keys(raw));
  return Object.fromEntries(
    Object.entries(parsed).filter(([key]) => sent.has(key)),
  ) as Partial<T>;
}

/** Strip the discriminator and translate `done` into `done_at`. */
export function toItemUpdate(
  patch: PatchItemInput,
  raw: unknown,
  now: Date = new Date(),
): Record<string, unknown> {
  const update: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(onlyProvided(patch, raw))) {
    if (value === undefined || key === "type") continue;
    if (key === "done") {
      update.done_at = value ? now.toISOString() : null;
      continue;
    }
    update[key] = value;
  }

  return update;
}

export function toItemInsert(
  input: CreateItemInput,
  projectId: string,
  organizationId: string,
  nextPosition: number,
): Record<string, unknown> {
  const fields: Record<string, unknown> = { ...input };
  delete fields.type;
  return {
    ...fields,
    project_id: projectId,
    organization_id: organizationId,
    position: nextPosition,
  };
}
