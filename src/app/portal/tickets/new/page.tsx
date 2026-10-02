import Link from "next/link";
import NewTicketForm from "@/components/crm/NewTicketForm";
import { contextEnabled } from "@/lib/project-context/schema";
import {
  requireClientUser,
  getPrimaryOrganizationMembership,
} from "@/lib/auth";

export default async function NewSupportTicketPage() {
  const { supabase, user } = await requireClientUser();
  const membership = await getPrimaryOrganizationMembership(user.id, supabase);
  if (!membership?.organizations)
    return (
      <main className="client-panel p-6">
        Your account is not connected to an organization yet. Contact Kyle for
        help.
      </main>
    );
  const { data: projects } = contextEnabled()
    ? await supabase
        .from("projects")
        .select("id, title, status")
        .eq("organization_id", membership.organization_id)
        .order("created_at", { ascending: false })
    : { data: [] };

  return (
    <main className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/portal/tickets"
        className="inline-flex text-sm text-text-secondary hover:text-white"
      >
        ← Your support tickets
      </Link>
      <div>
        <h1 className="text-3xl font-semibold text-white">How can we help?</h1>
        <p className="mt-2 text-sm leading-6 text-text-secondary">
          Tell us what you need. The assistant can help you describe it, and
          Kyle will follow up in your ticket.
        </p>
      </div>
      <section className="client-panel p-5 sm:p-7">
        <NewTicketForm projects={projects || []} />
      </section>
    </main>
  );
}
