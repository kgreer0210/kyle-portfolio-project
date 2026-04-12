import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/auth";
import PasskeyRegistration from "@/components/crm/PasskeyRegistration";

export const metadata: Metadata = {
  title: "Security Settings",
};

export default async function AdminSecuritySettingsPage() {
  await requireAdminUser();

  return (
    <main className="mx-auto max-w-2xl space-y-8 px-4 py-10">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-text-primary">Security</h1>
        <p className="text-sm text-text-secondary">
          Manage how you sign in to the admin panel.
        </p>
      </div>

      <section className="rounded-2xl border border-penn-blue bg-oxford-blue/80 p-6">
        <PasskeyRegistration />
      </section>
    </main>
  );
}
