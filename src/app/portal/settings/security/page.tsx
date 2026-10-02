import type { Metadata } from "next";
import { requireAuthenticatedUser } from "@/lib/auth";
import PasskeyRegistration from "@/components/crm/PasskeyRegistration";

export const metadata: Metadata = {
  title: "Security Settings",
};

export default async function SecuritySettingsPage() {
  await requireAuthenticatedUser();

  return (
    <main className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-text-primary">Security</h1>
        <p className="text-sm text-text-secondary">
          Manage how you sign in to the portal.
        </p>
      </div>

      <section className="client-panel p-6">
        <PasskeyRegistration />
      </section>
    </main>
  );
}
