import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { projectDraftSchema, draftClientSchema } from "@/lib/projectDraft";
import {
  buildPendingSowPath,
  buildProjectSowPath,
  isPendingSowPath,
} from "@/lib/sowStorage";

const generateTextMock = vi.fn();
const chatMock = vi.fn((model: string, settings: unknown) => ({ model, settings }));

vi.mock("ai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("ai")>();
  return { ...actual, generateText: (args: unknown) => generateTextMock(args) };
});

vi.mock("@openrouter/ai-sdk-provider", () => ({
  createOpenRouter: () => ({ chat: chatMock }),
}));

const { SOW_MODEL, extractSow, normalizeExtraction } = await import("@/lib/sowExtraction");
type SowExtraction = Parameters<typeof normalizeExtraction>[0];

function extraction(overrides: Partial<SowExtraction> = {}): SowExtraction {
  return {
    client: {
      organization_name: "  Acme   Plumbing ",
      contact_name: "Jane Doe",
      contact_email: " Jane@Acme.com ",
      website_url: "https://acmeplumbing.com",
    },
    project: {
      title: "Marketing site",
      summary: "We'll rebuild your site.",
      start_date: "2026-10-01",
      target_date: "2026-11-15",
      contract_amount: 6000,
      deposit_percent: 50,
      billing_type: "monthly_plan",
    },
    milestones: [
      {
        title: "Design",
        description: null,
        due_date: "2026-10-15",
        tasks: [
          { title: "Homepage mockup", client_visible: true },
          { title: "Configure CI", client_visible: false },
          { title: "   ", client_visible: true },
        ],
      },
    ],
    client_requests: [
      { kind: "material", title: "Logo files", instructions: "SVG or PNG please." },
      { kind: "access", title: "", instructions: "dropped" },
    ],
    out_of_scope: ["E-commerce", " "],
    missing_fields: ["No phone number"],
    ...overrides,
  };
}

describe("normalizeExtraction", () => {
  it("produces a draft and client that pass the create schemas", () => {
    const result = normalizeExtraction(extraction());

    expect(result.client).toMatchObject({
      organization_name: "Acme Plumbing",
      contact_email: "jane@acme.com",
      billing_type: "monthly_plan",
    });
    expect(result.draft.milestones?.[0].tasks).toEqual([
      { title: "Homepage mockup", client_visible: true },
      { title: "Configure CI", client_visible: false },
    ]);
    expect(result.draft.requests).toHaveLength(1);
    expect(result.draft.out_of_scope).toEqual(["E-commerce"]);
    expect(result.notices).toEqual(["No phone number"]);

    expect(projectDraftSchema.safeParse(result.draft).success).toBe(true);
    expect(draftClientSchema.safeParse(result.client).success).toBe(true);
  });

  it("blanks invalid dates, emails, and amounts with a notice", () => {
    const result = normalizeExtraction(
      extraction({
        client: {
          organization_name: "Acme",
          contact_name: "Jane",
          contact_email: "jane at acme",
          website_url: null,
        },
        project: {
          title: "",
          summary: "",
          start_date: "October 1st",
          target_date: "2026-02-30",
          contract_amount: -5,
          deposit_percent: 150,
          billing_type: null,
        },
      }),
    );

    expect(result.client.contact_email).toBe("");
    expect(result.draft.project).toMatchObject({
      title: "New project",
      summary: null,
      start_date: null,
      target_date: null,
      contract_amount: null,
      deposit_percent: null,
    });
    expect(result.notices.some((n) => n.includes("jane at acme"))).toBe(true);
    expect(result.notices.some((n) => n.includes("October 1st"))).toBe(true);
    expect(result.notices.some((n) => n.includes("2026-02-30"))).toBe(true);
    expect(result.notices.some((n) => n.includes("contract amount"))).toBe(true);
    expect(result.notices.some((n) => n.includes("deposit percent"))).toBe(true);
    expect(projectDraftSchema.safeParse(result.draft).success).toBe(true);
  });

  it("caps oversized output and says so", () => {
    const manyMilestones = Array.from({ length: 20 }, (_, index) => ({
      title: `M${index}`,
      description: null,
      due_date: null,
      tasks: Array.from({ length: 40 }, (_, t) => ({ title: `T${t}`, client_visible: true })),
    }));
    const result = normalizeExtraction(
      extraction({
        milestones: manyMilestones,
        client_requests: Array.from({ length: 60 }, (_, i) => ({
          kind: "info" as const,
          title: `R${i}`,
          instructions: "x",
        })),
        out_of_scope: Array.from({ length: 50 }, (_, i) => `O${i}`),
      }),
    );

    expect(result.draft.milestones).toHaveLength(12);
    expect(result.draft.milestones?.[0].tasks).toHaveLength(25);
    expect(result.draft.requests).toHaveLength(30);
    expect(result.draft.out_of_scope).toHaveLength(30);
    expect(result.notices.some((n) => n.includes("20 milestones"))).toBe(true);
    expect(result.notices.some((n) => n.includes("40 tasks"))).toBe(true);
    expect(result.notices.some((n) => n.includes("60 client requests"))).toBe(true);
    expect(result.notices.some((n) => n.includes("50 out-of-scope items"))).toBe(true);
    expect(projectDraftSchema.safeParse(result.draft).success).toBe(true);
  });
});

describe("extractSow", () => {
  const originalKey = process.env.OPENROUTER_API_KEY;

  beforeEach(() => {
    generateTextMock.mockReset();
    chatMock.mockClear();
    process.env.OPENROUTER_API_KEY = "test-key";
  });

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.OPENROUTER_API_KEY;
    } else {
      process.env.OPENROUTER_API_KEY = originalKey;
    }
  });

  it("sends the PDF as a file part with the native PDF parser", async () => {
    generateTextMock.mockResolvedValue({ output: extraction() });
    const data = new Uint8Array([37, 80, 68, 70]);

    await extractSow({ kind: "pdf", data, fileName: "acme-sow.pdf" });

    expect(chatMock).toHaveBeenCalledWith(SOW_MODEL, {
      plugins: [{ id: "file-parser", pdf: { engine: "native" } }],
    });
    const args = generateTextMock.mock.calls[0][0] as {
      messages: Array<{ content: Array<Record<string, unknown>> }>;
      temperature: number;
    };
    expect(args.temperature).toBe(0);
    expect(args.messages[0].content[0]).toMatchObject({
      type: "file",
      mediaType: "application/pdf",
      filename: "acme-sow.pdf",
      data,
    });
  });

  it("sends pasted text as a text part", async () => {
    generateTextMock.mockResolvedValue({ output: extraction() });

    await extractSow({ kind: "text", text: "STATEMENT OF WORK ..." });

    const args = generateTextMock.mock.calls[0][0] as {
      messages: Array<{ content: Array<{ type: string; text?: string }> }>;
    };
    expect(args.messages[0].content).toHaveLength(1);
    expect(args.messages[0].content[0].type).toBe("text");
    expect(args.messages[0].content[0].text).toContain("STATEMENT OF WORK");
  });

  it("refuses to run without an API key", async () => {
    delete process.env.OPENROUTER_API_KEY;
    await expect(extractSow({ kind: "text", text: "x" })).rejects.toThrow(/OPENROUTER_API_KEY/);
    expect(generateTextMock).not.toHaveBeenCalled();
  });
});

describe("SOW storage paths", () => {
  it("builds pending paths the validator accepts", () => {
    const path = buildPendingSowPath("Acme SOW (signed).pdf", "0b8a3a5e-2f61-4c6e-9d0a-6b1b8c1f0e11");
    expect(path).toBe("pending/0b8a3a5e-2f61-4c6e-9d0a-6b1b8c1f0e11/Acme-SOW-signed-.pdf");
    expect(isPendingSowPath(path)).toBe(true);
    expect(isPendingSowPath(buildPendingSowPath("x.pdf"))).toBe(true);
  });

  it("rejects paths outside pending/ or with traversal", () => {
    expect(isPendingSowPath("org-1/proj-1/sow.pdf")).toBe(false);
    expect(isPendingSowPath("pending/../org-1/sow.pdf")).toBe(false);
    expect(isPendingSowPath("pending/0b8a3a5e-2f61-4c6e-9d0a-6b1b8c1f0e11/../../x.pdf")).toBe(false);
    expect(isPendingSowPath("pending/0b8a3a5e-2f61-4c6e-9d0a-6b1b8c1f0e11/a/b.pdf")).toBe(false);
    expect(isPendingSowPath("pending/0b8a3a5e-2f61-4c6e-9d0a-6b1b8c1f0e11/..")).toBe(false);
  });

  it("moves into an org/project folder keeping the file name", () => {
    expect(
      buildProjectSowPath("org", "proj", "pending/0b8a3a5e-2f61-4c6e-9d0a-6b1b8c1f0e11/acme.pdf"),
    ).toBe("org/proj/acme.pdf");
  });
});
