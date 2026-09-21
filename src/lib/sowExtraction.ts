import { generateText, Output, type FilePart, type TextPart } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { z } from "zod";
import type { DraftClientInput, ProjectDraftInput } from "@/lib/projectDraft";

export const SOW_MODEL = "anthropic/claude-sonnet-5";

// What the model must return. Strings, enums, arrays, and nullables only:
// Anthropic structured output rejects min/max/length constraints, so caps and
// format checks happen in normalizeExtraction() instead (same approach as
// ticketTriage.ts). Field descriptions are sent to the model as hints.
export const sowExtractionSchema = z.object({
  client: z.object({
    organization_name: z
      .string()
      .nullable()
      .describe("The client's business name as written in the SOW. Null if absent."),
    contact_name: z
      .string()
      .nullable()
      .describe("Full name of the client's signer or primary contact. Null if absent."),
    contact_email: z
      .string()
      .nullable()
      .describe("Client contact email exactly as written. Null if absent. Never invent one."),
    website_url: z
      .string()
      .nullable()
      .describe("Client's existing website URL if mentioned. Null otherwise."),
  }),
  project: z.object({
    title: z
      .string()
      .describe("Short project title, under 80 characters, e.g. 'Marketing website rebuild'."),
    summary: z
      .string()
      .describe(
        "Client-facing plain-English summary of what is being built and why, 2-4 sentences. Written to the client ('we'll build your…'). No prices, no legal terms.",
      ),
    start_date: z
      .string()
      .nullable()
      .describe("Project start date as YYYY-MM-DD if stated. Null if not stated. Never guess."),
    target_date: z
      .string()
      .nullable()
      .describe("Target completion or launch date as YYYY-MM-DD if stated. Null if not stated."),
    contract_amount: z
      .number()
      .nullable()
      .describe("Total project price in US dollars as a plain number, excluding recurring retainers. Null if absent."),
    deposit_percent: z
      .number()
      .nullable()
      .describe("Up-front deposit as a percent 0-100 (e.g. 50 for '50% up front'). Null if absent."),
    billing_type: z
      .enum(["trade", "monthly_plan", "per_project"])
      .nullable()
      .describe(
        "'monthly_plan' if the SOW includes an ongoing monthly retainer, 'trade' for a trade/barter agreement, 'per_project' for a fixed-price project with no retainer. Null if unclear.",
      ),
  }),
  milestones: z
    .array(
      z.object({
        title: z.string().describe("Milestone or phase name, e.g. 'Design'."),
        description: z
          .string()
          .nullable()
          .describe("One sentence on what the milestone delivers. Null if nothing useful."),
        due_date: z
          .string()
          .nullable()
          .describe("YYYY-MM-DD if the SOW dates this milestone. Null otherwise."),
        tasks: z
          .array(
            z.object({
              title: z
                .string()
                .describe("A concrete deliverable or step, under 100 characters, phrased as an outcome the client would recognize."),
              client_visible: z
                .boolean()
                .describe("False only for purely internal chores a client wouldn't care about (e.g. 'configure CI'). True otherwise."),
            }),
          )
          .describe("3-8 tasks for this milestone, derived from the deliverables in scope."),
      }),
    )
    .describe(
      "2-6 milestones in delivery order, following the SOW's phases if it has them; otherwise group deliverables into sensible phases ending in launch/handoff.",
    ),
  client_requests: z
    .array(
      z.object({
        kind: z
          .enum(["material", "access", "decision", "info"])
          .describe("'material' = files or content (logo, photos, copy). 'access' = accounts to be granted (domain registrar, hosting, analytics). 'decision' = a choice the client must make. 'info' = facts only the client knows."),
        title: z.string().describe("Short name, e.g. 'Logo files' or 'Domain registrar access'."),
        instructions: z
          .string()
          .describe("One or two friendly sentences telling the client exactly what to provide. For access, describe adding Kyle as a user or delegate — NEVER ask for passwords."),
      }),
    )
    .describe(
      "Things the client must provide for the work to proceed, based on the SOW's client responsibilities and deliverables. Do not include payment. Empty array if none apply.",
    ),
  out_of_scope: z
    .array(z.string())
    .describe("Items the SOW explicitly excludes or lists as out of scope, one short phrase each. Empty array if none."),
  missing_fields: z
    .array(z.string())
    .describe("Short notes on important details the SOW does not state, e.g. 'No client email in SOW', 'No target date'. Empty array if complete."),
});

export type SowExtraction = z.infer<typeof sowExtractionSchema>;

export type SowInput =
  | { kind: "pdf"; data: Uint8Array; fileName: string }
  | { kind: "text"; text: string };

const SYSTEM_PROMPT = [
  "You read a signed Statement of Work (SOW) for Kyle Greer's one-person software studio (KYGR Solutions) and extract the details needed to set up the client and project in his CRM.",
  "Kyle is the vendor. The client is the other party. Never put Kyle or KYGR Solutions in the client fields.",
  "Extract only what the document supports. Use null for anything not stated; do not invent emails, dates, or amounts. Milestones and tasks may be organized from the scope when the SOW lists deliverables without phases.",
  "The project summary, milestone and task titles, and client request instructions are shown to the client, so write them warmly and plainly. Out-of-scope items and missing-field notes are internal.",
].join("\n");

function clean(value: string | null | undefined, max: number): string | null {
  const trimmed = value?.replace(/\s+/g, " ").trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

function cleanMultiline(value: string | null | undefined, max: number): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

function cleanDate(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed || !/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const parsed = new Date(`${trimmed}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== trimmed
    ? null
    : trimmed;
}

function cleanEmail(value: string | null | undefined): string | null {
  const trimmed = value?.trim().toLowerCase();
  return trimmed && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) ? trimmed.slice(0, 254) : null;
}

function cleanAmount(value: number | null | undefined, max: number): number | null {
  if (value === null || value === undefined || !Number.isFinite(value) || value < 0 || value > max) {
    return null;
  }
  return Math.round(value * 100) / 100;
}

export interface NormalizedSow {
  client: Partial<DraftClientInput>;
  draft: ProjectDraftInput;
  notices: string[];
}

/**
 * Coerce model output into a form-ready draft: trim and cap strings, drop
 * invalid dates/emails/amounts (adding a notice for each), and cap array
 * sizes to what the draft schema accepts.
 */
export function normalizeExtraction(extraction: SowExtraction): NormalizedSow {
  const notices = extraction.missing_fields
    .map((note) => clean(note, 200))
    .filter((note): note is string => Boolean(note))
    .slice(0, 10);

  const rawEmail = extraction.client.contact_email;
  const contactEmail = cleanEmail(rawEmail);
  if (rawEmail && !contactEmail) {
    notices.push(`Contact email "${rawEmail.slice(0, 80)}" didn't look valid and was left blank.`);
  }

  const dateNotice = (label: string, raw: string | null) => {
    const cleaned = cleanDate(raw);
    if (raw && !cleaned) notices.push(`${label} "${raw.slice(0, 40)}" wasn't a valid date and was left blank.`);
    return cleaned;
  };

  const milestoneCount = extraction.milestones.length;
  const milestones = extraction.milestones.slice(0, 12).map((milestone) => ({
    title: clean(milestone.title, 200) || "Milestone",
    description: cleanMultiline(milestone.description, 2000),
    due_date: cleanDate(milestone.due_date),
    tasks: milestone.tasks
      .map((task) => ({
        title: clean(task.title, 200),
        client_visible: task.client_visible !== false,
      }))
      .filter((task): task is { title: string; client_visible: boolean } => Boolean(task.title))
      .slice(0, 25),
  }));
  if (milestoneCount > milestones.length) {
    notices.push(`The SOW produced ${milestoneCount} milestones; only the first ${milestones.length} were kept.`);
  }

  const requests = extraction.client_requests
    .map((request) => ({
      kind: request.kind,
      title: clean(request.title, 200),
      instructions: cleanMultiline(request.instructions, 2000),
    }))
    .filter((request): request is typeof request & { title: string } => Boolean(request.title))
    .slice(0, 30);

  const contractAmount = cleanAmount(extraction.project.contract_amount, 99_999_999);
  const depositPercent = cleanAmount(extraction.project.deposit_percent, 100);

  return {
    client: {
      organization_name: clean(extraction.client.organization_name, 200) || "",
      contact_name: clean(extraction.client.contact_name, 200) || "",
      contact_email: contactEmail || "",
      website_url: clean(extraction.client.website_url, 500),
      billing_type: extraction.project.billing_type,
    },
    draft: {
      project: {
        title: clean(extraction.project.title, 200) || "New project",
        summary: cleanMultiline(extraction.project.summary, 5000),
        start_date: dateNotice("Start date", extraction.project.start_date),
        target_date: dateNotice("Target date", extraction.project.target_date),
        contract_amount: contractAmount,
        deposit_percent: depositPercent,
      },
      milestones,
      requests,
      out_of_scope: extraction.out_of_scope
        .map((line) => clean(line, 500))
        .filter((line): line is string => Boolean(line))
        .slice(0, 30),
    },
    notices,
  };
}

/**
 * Read a SOW with the model. Throws on missing configuration or model
 * failure; the caller turns that into a message and the admin can fall back
 * to entering the project by hand.
 */
export async function extractSow(input: SowInput): Promise<SowExtraction> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set.");
  }

  const openrouter = createOpenRouter({ apiKey });
  const content: Array<TextPart | FilePart> =
    input.kind === "pdf"
      ? [
          { type: "file", data: input.data, mediaType: "application/pdf", filename: input.fileName },
          { type: "text", text: "Extract the client and project details from this signed SOW." },
        ]
      : [
          {
            type: "text",
            text: `Extract the client and project details from this signed SOW:\n\n${input.text.slice(0, 120_000)}`,
          },
        ];

  const { output } = await generateText({
    model: openrouter.chat(SOW_MODEL, {
      plugins: [{ id: "file-parser", pdf: { engine: "native" } }],
    }),
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content }],
    output: Output.object({ schema: sowExtractionSchema }),
    temperature: 0,
  });

  return output;
}
