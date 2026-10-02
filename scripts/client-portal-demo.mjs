import { execFileSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
const status = JSON.parse(
  execFileSync("npx", ["--yes", "supabase", "status", "-o", "json"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }),
);
if (status.API_URL !== "http://127.0.0.1:55421")
  throw new Error("The isolated local database is required.");
const db = createClient(status.API_URL, status.SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const project_id = "20000000-0000-4000-8000-000000000001";
const organization_id = "10000000-0000-4000-8000-000000000001";
const milestone_id = "51000000-0000-4000-8000-000000000001";
const due_date = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
async function add(table, rows) {
  const { error } = await db
    .from(table)
    .upsert(rows, { onConflict: "id", ignoreDuplicates: true });
  if (error) throw error;
}
await add("project_milestones", [
  {
    id: milestone_id,
    project_id,
    organization_id,
    title: "Design & booking experience",
    position: 0,
    due_date,
  },
]);
await add("project_tasks", [
  {
    id: "52000000-0000-4000-8000-000000000001",
    project_id,
    organization_id,
    milestone_id,
    title: "Map the booking journey",
    client_visible: true,
    done_at: new Date().toISOString(),
    position: 0,
  },
  {
    id: "52000000-0000-4000-8000-000000000002",
    project_id,
    organization_id,
    milestone_id,
    title: "Build the calendar interaction",
    client_visible: true,
    position: 1,
  },
  {
    id: "52000000-0000-4000-8000-000000000003",
    project_id,
    organization_id,
    milestone_id,
    title: "PRIVATE_PORTAL_TASK_CANARY",
    client_visible: false,
    position: 2,
  },
]);
await add("project_requests", [
  {
    id: "53000000-0000-4000-8000-000000000001",
    project_id,
    organization_id,
    kind: "decision",
    title: "Review the booking page direction",
    instructions:
      "Demo request: review the proposed booking experience. Mark it done or use the help action to ask a question.",
    status: "open",
    position: 0,
    due_date,
  },
]);
await add("project_updates", [
  {
    id: "54000000-0000-4000-8000-000000000001",
    project_id,
    organization_id,
    body: "Demo update: the booking journey is mapped out. Next we’re building the calendar interaction and gathering your feedback on the page direction.",
  },
]);
console.log(
  "Local client portal demo ready: milestone, visible tasks, private task canary, request, and project update.",
);
