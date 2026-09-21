import NewClientFlow from "@/components/crm/NewClientFlow";

export default function AdminCreateClientPage() {
  return (
    <main className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-blue-ncs">
          New Client
        </p>
        <h2 className="mt-2 text-3xl font-semibold text-white">
          Create a client
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-text-secondary">
          Upload the signed SOW and review the draft, or enter it by hand. The
          client sees the summary, visible tasks, and requests. Scope notes stay
          internal.
        </p>
      </div>

      <NewClientFlow />
    </main>
  );
}
