# AGENTS.md

## Purpose

This is the canonical development guide for the KYGR Solutions portfolio and
client portal. Keep it aligned with the code and keep tool-specific notes in
their tool-specific files.

## Current system

The repository is a Next.js 16 App Router application with two connected
surfaces:

- A public marketing site with portfolio, services, blog, contact, and an AI
  visitor assistant.
- An authenticated Supabase CRM with separate client and admin experiences,
  projects (milestones, tasks, client requests), support tickets, organization
  notes, billing metadata,
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
- `src/data/` — portfolio/blog data and live AI knowledge Markdown
- `src/lib/` — auth, Supabase clients, CRM logic, projects, AI, and external
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

### Projects (replaces onboarding)

There is no client questionnaire. An admin creates a client and project (from
a SOW or by hand) with milestones, tasks, and "needs from client" requests. The
portal home shows progress over client-visible tasks, the milestone timeline,
and the requests list.

- Pure logic: `src/lib/projects.ts` (progress, milestone state, request
  actions), `src/lib/projectDraft.ts` (draft schema and row building),
  `src/lib/projectItems.ts` (admin item edits), `src/lib/projectCreate.ts`
  (create with compensating rollback).
- Clients have SELECT-only RLS on project tables; hidden tasks are filtered by
  RLS. Every client write goes through `/api/crm/projects/requests/[id]`,
  which checks membership and uses the service role. Uploads and "help me"
  reuse one `Materials: …` ticket per request.
- `project_sow` is admin-only (source file, extraction, out-of-scope notes).
  Never expose it to clients.
- Legacy onboarding is retired. `client_onboardings` and
  `onboarding_step_responses` are read-only history shown at
  `/admin/clients/[id]/onboarding`; keep `onboardingSteps` and
  `formatFieldValue` in `src/lib/crm.ts` for that page.

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
for UI work. Pay particular attention to project request actions, authorization,
and client visibility when those areas change. Report any check that could not
be run because it needs external credentials or deployed infrastructure.
