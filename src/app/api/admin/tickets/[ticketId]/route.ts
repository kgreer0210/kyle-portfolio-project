import { NextRequest, NextResponse } from "next/server";
import { requireApiAdminUser } from "@/lib/api-auth";
import { jsonError, jsonFromAuthError } from "@/lib/api-response";
import {
  isTicketCategory,
  isTicketPriority,
  ticketCategoryLabels,
  ticketPriorityLabels,
} from "@/lib/crm";
import { createAdminSupabaseClient } from "@/lib/supabase";

interface RouteParams {
  params: Promise<{
    ticketId: string;
  }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  let context;

  try {
    context = await requireApiAdminUser();
  } catch (error) {
    return jsonFromAuthError(error) || jsonError("Unauthorized", 401);
  }

  try {
    const { ticketId } = await params;
    const body = (await request.json()) as {
      priority?: string;
      category?: string | null;
    };

    const updates: { priority?: string; category?: string | null } = {};

    if (body.priority !== undefined) {
      if (!isTicketPriority(body.priority)) {
        return jsonError("Invalid ticket priority.");
      }
      updates.priority = body.priority;
    }

    if (body.category !== undefined) {
      if (body.category === null || body.category === "") {
        updates.category = null;
      } else if (isTicketCategory(body.category)) {
        updates.category = body.category;
      } else {
        return jsonError("Invalid ticket category.");
      }
    }

    if (Object.keys(updates).length === 0) {
      return jsonError("Nothing to update.");
    }

    const adminSupabase = createAdminSupabaseClient();
    const { data: ticket, error: ticketLookupError } = await adminSupabase
      .from("tickets")
      .select("id, organization_id, priority, category")
      .eq("id", ticketId)
      .maybeSingle();

    if (ticketLookupError) {
      console.error("Ticket lookup error:", ticketLookupError);
      return jsonError("Unable to load the ticket.", 500);
    }

    if (!ticket) {
      return jsonError("Ticket not found.", 404);
    }

    const { error: updateError } = await adminSupabase
      .from("tickets")
      .update(updates)
      .eq("id", ticket.id);

    if (updateError) {
      console.error("Ticket meta update error:", updateError);
      return jsonError("Unable to update the ticket.", 500);
    }

    const changes: string[] = [];

    if (updates.priority && updates.priority !== ticket.priority) {
      changes.push(
        `Priority changed to ${ticketPriorityLabels[updates.priority as keyof typeof ticketPriorityLabels]}`,
      );
    }

    if (updates.category !== undefined && updates.category !== ticket.category) {
      changes.push(
        updates.category
          ? `Category changed to ${ticketCategoryLabels[updates.category as keyof typeof ticketCategoryLabels]}`
          : "Category cleared",
      );
    }

    if (changes.length > 0) {
      const { error: noteError } = await adminSupabase
        .from("ticket_messages")
        .insert({
          ticket_id: ticket.id,
          organization_id: ticket.organization_id,
          author_id: context.user.id,
          visibility: "internal",
          body: `${changes.join(". ")}.`,
          is_system: true,
        });

      if (noteError) {
        console.error("Ticket meta audit note error:", noteError);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Ticket meta route error:", error);
    return jsonError("An unexpected error occurred while updating the ticket.", 500);
  }
}
