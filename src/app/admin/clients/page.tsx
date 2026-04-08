import Link from "next/link";
import { formatDateTime } from "@/lib/crm";
import { requireAdminUser } from "@/lib/auth";

export default async function AdminClientsPage() {
  const { supabase } = await requireAdminUser();
  const { data } = await supabase
    .from("organizations")
    .select(
      "id, name, slug, client_kind, primary_contact_name, primary_contact_email, created_at, client_onboardings(status)",
    )
    .order("created_at", { ascending: false });

  const organizations = (data || []) as Array<{
    id: string;
    name: string;
    slug: string;
    client_kind: "new" | "legacy";
    primary_contact_name: string | null;
    primary_contact_email: string | null;
    created_at?: string;
    client_onboardings?: Array<{ status?: string | null }> | null;
  }>;

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-blue-ncs">
            Client Directory
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-white">Clients</h2>
        </div>
        <Link
          href="/admin/clients/new"
          className="rounded-full bg-blue-ncs px-5 py-3 font-semibold text-white transition hover:bg-lapis-lazuli"
        >
          Create client
        </Link>
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-penn-blue bg-oxford-blue/80">
        <table className="min-w-full divide-y divide-penn-blue text-left text-sm">
          <thead className="bg-rich-black/40 text-text-secondary">
            <tr>
              <th className="px-6 py-4 font-medium">Organization</th>
              <th className="px-6 py-4 font-medium">Type</th>
              <th className="px-6 py-4 font-medium">Primary contact</th>
              <th className="px-6 py-4 font-medium">Onboarding</th>
              <th className="px-6 py-4 font-medium">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-penn-blue">
            {organizations.map((organization) => (
              <tr key={organization.id}>
                <td className="px-6 py-5">
                  <Link
                    href={`/admin/clients/${organization.id}`}
                    className="font-semibold text-white hover:text-blue-ncs"
                  >
                    {organization.name}
                  </Link>
                  <p className="mt-1 text-xs text-text-secondary">
                    /{organization.slug}
                  </p>
                </td>
                <td className="px-6 py-5 capitalize text-text-secondary">
                  {organization.client_kind}
                </td>
                <td className="px-6 py-5 text-text-secondary">
                  <div>{organization.primary_contact_name || "N/A"}</div>
                  <div className="mt-1 text-xs">
                    {organization.primary_contact_email || "N/A"}
                  </div>
                </td>
                <td className="px-6 py-5 text-text-secondary">
                  {organization.client_onboardings?.[0]?.status || "N/A"}
                </td>
                <td className="px-6 py-5 text-text-secondary">
                  {formatDateTime(organization.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
