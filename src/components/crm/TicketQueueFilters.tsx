"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ticketPriorities,
  ticketPriorityLabels,
  ticketStatusLabels,
} from "@/lib/crm";
import type { TicketStatus } from "@/types/crm";

const statusOptions = Object.keys(ticketStatusLabels) as TicketStatus[];

interface TicketQueueFiltersProps {
  view: string;
  q: string;
  status: string;
  priority: string;
  org: string;
  organizations: Array<{ id: string; name: string }>;
}

export default function TicketQueueFilters({
  view,
  q,
  status,
  priority,
  org,
  organizations,
}: TicketQueueFiltersProps) {
  const router = useRouter();
  const [search, setSearch] = useState(q);

  // Re-sync the input when the URL-driven `q` prop changes (adjust state
  // during render instead of in an effect).
  const [prevQ, setPrevQ] = useState(q);
  if (q !== prevQ) {
    setPrevQ(q);
    setSearch(q);
  }

  function applyFilters(overrides: Record<string, string>) {
    const params = new URLSearchParams();
    const next = { view, q: search, status, priority, org, ...overrides };

    if (next.view && next.view !== "active") params.set("view", next.view);
    if (next.q) params.set("q", next.q);
    if (next.status) params.set("status", next.status);
    if (next.priority) params.set("priority", next.priority);
    if (next.org) params.set("org", next.org);

    const queryString = params.toString();
    router.push(`/admin/tickets${queryString ? `?${queryString}` : ""}`);
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    applyFilters({});
  }

  const selectClasses =
    "rounded-2xl border border-penn-blue bg-rich-black px-4 py-2.5 text-sm text-text-primary";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search titles..."
          className="w-52 rounded-2xl border border-penn-blue bg-rich-black px-4 py-2.5 text-sm text-text-primary"
        />
        <button
          type="submit"
          className="rounded-full border border-penn-blue px-4 py-2.5 text-sm font-semibold text-text-primary transition hover:border-blue-ncs"
        >
          Search
        </button>
      </form>

      <select
        value={status}
        onChange={(event) => applyFilters({ status: event.target.value })}
        className={selectClasses}
      >
        <option value="">All statuses</option>
        {statusOptions.map((value) => (
          <option key={value} value={value}>
            {ticketStatusLabels[value]}
          </option>
        ))}
      </select>

      <select
        value={priority}
        onChange={(event) => applyFilters({ priority: event.target.value })}
        className={selectClasses}
      >
        <option value="">All priorities</option>
        {ticketPriorities.map((value) => (
          <option key={value} value={value}>
            {ticketPriorityLabels[value]}
          </option>
        ))}
      </select>

      <select
        value={org}
        onChange={(event) => applyFilters({ org: event.target.value })}
        className={selectClasses}
      >
        <option value="">All clients</option>
        {organizations.map((organization) => (
          <option key={organization.id} value={organization.id}>
            {organization.name}
          </option>
        ))}
      </select>

      <select
        value={view || "active"}
        onChange={(event) => applyFilters({ view: event.target.value })}
        className={selectClasses}
      >
        <option value="active">Active only</option>
        <option value="all">All tickets</option>
      </select>
    </div>
  );
}
