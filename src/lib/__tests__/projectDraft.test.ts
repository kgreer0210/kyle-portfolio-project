import { describe, expect, it } from "vitest";
import {
  buildProjectRows,
  draftClientSchema,
  projectDraftSchema,
} from "@/lib/projectDraft";
import { onlyProvided, patchItemSchema, toItemUpdate } from "@/lib/projectItems";

describe("projectDraftSchema", () => {
  it("normalizes blanks to null and applies defaults", () => {
    const draft = projectDraftSchema.parse({
      project: {
        title: "  New site ",
        summary: "",
        start_date: "",
        contract_amount: "6000.555",
        deposit_percent: 50,
      },
      milestones: [{ title: "Design", tasks: [{ title: "Mockup" }] }],
      requests: [{ title: "Logo" }],
    });

    expect(draft.project).toMatchObject({
      title: "New site",
      summary: null,
      start_date: null,
      contract_amount: 6000.56,
      deposit_percent: 50,
    });
    expect(draft.milestones[0].tasks[0].client_visible).toBe(true);
    expect(draft.requests[0].kind).toBe("material");
    expect(draft.out_of_scope).toEqual([]);
  });

  it("rejects bad dates, amounts, and missing titles", () => {
    expect(
      projectDraftSchema.safeParse({ project: { title: "x", start_date: "10/01/2026" } })
        .success,
    ).toBe(false);
    expect(
      projectDraftSchema.safeParse({ project: { title: "x", deposit_percent: 150 } })
        .success,
    ).toBe(false);
    expect(
      projectDraftSchema.safeParse({ project: { title: "x", contract_amount: "abc" } })
        .success,
    ).toBe(false);
    expect(projectDraftSchema.safeParse({ project: { title: " " } }).success).toBe(false);
  });

  it("validates and lowercases client email", () => {
    const client = draftClientSchema.parse({
      organization_name: "Acme",
      contact_name: "Jane",
      contact_email: " Jane@Acme.COM ",
    });
    expect(client.contact_email).toBe("jane@acme.com");
    expect(
      draftClientSchema.safeParse({
        organization_name: "Acme",
        contact_name: "Jane",
        contact_email: "nope",
      }).success,
    ).toBe(false);
  });
});

describe("buildProjectRows", () => {
  it("assigns positions, links tasks to milestones, and propagates org id", () => {
    const draft = projectDraftSchema.parse({
      project: { title: "Site" },
      milestones: [
        { title: "Design", tasks: [{ title: "Mockup" }, { title: "Staging", client_visible: false }] },
        { title: "Build", tasks: [{ title: "Pages" }] },
      ],
      requests: [{ title: "Logo" }, { kind: "access", title: "DNS" }],
    });

    let counter = 0;
    const rows = buildProjectRows("proj", "org", draft, () => `m${counter++}`);

    expect(rows.milestones.map((m) => [m.id, m.position])).toEqual([
      ["m0", 0],
      ["m1", 1],
    ]);
    expect(rows.tasks.map((t) => [t.title, t.milestone_id, t.position, t.client_visible])).toEqual([
      ["Mockup", "m0", 0, true],
      ["Staging", "m0", 1, false],
      ["Pages", "m1", 0, true],
    ]);
    expect(rows.requests.map((r) => [r.kind, r.position])).toEqual([
      ["material", 0],
      ["access", 1],
    ]);
    const allRows = [...rows.milestones, ...rows.tasks, ...rows.requests];
    expect(allRows.every((row) => row.organization_id === "org" && row.project_id === "proj")).toBe(true);
  });
});

describe("item patches", () => {
  it("only updates fields the caller sent", () => {
    const raw = { type: "task", title: "Renamed" };
    const patch = patchItemSchema.parse(raw);
    expect(toItemUpdate(patch, raw)).toEqual({ title: "Renamed" });
  });

  it("translates done into done_at", () => {
    const now = new Date("2026-09-14T12:00:00Z");
    const done = { type: "task", done: true };
    expect(toItemUpdate(patchItemSchema.parse(done), done, now)).toEqual({
      done_at: "2026-09-14T12:00:00.000Z",
    });
    const undone = { type: "task", done: false };
    expect(toItemUpdate(patchItemSchema.parse(undone), undone, now)).toEqual({
      done_at: null,
    });
  });

  it("allows explicitly clearing a field", () => {
    const raw = { type: "milestone", description: "", due_date: null };
    expect(toItemUpdate(patchItemSchema.parse(raw), raw)).toEqual({
      description: null,
      due_date: null,
    });
  });

  it("onlyProvided ignores non-object input", () => {
    expect(onlyProvided({ a: 1 }, null)).toEqual({});
  });
});
