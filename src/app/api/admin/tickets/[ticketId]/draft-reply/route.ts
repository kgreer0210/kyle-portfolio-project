import { NextRequest } from "next/server";
import { streamText } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { z } from "zod";
import { requireApiAdminUser } from "@/lib/api-auth";
import { jsonError, jsonFromAuthError } from "@/lib/api-response";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { loadProjectScope } from "@/lib/ticketProjects";
import {
  REPLY_DRAFT_MODEL,
  REPLY_DRAFT_SYSTEM_PROMPT,
  buildReplyDraftPrompt,
  type DraftThreadMessage,
} from "@/lib/ticketReplyDraft";

export const runtime = "nodejs";
export const maxDuration = 120;

interface RouteParams {
  params: Promise<{
    ticketId: string;
  }>;
}

const bodySchema = z.object({
  instructions: z.string().trim().max(1000).optional().nullable(),
});

/** Stream a reply draft for the admin to edit. Nothing is saved or sent. */
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

  const { ticketId } = await params;
  const adminSupabase = createAdminSupabaseClient();

  const [{ data: ticket }, { data: messages }] = await Promise.all([
    adminSupabase
      .from("tickets")
      .select(
        "id, title, description, status, out_of_scope, cost_amount, project_id, organization_id, organizations(name, primary_contact_name)",
      )
      .eq("id", ticketId)
      .maybeSingle(),
    adminSupabase
      .from("ticket_messages")
      .select("body, visibility, is_system, created_at, profiles:author_id(role)")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true }),
  ]);

  if (!ticket) {
    return jsonError("Ticket not found.", 404);
  }

  const organization = ticket.organizations as {
    name?: string | null;
    primary_contact_name?: string | null;
  } | null;

  const thread: DraftThreadMessage[] = (messages || []).map((row) => {
    const message = row as {
      body: string;
      visibility: "public" | "internal";
      is_system: boolean;
      created_at: string;
      profiles?: { role?: string | null } | null;
    };
    return {
      author: message.is_system
        ? "system"
        : message.profiles?.role === "admin"
          ? "kyle"
          : "client",
      visibility: message.visibility,
      body: message.body,
      createdAt: message.created_at,
    };
  });

  const projectScope = ticket.project_id
    ? await loadProjectScope(adminSupabase, ticket.project_id as string).catch(() => null)
    : null;

  try {
    const result = streamText({
      model: createOpenRouter({ apiKey }).chat(REPLY_DRAFT_MODEL),
      system: REPLY_DRAFT_SYSTEM_PROMPT,
      prompt: buildReplyDraftPrompt({
        organizationName: organization?.name || "Client",
        clientName: organization?.primary_contact_name || null,
        ticket: {
          title: ticket.title as string,
          description: ticket.description as string,
          status: ticket.status as string,
          outOfScope: Boolean(ticket.out_of_scope),
          costAmount: (ticket.cost_amount as number | null) ?? null,
        },
        messages: thread,
        projectScope,
        instructions: parsed.data.instructions || null,
      }),
      temperature: 0.4,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Reply draft error:", error);
    return jsonError("Couldn't draft a reply right now.", 500);
  }
}
