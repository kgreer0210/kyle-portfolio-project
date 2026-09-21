export const PROJECT_UPDATE_MODEL = "anthropic/claude-sonnet-5";

export interface UpdateDraftContext {
  clientName: string | null;
  projectTitle: string;
  sinceIso: string | null;
  progress: { done: number; total: number; percent: number } | null;
  completedTasks: Array<{ title: string; milestone: string | null; doneAt: string }>;
  nextTasks: Array<{ title: string; milestone: string | null }>;
  openRequests: Array<{ title: string; dueDate: string | null; status: string }>;
  ticketActivity: Array<{ title: string; status: string }>;
  notes: string | null;
}

export const PROJECT_UPDATE_SYSTEM_PROMPT = [
  "You draft short project status updates from Kyle Greer (KYGR Solutions, a one-person software studio) to his client. Kyle edits before sending.",
  "",
  "Rules:",
  "- Plain text email body in Kyle's voice: warm, direct, first person. Greet the client by first name if known. Sign off as Kyle.",
  "- Structure in short paragraphs: what got done, what's next, and anything needed from the client (only if there are open requests).",
  "- Use only the facts provided. Don't invent dates, features, or problems. If little happened, say so briefly and positively.",
  "- Only client-visible work is included below; never mention internal chores, AI, or prices.",
  "- Keep it under 150 words. No markdown headings; simple dashes for a short list are fine.",
].join("\n");

/** Pure: select what changed since the last update. */
export function selectUpdateActivity<
  T extends { done_at: string | null; client_visible: boolean },
>(tasks: T[], sinceIso: string | null): { completed: T[]; remaining: T[] } {
  const visible = tasks.filter((task) => task.client_visible);
  const since = sinceIso ? new Date(sinceIso).getTime() : null;
  return {
    completed: visible.filter(
      (task) => task.done_at && (since === null || new Date(task.done_at).getTime() > since),
    ),
    remaining: visible.filter((task) => !task.done_at),
  };
}

export function buildProjectUpdatePrompt(context: UpdateDraftContext): string {
  const lines = [
    `Client contact: ${context.clientName || "unknown"}`,
    `Project: ${context.projectTitle}`,
    `Covering: ${context.sinceIso ? `since the last update on ${context.sinceIso.slice(0, 10)}` : "the project so far (first update)"}`,
    `Overall progress: ${context.progress ? `${context.progress.percent}% (${context.progress.done} of ${context.progress.total} tasks)` : "not tracked yet"}`,
    "",
    "Completed in this period:",
    ...(context.completedTasks.length
      ? context.completedTasks.slice(0, 30).map((task) => `- ${task.title}${task.milestone ? ` [${task.milestone}]` : ""}`)
      : ["- (nothing marked done)"]),
    "",
    "Up next:",
    ...(context.nextTasks.length
      ? context.nextTasks.slice(0, 5).map((task) => `- ${task.title}${task.milestone ? ` [${task.milestone}]` : ""}`)
      : ["- (no remaining tasks)"]),
    "",
    "Still needed from the client:",
    ...(context.openRequests.length
      ? context.openRequests.slice(0, 10).map((item) => `- ${item.title}${item.dueDate ? ` (due ${item.dueDate})` : ""}${item.status === "later" ? " (client said they'll send later)" : ""}`)
      : ["- (nothing)"]),
  ];

  if (context.ticketActivity.length) {
    lines.push("", "Tickets with activity in this period:");
    lines.push(...context.ticketActivity.slice(0, 10).map((ticket) => `- ${ticket.title} (${ticket.status.replaceAll("_", " ")})`));
  }

  if (context.notes) {
    lines.push("", `Kyle's notes for this update: ${context.notes.slice(0, 1000)}`);
  }

  return lines.join("\n");
}
