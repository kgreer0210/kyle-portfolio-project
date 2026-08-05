"use client";

import { useState } from "react";

type Concept = "drawer" | "modal" | "dock";

const concepts: Array<{
  id: Concept;
  number: string;
  name: string;
  summary: string;
}> = [
  {
    id: "drawer",
    number: "01",
    name: "Assist drawer",
    summary: "The form stays full-width while AI slides over it only when needed.",
  },
  {
    id: "modal",
    number: "02",
    name: "Guided kickoff",
    summary: "Start with a focused AI interview, then review the completed form.",
  },
  {
    id: "dock",
    number: "03",
    name: "Copilot dock",
    summary: "A small persistent helper expands upward without changing the layout.",
  },
];

const tickets = [
  { title: "Update service pricing", meta: "Request · Jul 28", status: "In progress" },
  { title: "Contact form not sending", meta: "Issue · Jul 19", status: "Resolved" },
  { title: "Add team member access", meta: "Request · Jul 11", status: "Waiting" },
];

function Spark() {
  return (
    <span aria-hidden="true" className="grid h-7 w-7 place-items-center rounded-lg bg-blue-ncs/15 text-sm text-blue-ncs">
      ✦
    </span>
  );
}

function PortalHeader() {
  return (
    <header className="flex flex-col gap-5 border-b border-white/8 px-5 py-5 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-ncs font-bold text-white">K</div>
        <div>
          <p className="text-sm font-semibold text-white">KYGR Client Portal</p>
          <p className="text-xs text-slate-500">Acme &amp; Co.</p>
        </div>
      </div>
      <nav className="flex items-center gap-1 rounded-xl border border-white/8 bg-white/[0.03] p-1 text-sm text-slate-400">
        <span className="rounded-lg px-3 py-2">Dashboard</span>
        <span className="rounded-lg bg-white/8 px-3 py-2 text-white">Tickets</span>
        <span className="rounded-lg px-3 py-2">Settings</span>
      </nav>
    </header>
  );
}

function TicketHistory({ compact = false }: { compact?: boolean }) {
  return (
    <section className={compact ? "space-y-3" : "space-y-4"}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-ncs">Recent activity</p>
          <h2 className="mt-1 text-xl font-semibold text-white">Your tickets</h2>
        </div>
        <button className="text-sm text-slate-400 transition hover:text-white">View all</button>
      </div>
      <div className="divide-y divide-white/8 overflow-hidden rounded-2xl border border-white/8 bg-white/[0.025]">
        {tickets.map((ticket) => (
          <button key={ticket.title} className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition hover:bg-white/[0.04]">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-100">{ticket.title}</p>
              <p className="mt-1 text-xs text-slate-500">{ticket.meta}</p>
            </div>
            <span className="shrink-0 rounded-full border border-white/8 px-2.5 py-1 text-[11px] text-slate-400">{ticket.status}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function Field({ label, placeholder, wide = false }: { label: string; placeholder: string; wide?: boolean }) {
  return (
    <label className={wide ? "block sm:col-span-2" : "block"}>
      <span className="mb-2 block text-xs font-medium text-slate-300">{label}</span>
      <input placeholder={placeholder} className="w-full rounded-xl border border-white/10 bg-[#07121b] px-3.5 py-3 text-sm text-white placeholder:text-slate-600 focus:border-blue-ncs" />
    </label>
  );
}

function TicketForm({ aiAction, roomy = false }: { aiAction?: React.ReactNode; roomy?: boolean }) {
  return (
    <section className={`rounded-2xl border border-white/8 bg-[#071019] ${roomy ? "p-6 sm:p-8" : "p-5"}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-ncs">New ticket</p>
          <h2 className="mt-1 text-2xl font-semibold text-white">What can we help with?</h2>
          <p className="mt-1 text-sm text-slate-500">Share the details you have. You can refine them before sending.</p>
        </div>
        {aiAction}
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label="Type" placeholder="Request" />
        <Field label="Priority" placeholder="Normal" />
        <Field label="Title" placeholder="A short summary" wide />
        <label className="block sm:col-span-2">
          <span className="mb-2 block text-xs font-medium text-slate-300">Description</span>
          <textarea rows={roomy ? 6 : 4} placeholder="What happened, what did you expect, and who is affected?" className="w-full resize-none rounded-xl border border-white/10 bg-[#07121b] px-3.5 py-3 text-sm text-white placeholder:text-slate-600 focus:border-blue-ncs" />
        </label>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-5">
        <button className="text-sm text-slate-400 transition hover:text-white">＋ Add attachments</button>
        <button className="rounded-xl bg-blue-ncs px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-lapis-lazuli">Create ticket</button>
      </div>
    </section>
  );
}

function ChatContent({ onUse }: { onUse?: () => void }) {
  const [sent, setSent] = useState(false);
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto p-5">
        <div className="max-w-[88%] rounded-2xl rounded-tl-md bg-white/[0.06] p-3 text-sm leading-6 text-slate-300">
          Tell me what’s going on in your own words. I’ll turn it into a clear ticket.
        </div>
        <div className="ml-auto max-w-[88%] rounded-2xl rounded-tr-md bg-blue-ncs/20 p-3 text-sm leading-6 text-slate-100">
          Our contact form stopped sending leads to the sales inbox this morning.
        </div>
        {sent && (
          <div className="max-w-[88%] rounded-2xl rounded-tl-md bg-white/[0.06] p-3 text-sm leading-6 text-slate-300">
            Got it. Do submissions show a success message, and is anyone still receiving them elsewhere?
          </div>
        )}
      </div>
      <div className="border-t border-white/8 p-4">
        {onUse && (
          <button onClick={onUse} className="mb-3 w-full rounded-xl border border-blue-ncs/40 bg-blue-ncs/10 py-2.5 text-sm font-semibold text-blue-ncs transition hover:bg-blue-ncs/20">
            Use suggested description
          </button>
        )}
        <div className="flex gap-2">
          <input aria-label="Message AI assistant" placeholder="Add more detail…" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-rich-black px-3 py-2.5 text-sm" />
          <button onClick={() => setSent(true)} className="rounded-xl bg-blue-ncs px-4 text-sm font-semibold text-white">Send</button>
        </div>
      </div>
    </div>
  );
}

function DrawerConcept() {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative min-h-[720px] overflow-hidden">
      <PortalHeader />
      <main className="mx-auto grid max-w-6xl gap-6 p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_330px]">
        <TicketForm roomy aiAction={
          <button onClick={() => setOpen(true)} className="flex items-center gap-2 rounded-xl border border-blue-ncs/30 bg-blue-ncs/10 px-3.5 py-2.5 text-sm font-semibold text-blue-ncs transition hover:bg-blue-ncs/20">
            <Spark /> Help me write this
          </button>
        } />
        <TicketHistory compact />
      </main>
      <button aria-label="Close assistant overlay" onClick={() => setOpen(false)} className={`absolute inset-0 z-10 bg-black/55 transition ${open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`} />
      <aside className={`absolute inset-y-0 right-0 z-20 flex w-full max-w-md flex-col border-l border-white/10 bg-[#050d14] shadow-2xl transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-center justify-between border-b border-white/8 p-5">
          <div className="flex items-center gap-3"><Spark /><div><p className="font-semibold text-white">Ticket assistant</p><p className="text-xs text-slate-500">Describe it naturally</p></div></div>
          <button onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-white">✕</button>
        </div>
        <ChatContent onUse={() => setOpen(false)} />
      </aside>
    </div>
  );
}

function ModalConcept() {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative min-h-[720px] overflow-hidden">
      <PortalHeader />
      <main className="mx-auto max-w-6xl p-5 sm:p-8">
        <div className="mb-6 flex flex-col gap-5 rounded-2xl border border-blue-ncs/20 bg-[linear-gradient(110deg,rgba(0,148,198,.14),rgba(0,18,66,.25))] p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4"><Spark /><div><h2 className="text-lg font-semibold text-white">Not sure how to explain it?</h2><p className="mt-1 max-w-xl text-sm text-slate-400">Answer a few questions in a focused conversation. We’ll prepare the ticket for your review.</p></div></div>
          <button onClick={() => setOpen(true)} className="shrink-0 rounded-xl bg-blue-ncs px-5 py-3 text-sm font-semibold text-white">Start guided ticket</button>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1fr_0.75fr]">
          <TicketForm />
          <TicketHistory />
        </div>
      </main>
      {open && (
        <div className="absolute inset-0 z-20 grid place-items-center bg-[#02070c]/85 p-4 backdrop-blur-sm">
          <section className="flex h-[620px] max-h-[90%] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#071019] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/8 p-5 sm:p-6">
              <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-ncs">Guided ticket · Step 1 of 3</p><h2 className="mt-1 text-xl font-semibold text-white">Let’s understand the issue</h2></div>
              <button onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-white/5">✕</button>
            </div>
            <ChatContent onUse={() => setOpen(false)} />
          </section>
        </div>
      )}
    </div>
  );
}

function DockConcept() {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative min-h-[720px] overflow-hidden pb-24">
      <PortalHeader />
      <main className="mx-auto grid max-w-6xl gap-6 p-5 sm:p-8 lg:grid-cols-[0.7fr_1fr]">
        <TicketHistory />
        <TicketForm roomy />
      </main>
      <section className={`fixed bottom-5 left-1/2 z-30 w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 overflow-hidden rounded-2xl border border-blue-ncs/30 bg-[#071019] shadow-[0_20px_70px_rgba(0,0,0,.55)] transition-all duration-300 ${open ? "h-[430px]" : "h-[64px]"}`}>
        <button onClick={() => setOpen((value) => !value)} className="flex h-16 w-full items-center justify-between px-4 sm:px-5">
          <span className="flex items-center gap-3"><Spark /><span className="text-left"><span className="block text-sm font-semibold text-white">Ask the ticket copilot</span><span className="hidden text-xs text-slate-500 sm:block">Get help while you fill out the form</span></span></span>
          <span className="rounded-lg border border-white/8 px-3 py-1.5 text-xs font-semibold text-slate-300">{open ? "Minimize" : "Open"}</span>
        </button>
        <div className="flex h-[366px] flex-col border-t border-white/8"><ChatContent /></div>
      </section>
    </div>
  );
}

export default function TicketLayoutConcepts() {
  const [active, setActive] = useState<Concept>("drawer");
  const current = concepts.find((concept) => concept.id === active)!;

  return (
    <main className="min-h-screen bg-[#02080e] text-slate-200">
      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-ncs">Ticket experience study</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Three ways to make AI feel lighter</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Each option keeps the assistant out of the permanent page layout. Switch concepts, then use the blue AI control inside each mockup.</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3" role="tablist" aria-label="Ticket layout concepts">
            {concepts.map((concept) => (
              <button key={concept.id} role="tab" aria-selected={active === concept.id} onClick={() => setActive(concept.id)} className={`min-w-44 rounded-xl border px-4 py-3 text-left transition ${active === concept.id ? "border-blue-ncs bg-blue-ncs/10" : "border-white/8 bg-white/[0.025] hover:border-white/20"}`}>
                <span className={`text-[10px] font-bold tracking-[0.18em] ${active === concept.id ? "text-blue-ncs" : "text-slate-600"}`}>OPTION {concept.number}</span>
                <span className="mt-1 block text-sm font-semibold text-white">{concept.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-400"><span className="font-semibold text-white">{current.name}:</span> {current.summary}</p>
          <p className="text-xs text-slate-600">Interactive desktop + mobile prototype</p>
        </div>

        <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#040b12] shadow-[0_30px_100px_rgba(0,0,0,.35)]" role="tabpanel">
          {active === "drawer" && <DrawerConcept />}
          {active === "modal" && <ModalConcept />}
          {active === "dock" && <DockConcept />}
        </div>
      </div>
    </main>
  );
}
