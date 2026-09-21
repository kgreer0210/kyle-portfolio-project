import { NextRequest } from "next/server";
import { streamText } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { z } from "zod";
import { requireApiAdminUser } from "@/lib/api-auth";
import { jsonError, jsonFromAuthError } from "@/lib/api-response";
import { computeProgress, milestoneSelectColumns, taskSelectColumns } from "@/lib/projects";
import {
  PROJECT_UPDATE_MODEL,
  PROJECT_UPDATE_SYSTEM_PROMPT,
  buildProjectUpdatePrompt,
  selectUpdateActivity,
} from "@/lib/projectUpdateDraft";
import { createAdminSupabaseClient } from "@/lib/supabase";
import type { ProjectMilestone, ProjectTask } from "@/types/crm";

export const runtime = "nodejs";
export const maxDuration = 120;

interface RouteParams {
  params: Promise<{
    projectId: string;
  }>;
}

const bodySchema = z.object({
  notes: z.string().trim().max(1000).optional().nullable(),
});

/** Stream a status update draft from recent client-visible progress. */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await requireApiAdminUser();
  } catch (error) {
    return jsonFromAuthError(error) || jsonError("Unauthorized", 401);
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return jsonError("Invalid request body");
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return jsonError("AI drafting isn't configured.", 503);
  }

  const { projectId } = await params;
  const supabase = createAdminSupabaseClient();

  const [{ data: project }, { data: lastUpdate }] = await Promise.all([
    supabase
      .from("projects")
      .select("id, title, organization_id, organizations(primary_contact_name)")
      .eq("id", projectId)
      .maybeSingle(),
    supabase
      .from("project_updates")
      .select("sent_at")
      .eq("project_id", projectId)
      .order("sent_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (!project) {
    return jsonError("Project not found.", 404);
  }

  const sinceIso = (lastUpdate as { sent_at?: string } | null)?.sent_at ?? null;

  let ticketQuery = supabase
    .from("tickets")
    .select("title, status, last_activity_at")
    .eq("project_id", projectId)
    .order("last_activity_at", { ascending: false })
    .limit(10);
  if (sinceIso) {
    ticketQuery = ticketQuery.gt("last_activity_at", sinceIso);
  }

  const [{ data: milestones }, { data: tasks }, { data: requests }, { data: tickets }] =
    await Promise.all([
      supabase.from("project_milestones").select(milestoneSelectColumns).eq("project_id", projectId),
      supabase.from("project_tasks").select(taskSelectColumns).eq("project_id", projectId).order("position"),
      supabase
        .from("project_requests")
        .select("title, due_date, status")
        .eq("project_id", projectId)
        .neq("status", "done")
        .order("position"),
      ticketQuery,
    ]);

  const milestoneById = new Map(
    ((milestones || []) as ProjectMilestone[]).map((milestone) => [milestone.id, milestone]),
  );
  const orderedTasks = ((tasks || []) as ProjectTask[]).sort((a, b) => {
    const aPos = a.milestone_id ? (milestoneById.get(a.milestone_id)?.position ?? 0) : 999;
    const bPos = b.milestone_id ? (milestoneById.get(b.milestone_id)?.position ?? 0) : 999;
    return aPos - bPos || a.position - b.position;
  });
  const { completed, remaining } = selectUpdateActivity(orderedTasks, sinceIso);
  const milestoneTitle = (task: ProjectTask) =>
    task.milestone_id ? (milestoneById.get(task.milestone_id)?.title ?? null) : null;

  const prompt = buildProjectUpdatePrompt({
    clientName:
      (project.organizations as { primary_contact_name?: string | null } | null)
        ?.primary_contact_name || null,
    projectTitle: project.title as string,
    sinceIso,
    progress: computeProgress(orderedTasks),
    completedTasks: completed.map((task) => ({
      title: task.title,
      milestone: milestoneTitle(task),
      doneAt: task.done_at as string,
    })),
    nextTasks: remaining.map((task) => ({ title: task.title, milestone: milestoneTitle(task) })),
    openRequests: ((requests || []) as Array<{ title: string; due_date: string | null; status: string }>).map(
      (item) => ({ title: item.title, dueDate: item.due_date, status: item.status }),
    ),
    ticketActivity: ((tickets || []) as Array<{ title: string; status: string }>).map((ticket) => ({
      title: ticket.title,
      status: ticket.status,
    })),
    notes: parsed.data.notes || null,
  });

  try {
    const result = streamText({
      model: createOpenRouter({ apiKey }).chat(PROJECT_UPDATE_MODEL),
      system: PROJECT_UPDATE_SYSTEM_PROMPT,
      prompt,
      temperature: 0.5,
    });
    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Project update draft error:", error);
    return jsonError("Couldn't draft an update right now.", 500);
  }
}
