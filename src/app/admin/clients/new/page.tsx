import CreateClientForm from "@/components/crm/CreateClientForm";

export default function AdminCreateClientPage() {
  return (
    <main className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-blue-ncs">
          New Client
        </p>
        <h2 className="mt-2 text-3xl font-semibold text-white">
          Create and invite a client
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-text-secondary">
          Choose whether this is a brand-new client that should complete the
          full onboarding checklist or an existing client that should skip
          onboarding and go straight into ticket access.
        </p>
      </div>

      <section className="rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-6 md:p-8">
        <CreateClientForm />
      </section>
    </main>
  );
}
