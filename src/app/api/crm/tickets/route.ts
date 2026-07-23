import { after, NextRequest, NextResponse } from "next/server";
import { requireApiClientUser } from "@/lib/api-auth";
import { jsonError, jsonFromAuthError } from "@/lib/api-response";
import { sendTicketCreatedNotifications } from "@/lib/crm-notifications";
import {
  isTicketCategory,
  isTicketPriority,
  maxTicketAttachmentsPerSubmission,
  ticketCategoryLabels,
  ticketPriorityLabels,
} from "@/lib/crm";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { uploadTicketAttachments } from "@/lib/ticket-attachments";
import {
  assessBillability,
  formatTriageNote,
  resolveTriagedCategory,
  resolveTriagedPriority,
  triageTicket,
  type TicketTriageInput,
} from "@/lib/ticketTriage";
import type { TicketCategory, TicketPriority, TicketType } from "@/types/crm";

// The LLM triage call runs inline; the default serverless timeout is too
// tight once that's added.
export const maxDuration = 60;

function isTicketType(value: string): value is TicketType {
  return value === "request" || value === "issue";
}

interface TriageOutcome {
  appliedPriority: TicketPriority;
  appliedCategory: TicketCategory | null;
  summary: string;
  missingInfo: string[];
  clarifyingQuestions: string[];
  workScope: string;
  billingAssessment: string;
}

/**
 * Run AI triage on the freshly created ticket: update priority/category on
 * the ticket row and record the full analysis as an internal-only system
 * note. Never throws — triage failure must not fail ticket creation.
 */
async function runTicketTriage(
  adminSupabase: ReturnType<typeof createAdminSupabaseClient>,
  args: {
    ticketId: string;
    organizationId: string;
    input: TicketTriageInput;
  },
): Promise<TriageOutcome | null> {
  try {
    const triage = await triageTicket(args.input);

    if (!triage) {
      return null;
    }

    const appliedPriority = resolveTriagedPriority(
      args.input.clientPriority,
      triage.suggested_priority,
    );
    const appliedCategory = resolveTriagedCategory(
      args.input.clientCategory,
      triage.suggested_category,
      triage.category_confidence,
    );

    const { error: updateError } = await adminSupabase
      .from("tickets")
      .update({
        priority: appliedPriority,
        category: appliedCategory,
        ai_triaged_at: new Date().toISOString(),
      })
      .eq("id", args.ticketId);

    if (updateError) {
      // Bail out: the note and notifications must not claim a priority or
      // category that was never actually written to the ticket row.
      console.error("Ticket triage update error:", updateError);
      return null;
    }

    // Internal system note; last_activity_at is intentionally not bumped,
    // consistent with existing admin system notes.
    const { error: noteError } = await adminSupabase
      .from("ticket_messages")
      .insert({
        ticket_id: args.ticketId,
        organization_id: args.organizationId,
        author_id: null,
        visibility: "internal",
        is_system: true,
        body: formatTriageNote(triage, {
          clientPriority: args.input.clientPriority,
          clientCategory: args.input.clientCategory,
          appliedPriority,
          appliedCategory,
          billingType: args.input.billingType,
        }),
      });

    if (noteError) {
      console.error("Ticket triage note insert error:", noteError);
    }

    return {
      appliedPriority,
      appliedCategory,
      summary: triage.summary,
      missingInfo: triage.missing_info,
      clarifyingQuestions: triage.clarifying_questions,
      workScope: triage.work_scope,
      billingAssessment: assessBillability(
        args.input.billingType,
        triage.work_scope,
      ),
    };
  } catch (error) {
    console.error("Ticket triage error:", error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  let context;

  try {
    context = await requireApiClientUser();
  } catch (error) {
    return jsonFromAuthError(error) || jsonError("Unauthorized", 401);
  }

  try {
    const formData = await request.formData();
    const type = String(formData.get("type") || "request");
    const title = String(formData.get("title") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const priority = String(formData.get("priority") || "normal");
    const rawCategory = String(formData.get("category") || "").trim();
    const files = formData
      .getAll("attachments")
      .filter((entry): entry is File => entry instanceof File && entry.size > 0);

    if (!isTicketType(type)) {
      return jsonError("Invalid ticket type.");
    }

    if (!title || !description) {
      return jsonError("Title and description are required.");
    }

    if (title.length > 200) {
      return jsonError("Title must be 200 characters or fewer.");
    }

    if (description.length > 5000) {
      return jsonError("Description must be 5000 characters or fewer.");
    }

    if (!isTicketPriority(priority)) {
      return jsonError("Invalid ticket priority.");
    }

    if (rawCategory && !isTicketCategory(rawCategory)) {
      return jsonError("Invalid ticket category.");
    }

    if (files.length > maxTicketAttachmentsPerSubmission) {
      return jsonError(
        `You can attach up to ${maxTicketAttachmentsPerSubmission} files per ticket.`,
      );
    }

    const adminSupabase = createAdminSupabaseClient();
    const { data: ticket, error: ticketError } = await adminSupabase
      .from("tickets")
      .insert({
        organization_id: context.membership.organization_id,
        created_by: context.user.id,
        type,
        status: "new",
        priority,
        category: rawCategory || null,
        title,
        description,
        last_activity_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (ticketError || !ticket) {
      console.error("Ticket creation error:", ticketError);
      return jsonError("Unable to create ticket.", 500);
    }

    if (files.length > 0) {
      await uploadTicketAttachments({
        organizationId: context.membership.organization_id,
        ticketId: ticket.id,
        uploadedBy: context.user.id,
        visibility: "public",
        files,
      });
    }

    const organizationName =
      context.membership.organizations?.name || "Unknown organization";
    const clientCategory: TicketCategory | null =
      rawCategory && isTicketCategory(rawCategory) ? rawCategory : null;
    const billingType = context.membership.organizations?.billing_type ?? null;
    const attachmentNames = files.map((file) => file.name);
    const organizationId = context.membership.organization_id;
    const createdByEmail = context.profile.email;

    // Triage (an LLM round-trip) and email must not hold up the client's
    // 201 — after() extends the function lifetime past the response, so
    // both still complete on Vercel without fire-and-forget risk.
    after(async () => {
      const triageOutcome = await runTicketTriage(adminSupabase, {
        ticketId: ticket.id,
        organizationId,
        input: {
          type,
          title,
          description,
          clientPriority: priority,
          clientCategory,
          organizationName,
          billingType,
          attachmentNames,
        },
      });

      await sendTicketCreatedNotifications({
        organizationId,
        organizationName,
        ticketId: ticket.id,
        title,
        createdByEmail,
        priorityLabel:
          ticketPriorityLabels[triageOutcome?.appliedPriority ?? priority],
        triage: triageOutcome
          ? {
              summary: triageOutcome.summary,
              appliedPriorityLabel:
                ticketPriorityLabels[triageOutcome.appliedPriority],
              appliedCategoryLabel: triageOutcome.appliedCategory
                ? ticketCategoryLabels[triageOutcome.appliedCategory]
                : null,
              missingInfo: triageOutcome.missingInfo,
              clarifyingQuestions: triageOutcome.clarifyingQuestions,
              workScope: triageOutcome.workScope,
              billingAssessment: triageOutcome.billingAssessment,
            }
          : undefined,
      }).catch((notificationError) => {
        console.error("Ticket create notification error:", notificationError);
      });
    });

    return NextResponse.json({ ticketId: ticket.id }, { status: 201 });
  } catch (error) {
    console.error("Ticket create route error:", error);
    return jsonError("An unexpected error occurred while creating the ticket.", 500);
  }
}
