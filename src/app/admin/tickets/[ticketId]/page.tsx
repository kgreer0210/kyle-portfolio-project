import { notFound } from "next/navigation";
import StatusBadge from "@/components/crm/StatusBadge";
import TicketReplyForm from "@/components/crm/TicketReplyForm";
import TicketStatusForm from "@/components/crm/TicketStatusForm";
import { createSignedAttachmentUrls } from "@/lib/ticket-attachments";
import { formatDateTime } from "@/lib/crm";
import { requireAdminUser } from "@/lib/auth";

interface AdminTicketDetailPageProps {
  params: Promise<{
    ticketId: string;
  }>;
}

export default async function AdminTicketDetailPage({
  params,
}: AdminTicketDetailPageProps) {
  const { ticketId } = await params;
  const { supabase } = await requireAdminUser();

  const [{ data: ticket }, { data: messages }, { data: attachments }] =
    await Promise.all([
      supabase
        .from("tickets")
        .select("*, organizations(name), profiles:created_by(full_name, email)")
        .eq("id", ticketId)
        .maybeSingle(),
      supabase
        .from("ticket_messages")
        .select("id, body, visibility, is_system, created_at, profiles:author_id(full_name, email)")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true }),
      supabase
        .from("ticket_attachments")
        .select("id, storage_path, file_name, message_id")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true }),
    ]);

  if (!ticket) {
    notFound();
  }

  const signedAttachments = await createSignedAttachmentUrls(
    (attachments || []) as Array<{
      id: string;
      storage_path: string;
      file_name: string;
      message_id?: string | null;
    }>,
  );

  const rootAttachments = signedAttachments.filter((item) => !item.message_id);

  return (
    <main className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="space-y-6">
        <div className="rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-blue-ncs">
                {ticket.type}
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-white">
                {ticket.title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-text-secondary">
                {(ticket.organizations as { name?: string | null } | null)?.name ||
                  "Unknown organization"}
              </p>
            </div>
            <StatusBadge status={ticket.status} />
          </div>

          <div className="mt-6 rounded-3xl border border-penn-blue bg-rich-black/40 p-5">
            <p className="whitespace-pre-wrap text-sm leading-7 text-text-primary">
              {ticket.description}
            </p>
            <p className="mt-4 text-xs uppercase tracking-[0.18em] text-text-secondary">
              Opened {formatDateTime(ticket.created_at)}
            </p>
          </div>

          {rootAttachments.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-3">
              {rootAttachments.map((attachment) => (
                <a
                  key={attachment.id}
                  href={attachment.signedUrl || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-penn-blue px-4 py-2 text-sm text-text-primary transition hover:border-blue-ncs"
                >
                  {attachment.file_name}
                </a>
              ))}
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          {(messages || []).map((message) => {
            const author = (message as { profiles?: { full_name?: string | null; email?: string | null } | null }).profiles;
            const inlineAttachments = signedAttachments.filter(
              (attachment) => attachment.message_id === message.id,
            );

            return (
              <div
                key={message.id}
                className="rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-6"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold text-white">
                      {author?.full_name || author?.email || "Unknown author"}
                    </p>
                    <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">
                      {message.visibility}
                    </p>
                  </div>
                  <p className="text-sm text-text-secondary">
                    {formatDateTime(message.created_at)}
                  </p>
                </div>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-text-primary">
                  {message.body}
                </p>
                {inlineAttachments.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-3">
                    {inlineAttachments.map((attachment) => (
                      <a
                        key={attachment.id}
                        href={attachment.signedUrl || "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-penn-blue px-4 py-2 text-sm text-text-primary transition hover:border-blue-ncs"
                      >
                        {attachment.file_name}
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      <aside className="space-y-6">
        <div className="rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-6">
          <h3 className="text-xl font-semibold text-white">Update status</h3>
          <div className="mt-5">
            <TicketStatusForm ticketId={ticket.id} currentStatus={ticket.status} />
          </div>
        </div>

        <div className="rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-6">
          <h3 className="text-xl font-semibold text-white">Reply or add note</h3>
          <div className="mt-5">
            <TicketReplyForm ticketId={ticket.id} allowInternalNote={true} />
          </div>
        </div>
      </aside>
    </main>
  );
}
