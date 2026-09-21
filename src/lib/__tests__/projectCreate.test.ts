import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { ProjectCreateError, createProjectFromDraft } from "@/lib/projectCreate";
import { projectDraftSchema } from "@/lib/projectDraft";

interface Call {
  table: string;
  op: string;
  values?: unknown;
  filters: Array<[string, unknown]>;
}

/**
 * Minimal chainable fake of the supabase-js query builder: records every
 * call and lets a test fail a specific table insert.
 */
function fakeSupabase(options: {
  failInsertOn?: string;
  existingSlugs?: string[];
  existingOrg?: { id: string; name: string } | null;
}) {
  const calls: Call[] = [];

  function from(table: string) {
    const call: Call = { table, op: "select", filters: [] };
    calls.push(call);

    const result = () => {
      if (call.op === "insert" && options.failInsertOn === table) {
        return { data: null, error: { message: `${table} failed` } };
      }
      if (table === "organizations" && call.op === "select") {
        if (call.filters.some(([f]) => f === "like")) {
          return {
            data: (options.existingSlugs || []).map((slug) => ({ slug })),
            error: null,
          };
        }
        return { data: options.existingOrg ?? null, error: null };
      }
      if (call.op === "insert" && table === "organizations") {
        return { data: { id: "org-new", name: "Acme" }, error: null };
      }
      if (call.op === "insert" && table === "projects") {
        return { data: { id: "proj-1" }, error: null };
      }
      return { data: null, error: null };
    };

    const builder = {
      select: () => builder,
      insert: (values: unknown) => {
        call.op = "insert";
        call.values = values;
        return builder;
      },
      delete: () => {
        call.op = "delete";
        return builder;
      },
      eq: (field: string, value: unknown) => {
        call.filters.push([field, value]);
        return builder;
      },
      like: (_field: string, value: unknown) => {
        call.filters.push(["like", value]);
        return builder;
      },
      single: async () => result(),
      maybeSingle: async () => result(),
      then: (resolve: (value: unknown) => void) => resolve(result()),
    };
    return builder;
  }

  return { client: { from } as unknown as SupabaseClient, calls };
}

const draft = projectDraftSchema.parse({
  project: { title: "Site" },
  milestones: [{ title: "Design", tasks: [{ title: "Mockup" }] }],
  requests: [{ title: "Logo" }],
  out_of_scope: ["E-commerce"],
});

const client = {
  organization_name: "Acme",
  contact_name: "Jane",
  contact_email: "jane@acme.com",
  website_url: null,
  billing_type: null,
  notes: null,
};

describe("createProjectFromDraft", () => {
  it("creates org with a unique slug, project, children, and scope record", async () => {
    const { client: supabase, calls } = fakeSupabase({ existingSlugs: ["acme"] });
    const result = await createProjectFromDraft(supabase, { kind: "new", client }, draft);

    expect(result).toEqual({
      organizationId: "org-new",
      organizationName: "Acme",
      projectId: "proj-1",
      createdOrganization: true,
    });

    const inserts = calls.filter((c) => c.op === "insert");
    expect(inserts.map((c) => c.table)).toEqual([
      "organizations",
      "projects",
      "project_milestones",
      "project_tasks",
      "project_requests",
      "project_sow",
    ]);
    expect((inserts[0].values as { slug: string }).slug).toBe("acme-2");
    expect(calls.some((c) => c.op === "delete")).toBe(false);
  });

  it("deletes the new organization when a child insert fails", async () => {
    const { client: supabase, calls } = fakeSupabase({ failInsertOn: "project_tasks" });

    await expect(
      createProjectFromDraft(supabase, { kind: "new", client }, draft),
    ).rejects.toBeInstanceOf(ProjectCreateError);

    const deletes = calls.filter((c) => c.op === "delete");
    expect(deletes).toHaveLength(1);
    expect(deletes[0]).toMatchObject({ table: "organizations", filters: [["id", "org-new"]] });
    expect(calls.some((c) => c.op === "insert" && c.table === "project_requests")).toBe(false);
  });

  it("deletes only the project for an existing client", async () => {
    const { client: supabase, calls } = fakeSupabase({
      failInsertOn: "project_requests",
      existingOrg: { id: "org-1", name: "Existing" },
    });

    await expect(
      createProjectFromDraft(supabase, { kind: "existing", organizationId: "org-1" }, draft),
    ).rejects.toBeInstanceOf(ProjectCreateError);

    const deletes = calls.filter((c) => c.op === "delete");
    expect(deletes).toHaveLength(1);
    expect(deletes[0]).toMatchObject({ table: "projects", filters: [["id", "proj-1"]] });
  });

  it("returns 404 for an unknown existing client without inserting", async () => {
    const { client: supabase, calls } = fakeSupabase({ existingOrg: null });

    await expect(
      createProjectFromDraft(supabase, { kind: "existing", organizationId: "missing" }, draft),
    ).rejects.toMatchObject({ status: 404 });
    expect(calls.some((c) => c.op === "insert")).toBe(false);
  });
});
