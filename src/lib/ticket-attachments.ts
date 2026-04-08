import { maxTicketAttachmentBytes, ticketAttachmentBucket } from "@/lib/crm";
import { createAdminSupabaseClient } from "@/lib/supabase";
import type { TicketMessageVisibility } from "@/types/crm";

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "-");
}

export async function uploadTicketAttachments(args: {
  organizationId: string;
  ticketId: string;
  uploadedBy: string;
  visibility: TicketMessageVisibility;
  files: File[];
  messageId?: string;
}) {
  const supabase = createAdminSupabaseClient();
  const createdAttachments: Array<{
    id: string;
    storage_path: string;
    file_name: string;
    message_id?: string;
  }> = [];

  for (const file of args.files) {
    if (!file || file.size === 0) {
      continue;
    }

    if (file.size > maxTicketAttachmentBytes) {
      throw new Error(
        `${file.name} exceeds the 10MB attachment size limit for tickets.`,
      );
    }

    const storagePath = `${args.organizationId}/${args.ticketId}/${args.messageId || "root"}/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;
    const { error: uploadError } = await supabase.storage
      .from(ticketAttachmentBucket)
      .upload(storagePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || undefined,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data, error: insertError } = await supabase
      .from("ticket_attachments")
      .insert({
        ticket_id: args.ticketId,
        organization_id: args.organizationId,
        message_id: args.messageId || null,
        uploaded_by: args.uploadedBy,
        visibility: args.visibility,
        storage_path: storagePath,
        file_name: file.name,
        mime_type: file.type || null,
        file_size: file.size,
      })
      .select("id, storage_path, file_name, message_id")
      .single();

    if (insertError || !data) {
      throw insertError || new Error("Unable to save attachment metadata.");
    }

    createdAttachments.push(data as {
      id: string;
      storage_path: string;
      file_name: string;
      message_id?: string;
    });
  }

  return createdAttachments;
}

export async function createSignedAttachmentUrls(
  attachments: Array<{
    id: string;
    storage_path: string;
    file_name: string;
    message_id?: string | null;
  }>,
) {
  const supabase = createAdminSupabaseClient();

  return Promise.all(
    attachments.map(async (attachment) => {
      const { data } = await supabase.storage
        .from(ticketAttachmentBucket)
        .createSignedUrl(attachment.storage_path, 60 * 60);

      return {
        ...attachment,
        signedUrl: data?.signedUrl || null,
      };
    }),
  );
}
