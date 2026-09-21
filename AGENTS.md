# AGENTS.md

## Purpose

This is the canonical development guide for the KYGR Solutions portfolio and
client portal. Keep it aligned with the code and keep tool-specific notes in
their tool-specific files.

## Current system

The repository is a Next.js 16 App Router application with two connected
surfaces:

- A public marketing site with portfolio, services, contact, and an AI
  visitor assistant.
- An authenticated Supabase CRM with separate client and admin experiences,
  project onboarding, support tickets, organization notes, billing metadata,
  and passkey management.

The application is deployed at `kygrsolutions.com`. npm is the declared package
manager.

## Commands

```bash
npm install
npm run dev
npm run lint
npm run build
```

Run lint and a production build for changes that affect runtime behavior or
dependencies. Add focused tests with an appropriate test setup when introducing
logic that warrants automated coverage; this branch does not currently define
a test command.

## Code map

- `src/app/` — pages, layouts, metadata, and API route handlers
- `src/components/` — public UI and `crm/` components
- `src/data/` — portfolio data and live AI knowledge Markdown
- `src/lib/` — auth, Supabase clients, CRM logic, onboarding, AI, and external
  integrations
- `src/types/` — shared domain types
- `supabase/migrations/` — ordered database schema changes
- `public/` — site images and project screenshots

Protected routing is enforced in `middleware.ts`: unauthenticated users are
sent to `/login`, admins stay in `/admin`, and clients stay in `/portal`. Route
handlers and server helpers must still enforce authorization; middleware is not
a substitute for resource-level checks.

## Domain behavior to preserve

### Visitor assistant

`src/lib/chatKnowledge.ts` reads the Markdown files under
`src/data/knowledge/` on every request. Those files are runtime inputs, not
documentation clutter. The assistant answers first, asks at most one follow-up,
does not quote prices, and offers scheduling naturally. Chat turns are stored
in Supabase and finalized with lead scoring and an email digest.

`diagnostic-questions.md` keeps its historical filename but now contains the
visitor-intent response guide. Do not rename it without updating the loader.

### Client onboarding

The current production flow uses the fixed step definitions in `src/lib/crm.ts`.
When creating a client, an admin chooses the standard guided checklist or
`skipped_legacy` for immediate ticket access. Standard clients save individual
steps and submit the package; admins review, complete, or reopen it. Preserve
the lock rules for submitted and completed onboarding records.

### Tickets and AI triage

New client tickets are triaged after creation. AI may add an internal-only
analysis note, raise priority, infer category, and enrich the admin email. A
triage failure must not block ticket creation. Never return internal notes to a
client. The editable rubric is `src/data/knowledge/ticket-triage.md`.

### Authentication and passkeys

Supabase Auth supplies sessions and role profiles. WebAuthn routes live under
`src/app/api/auth/passkey/`; registration and management are exposed in portal
and admin security settings. Keep service-role credentials server-only. Do not
log secrets, challenges, magic links, or full authentication assertions.

## Database work

Use a new timestamped file in `supabase/migrations/` for schema changes. Do not
rewrite an applied migration. Preserve RLS and grants, and consider both admin
and organization-member access for CRM tables.

## UI and content

Tailwind CSS 4 tokens and global component classes live in
`src/app/globals.css`. The core palette is rich black, Oxford blue, Penn blue,
Lapis Lazuli, Blue NCS, and the three text colors defined there. Reuse those
tokens and existing component patterns before adding new visual primitives.

Public navigation and portfolio copy are data-driven where possible. Update
`src/data/` rather than duplicating content inside components.

## Next.js and TypeScript

- TypeScript is strict; avoid weakening types or adding broad assertions.
- This repository uses Next.js 16. Read the relevant local documentation in
  `node_modules/next/dist/docs/` before relying on remembered framework APIs.
- Prefer Server Components. Add `"use client"` only where browser APIs, state,
  or event handlers require it.
- Follow existing API response and auth helpers instead of inventing parallel
  patterns.

## Verification

Verify the relevant public, client, or admin flow at mobile and desktop widths
for UI work. Pay particular attention to onboarding persistence, authorization,
and client visibility when those areas change. Report any check that could not
be run because it needs external credentials or deployed infrastructure.
