import Link from "next/link";
import { notFound } from "next/navigation";
import NewClientFlow from "@/components/crm/NewClientFlow";
import { requireAdminUser } from "@/lib/auth";

interface NewProjectPageProps {
  params: Promise<{
    organizationId: string;
  }>;
}

export default async function AdminNewProjectPage({ params }: NewProjectPageProps) {
  const { organizationId } = await params;
  const { supabase } = await requireAdminUser();
  const { data: organization } = await supabase
    .from("organizations")
    .select("id, name")
    .eq("id", organizationId)
    .maybeSingle();

  if (!organization) {
    notFound();
  }

  return (
    <main className="space-y-6">
      <div>
        <Link
          href={`/admin/clients/${organization.id}`}
          className="text-sm text-text-secondary transition hover:text-white"
        >
          ← {organization.name}
        </Link>
        <h2 className="mt-2 text-3xl font-semibold text-white">New project</h2>
      </div>

      <NewClientFlow organizationId={organization.id} />
    </main>
  );
}
