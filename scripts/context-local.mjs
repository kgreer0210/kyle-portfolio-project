import { execFileSync, spawn } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
// Doppler provides model credentials. Supabase/auth/email settings are always
// replaced below, so its dev config can never point this launcher at the live CRM.
const status = JSON.parse(
  execFileSync("npx", ["--yes", "supabase", "status", "-o", "json"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }),
);
if (!/^http:\/\/(127\.0\.0\.1|localhost):55421\/?$/.test(status.API_URL))
  throw new Error(
    "Expected the isolated context Supabase instance on port 55421.",
  );
const env = {
  ...process.env,
  NEXT_PUBLIC_SUPABASE_URL: status.API_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: status.ANON_KEY,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: status.PUBLISHABLE_KEY,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY: status.PUBLISHABLE_KEY,
  SUPABASE_SERVICE_ROLE_KEY: status.SERVICE_ROLE_KEY,
  SUPABASE_SECRET_KEY: status.SECRET_KEY,
  PROJECT_CONTEXT_ENABLED: "true",
  CRM_ADMIN_EMAILS: "admin@context.test",
  RESEND_API_KEY: "",
  DISCORD_WEBHOOK_URL: "",
  RETELL_API_KEY: "",
  CRON_SECRET: "context-local-worker",
  NEXT_PUBLIC_SITE_URL: "http://localhost:3100",
  WEBAUTHN_ORIGIN: "http://localhost:3100",
  WEBAUTHN_RP_ID: "localhost",
};
const mode = process.argv[2] || "dev";
if (mode === "seed") {
  const db = createClient(status.API_URL, status.SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
  const { data: existing, error: listError } = await db.auth.admin.listUsers();
  if (listError) throw listError;
  const ids = {};
  for (const [role, email] of [
    ["admin", "admin@context.test"],
    ["client", "client@context.test"],
    ["client", "other@context.test"],
  ]) {
    let user = existing.users.find((u) => u.email === email);
    if (!user) {
      const result = await db.auth.admin.createUser({
        email,
        email_confirm: true,
        password: "Context-local-only-2026!",
      });
      if (result.error) throw result.error;
      user = result.data.user;
    }
    const passwordUpdate = await db.auth.admin.updateUserById(user.id, {
      password: "Context-local-only-2026!",
    });
    if (passwordUpdate.error) throw passwordUpdate.error;
    ids[email] = user.id;
    const result = await db.from("profiles").upsert({
      id: user.id,
      email,
      role,
      status: "active",
      full_name: role === "admin" ? "Local Admin" : "Local Client",
    });
    if (result.error) throw result.error;
  }
  const organizationId = "10000000-0000-4000-8000-000000000001";
  const otherOrg = "10000000-0000-4000-8000-000000000002";
  const projectId = "20000000-0000-4000-8000-000000000001";
  const otherProject = "20000000-0000-4000-8000-000000000002";
  const secondProject = "20000000-0000-4000-8000-000000000003";
  async function save(table, rows) {
    const result = await db.from(table).upsert(rows);
    if (result.error) throw result.error;
  }
  await save("organizations", [
    {
      id: organizationId,
      name: "Context Demo Client",
      slug: "context-demo",
      website_url: "https://kygrsolutions.com",
      client_kind: "new",
    },
    {
      id: otherOrg,
      name: "Other Organization",
      slug: "context-other",
      client_kind: "new",
    },
  ]);
  for (const [org, email] of [
    [organizationId, "client@context.test"],
    [otherOrg, "other@context.test"],
  ]) {
    const { error } = await db
      .from("organization_members")
      .upsert(
        { organization_id: org, user_id: ids[email], role: "owner" },
        { onConflict: "organization_id,user_id" },
      );
    if (error) throw error;
  }
  await save("projects", [
    {
      id: projectId,
      organization_id: organizationId,
      title: "Booking Application",
      status: "active",
      summary: "Local sample application with a booking workflow.",
    },
    {
      id: secondProject,
      organization_id: organizationId,
      title: "Marketing Website",
      status: "active",
    },
    {
      id: otherProject,
      organization_id: otherOrg,
      title: "Private Other Project",
      status: "active",
    },
  ]);
  await save("tickets", [
    {
      id: "30000000-0000-4000-8000-000000000001",
      organization_id: organizationId,
      project_id: projectId,
      created_by: ids["client@context.test"],
      title: "Booking button does nothing",
      description:
        "When I click Book a consultation on the Contact page, nothing happens on my phone.",
      status: "new",
    },
  ]);
  await save("project_context_sources", [
    {
      id: "40000000-0000-4000-8000-000000000001",
      organization_id: organizationId,
      project_id: projectId,
      kind: "manual",
      label: "Booking workflow (approved)",
      config: {
        audience: "client",
        content:
          "The Contact screen at /contact has a Book a consultation button. It should open the appointment calendar. Ask the client whether nothing happens or an error appears, which browser/device they used, and the time of the failure. There are also booking links in the footer; confirm the location.",
      },
    },
    {
      id: "40000000-0000-4000-8000-000000000002",
      organization_id: organizationId,
      project_id: projectId,
      kind: "manual",
      label: "Booking implementation (private)",
      config: {
        audience: "admin",
        content:
          "Booking button implementation: the Contact page opens the external calendar widget from the booking handler. A blocked popup, unloaded external script, or browser restriction is a hypothesis, not a diagnosis. Do not tell the client a fix is deployed. INTERNAL_CANARY_DO_NOT_EXPOSE is a test marker for private context.",
      },
    },
    {
      id: "40000000-0000-4000-8000-000000000003",
      organization_id: otherOrg,
      project_id: otherProject,
      kind: "manual",
      label: "Other booking project",
      config: {
        audience: "client",
        content:
          "Other organization booking workflow. OTHER_ORG_CANARY_DO_NOT_EXPOSE.",
      },
    },
  ]);
  const { data: sources } = await db
    .from("project_context_sources")
    .select("id,project_id,organization_id,revision,active_run_id")
    .eq("kind", "manual");
  for (const source of sources || [])
    if (!source.active_run_id) {
      const { error } = await db.from("project_context_sync_runs").insert({
        source_id: source.id,
        project_id: source.project_id,
        organization_id: source.organization_id,
        source_revision: source.revision,
        trigger: "seed",
      });
      if (error && error.code !== "23505") throw error;
    }
  console.log(
    "Local test data ready. Sign in with admin@context.test or client@context.test; use password Context-local-only-2026! (local fixtures only).",
  );
} else if (mode === "test-db") {
  const db = createClient(status.API_URL, status.SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
  const projectId = "20000000-0000-4000-8000-000000000001";
  const org = "10000000-0000-4000-8000-000000000001";
  const { data, error } = await db.rpc("search_project_context", {
    p_project_id: projectId,
    p_organization_id: org,
    p_query: "booking",
    p_client: true,
  });
  if (error) throw error;
  if (
    !data.length ||
    data.some(
      (r) =>
        r.content.includes("INTERNAL_CANARY") ||
        r.content.includes("OTHER_ORG_CANARY"),
    )
  )
    throw new Error("Client isolation failed.");
  const mismatch = await db.rpc("search_project_context", {
    p_project_id: projectId,
    p_organization_id: "10000000-0000-4000-8000-000000000002",
    p_query: "booking",
    p_client: false,
  });
  if (mismatch.error || mismatch.data.length)
    throw new Error("Organization isolation failed.");
  const anon = createClient(status.API_URL, status.ANON_KEY, {
    auth: { persistSession: false },
  });
  const denied = await anon.from("project_context_entries").select("id");
  if (!denied.error) throw new Error("Anonymous read was not denied.");
  const rpcDenied = await anon.rpc("search_project_context", {
    p_project_id: projectId,
    p_organization_id: org,
    p_query: "booking",
    p_client: false,
  });
  if (!rpcDenied.error) throw new Error("Anonymous search was not denied.");
  const member = createClient(status.API_URL, status.ANON_KEY, {
    auth: { persistSession: false },
  });
  const signIn = await member.auth.signInWithPassword({
    email: "client@context.test",
    password: "Context-local-only-2026!",
  });
  if (signIn.error) throw signIn.error;
  for (const table of [
    "project_context_sources",
    "project_context_entries",
    "project_context_sync_runs",
  ]) {
    const result = await member.from(table).select("id");
    if (result.data?.length)
      throw new Error("Client direct context read was allowed.");
  }
  const memberRpc = await member.rpc("search_project_context", {
    p_project_id: projectId,
    p_organization_id: org,
    p_query: "booking",
    p_client: false,
  });
  if (!memberRpc.error) throw new Error("Client raw context RPC was allowed.");
  console.log(
    "Context database checks passed: approved client context, organization isolation, anonymous table/RPC denial.",
  );
} else {
  const args =
    mode === "build"
      ? ["run", "build"]
      : ["run", "dev", "--", "--port", "3100"];
  const child = spawn("npm", args, { env, stdio: "inherit" });
  for (const signal of ["SIGINT", "SIGTERM"])
    process.on(signal, () => child.kill(signal));
  child.on("exit", (code) => process.exit(code ?? 1));
}
