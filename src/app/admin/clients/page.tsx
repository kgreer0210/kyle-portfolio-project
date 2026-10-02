import Link from "next/link";
import { formatDateTime } from "@/lib/crm";
import { requireAdminUser } from "@/lib/auth";

export default async function AdminClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q: rawQuery } = await searchParams;
  const q = (rawQuery || "").trim();
  const { supabase } = await requireAdminUser();
  const { data, error } = await supabase
    .from("organizations")
    .select(
      "id, name, slug, client_kind, primary_contact_name, primary_contact_email, created_at, projects(status)",
    )
    .order("created_at", { ascending: false });

  if (error) throw new Error("Unable to load clients.", { cause: error });
  const allOrganizations = (data || []) as Array<{
    id: string;
    name: string;
    slug: string;
    client_kind: "new" | "legacy";
    primary_contact_name: string | null;
    primary_contact_email: string | null;
    created_at?: string;
    projects?: Array<{ status?: string | null }> | null;
  }>;

  const organizations = allOrganizations.filter(
    (organization) =>
      !q ||
      [
        organization.name,
        organization.primary_contact_name,
        organization.primary_contact_email,
      ].some((value) => value?.toLowerCase().includes(q.toLowerCase())),
  );

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium text-blue-ncs">Client Directory</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">Clients</h2>
        </div>
        <Link
          href="/admin/clients/new"
          className="rounded-full bg-blue-ncs px-5 py-3 font-semibold text-white transition hover:bg-lapis-lazuli"
        >
          Create client
        </Link>
      </div>

      <form
        action="/admin/clients"
        className="flex flex-wrap items-center gap-3"
      >
        <label htmlFor="client-search" className="sr-only">
          Search clients
        </label>
        <input
          id="client-search"
          name="q"
          defaultValue={q}
          placeholder="Search clients or contacts…"
          className="min-w-0 flex-1 rounded-lg border border-penn-blue bg-rich-black px-4 py-2.5 text-sm sm:max-w-sm"
        />
        <button
          type="submit"
          className="rounded-lg border border-penn-blue px-4 py-2.5 text-sm"
        >
          Search
        </button>
        {q ? (
          <Link href="/admin/clients" className="text-sm text-text-secondary">
            Clear
          </Link>
        ) : null}
        <p className="text-xs text-text-secondary">
          {organizations.length} clients
        </p>
      </form>
      <div className="overflow-x-auto admin-panel">
        <table className="min-w-full divide-y divide-penn-blue text-left text-sm">
          <thead className="bg-rich-black/40 text-text-secondary">
            <tr>
              <th className="px-6 py-4 font-medium">Organization</th>
              <th className="px-6 py-4 font-medium">Type</th>
              <th className="px-6 py-4 font-medium">Primary contact</th>
              <th className="px-6 py-4 font-medium">Active projects</th>
              <th className="px-6 py-4 font-medium">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-penn-blue">
            {organizations.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-text-secondary">
                  {q
                    ? "No clients match your search."
                    : "No clients yet. Create your first client to get started."}
                </td>
              </tr>
            ) : null}
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
                  {organization.projects?.filter(
                    (project) => project.status === "active",
                  ).length ?? 0}
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
