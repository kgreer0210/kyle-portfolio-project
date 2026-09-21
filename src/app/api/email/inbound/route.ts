import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { getInboundConfig } from "@/lib/inboundEmail";
import { handleInboundEmail, type InboundDeps } from "@/lib/inboundReply";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { postTicketReply } from "@/lib/ticket-replies";
import type { ProfileRole, TicketStatus } from "@/types/crm";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Resend Inbound webhook (`email.received`). Turns a reply to a ticket
 * notification into a ticket message. Configure in Resend with the endpoint
 * `/api/email/inbound` and set RESEND_WEBHOOK_SECRET, INBOUND_REPLY_DOMAIN,
 * and INBOUND_REPLY_SECRET.
 */
export async function POST(request: NextRequest) {
  const config = getInboundConfig();
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
  const apiKey = process.env.RESEND_API_KEY;

  if (!config || !webhookSecret || !apiKey) {
    return NextResponse.json({ error: "Inbound email is not configured." }, { status: 503 });
  }

  const payload = await request.text();
  const resend = new Resend(apiKey);

  let event;
  try {
    event = resend.webhooks.verify({
      payload,
      headers: {
        id: request.headers.get("svix-id") ?? request.headers.get("webhook-id") ?? "",
        timestamp:
          request.headers.get("svix-timestamp") ?? request.headers.get("webhook-timestamp") ?? "",
        signature:
          request.headers.get("svix-signature") ?? request.headers.get("webhook-signature") ?? "",
      },
      webhookSecret,
    });
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  if (event.type !== "email.received") {
    return NextResponse.json({ ok: true, ignored: event.type });
  }

  const supabase = createAdminSupabaseClient();

  const deps: InboundDeps = {
    async getTicket(ticketId) {
      const { data } = await supabase
        .from("tickets")
        .select("id, organization_id, title, status, organizations(name)")
        .eq("id", ticketId)
        .maybeSingle();
      if (!data) return null;
      return {
        id: data.id as string,
        organization_id: data.organization_id as string,
        title: data.title as string,
        status: data.status as TicketStatus,
        organizationName:
          (data.organizations as { name?: string | null } | null)?.name || "Unknown organization",
      };
    },
    async findProfileByEmail(email) {
      const { data } = await supabase
        .from("profiles")
        .select("id, email, role, status")
        .eq("email", email)
        .maybeSingle();
      if (!data || data.status === "disabled") return null;
      return { id: data.id as string, email: data.email as string, role: data.role as ProfileRole };
    },
    async isOrganizationMember(userId, organizationId) {
      const { data } = await supabase
        .from("organization_members")
        .select("id")
        .eq("user_id", userId)
        .eq("organization_id", organizationId)
        .maybeSingle();
      return Boolean(data);
    },
    async getEmailContent(emailId) {
      const { data, error } = await resend.emails.receiving.get(emailId);
      if (error || !data) {
        throw new Error(`Unable to fetch inbound email: ${error?.message ?? "unknown error"}`);
      }
      return { text: data.text, html: data.html };
    },
    async listAttachments(emailId) {
      const { data } = await resend.emails.receiving.attachments.list({ emailId });
      return (data?.data ?? []).map((attachment) => ({
        filename: attachment.filename ?? null,
        content_type: attachment.content_type,
        content_disposition: attachment.content_disposition,
        size: attachment.size,
        download_url: attachment.download_url,
      }));
    },
    async downloadAttachment(info) {
      const response = await fetch(info.download_url);
      if (!response.ok) {
        throw new Error(`Attachment download failed with ${response.status}`);
      }
      const blob = await response.blob();
      return new File([blob], info.filename || "attachment", { type: info.content_type });
    },
    async postReply(args) {
      const result = await postTicketReply({ ...args, visibility: "public" });
      return { duplicate: result.duplicate };
    },
  };

  try {
    const outcome = await handleInboundEmail(event.data, config, deps);
    if (outcome.status === "ignored") {
      console.warn("Inbound email ignored:", outcome.reason, { emailId: event.data.email_id });
    }
    return NextResponse.json({ ok: true, ...outcome });
  } catch (error) {
    // Non-2xx lets Resend retry transient failures; duplicates are caught by
    // the unique external_message_id index.
    console.error("Inbound email processing error:", error);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
