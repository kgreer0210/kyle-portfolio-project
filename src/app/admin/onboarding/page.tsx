import Link from "next/link";
import OnboardingStatusBadge from "@/components/crm/OnboardingStatusBadge";
import { formatDateTime } from "@/lib/crm";
import { requireAdminUser } from "@/lib/auth";

const reviewQueueStatuses = ["submitted", "reopened", "in_progress"];

export default async function AdminOnboardingQueuePage() {
  const { supabase } = await requireAdminUser();
  const { data } = await supabase
    .from("client_onboardings")
    .select(
      "organization_id, status, submitted_at, updated_at, organizations(name, primary_contact_name, primary_contact_email)",
    )
    .in("status", reviewQueueStatuses)
    .order("updated_at", { ascending: false });

  const entries = (data || []) as Array<{
    organization_id: string;
    status: "in_progress" | "submitted" | "reopened";
    submitted_at?: string | null;
    updated_at?: string;
    organizations?: {
      name?: string | null;
      primary_contact_name?: string | null;
      primary_contact_email?: string | null;
    } | null;
  }>;

  return (
    <main className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-blue-ncs">
          Admin Onboarding Queue
        </p>
        <h2 className="mt-2 text-3xl font-semibold text-white">Onboarding</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-text-secondary">
          Review submitted discovery packages and keep active onboarding work
          visible while it moves toward a final decision.
        </p>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-8 text-sm text-text-secondary">
          No onboarding submissions currently need review.
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => {
            const isSubmitted = entry.status === "submitted";

            return (
              <Link
                key={entry.organization_id}
                href={`/admin/onboarding/${entry.organization_id}`}
                className={`block rounded-[2rem] border p-6 transition hover:border-blue-ncs ${
                  isSubmitted
                    ? "border-amber-400/40 bg-amber-500/10"
                    : "border-penn-blue bg-oxford-blue/80"
                }`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-2xl font-semibold text-white">
                        {entry.organizations?.name || "Unknown organization"}
                      </h3>
                      <OnboardingStatusBadge status={entry.status} />
                    </div>
                    <div className="text-sm leading-7 text-text-secondary">
                      <p>
                        Primary contact:{" "}
                        {entry.organizations?.primary_contact_name ||
                          entry.organizations?.primary_contact_email ||
                          "N/A"}
                      </p>
                      <p>
                        Submitted:{" "}
                        {entry.submitted_at
                          ? formatDateTime(entry.submitted_at)
                          : "Not submitted yet"}
                      </p>
                      <p>Last updated: {formatDateTime(entry.updated_at)}</p>
                    </div>
                  </div>

                  <div className="text-sm font-medium text-blue-ncs">
                    {isSubmitted ? "Ready for review" : "Open review"}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
