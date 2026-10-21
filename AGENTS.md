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

Run tests, lint, and a production build for changes that affect runtime behavior
or dependencies. Add focused tests when introducing logic that warrants
automated coverage.

## Code map

- `src/app/` — pages, layouts, metadata, and API route handlers
- `src/components/` — public UI and `crm/` components
- `src/data/` — portfolio data and live AI knowledge Markdown
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
portal home summarizes client-visible progress, outstanding requests, and
recent updates. `/portal/projects/[projectId]` shows the milestone roadmap,
client-visible tasks, requests, updates, and project support in separate tabs.

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

## Client workspace

`PortalNavigation` links Home, Projects, Support, and Settings. The project
index includes completed projects. New tickets are created at
`/portal/tickets/new`; `/portal/tickets` is searchable support history with open
and all views. Replies stay below the conversation. Keep portal surface styling
scoped under `.client-workspace` / `.client-panel`, and reuse request/assistant
components instead of introducing new write paths. All project reads must use
the signed-in client's RLS-scoped connection; never expose SOW, internal tasks,
or admin notes in client tab content.

## Admin workspace

Admin navigation lives in `AdminNavigation`; the authenticated layout provides
its persistent sidebar and compact header. `/admin/projects` lists projects
across clients. Client profiles and project work use `WorkspaceTabs`, which
supports keyboard navigation and retains mounted form state when changing tabs.
Keep admin surface styles scoped under `.admin-workspace` or `.admin-panel`;
shared portal forms must retain their client behavior. Ticket reply composition
belongs below the conversation, with secondary editing and AI instructions
available through disclosures.

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

## Agent skills

### Issue tracker

GitHub Issues on `kgreer0210/kyle-portfolio-project`. See
`docs/agents/issue-tracker.md`.

### Domain docs

Single-context: one `GLOSSARY.md` at the repo root and ADRs in `docs/adr/`. See
`docs/agents/domain.md`.

## Cursor Cloud specific instructions

Cloud agents install dependencies with `npm ci` (`.cursor/environment.json`).
The repo does not pin Node in `package.json` `engines` or `.nvmrc`. CI uses
Node 22, which matches the default Cloud Agent image, so install does not
switch Node versions. The root `Dockerfile` is the production image (`node:20`)
and is not the agent base image. `package.json` pins `packageManager` to
`npm@12.0.1`; CI applies that pin with `corepack enable npm` before `npm ci`.

Agents use a Supabase **dev** project. Never use the production service-role
key. `.env.example` lists variable names with empty values. Put secret values
in the Cloud Agent secret store, not in the repo.

Public / non-secret:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  (either one is the client key)
- `CONTACT_EMAIL`
- `CRM_ADMIN_EMAILS`
- `WEBAUTHN_ORIGIN`
- `WEBAUTHN_RP_ID`
- `WEBAUTHN_RP_NAME`

Secret:

- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_SECRET_KEY`
- `RESEND_API_KEY`
- `RESEND_WEBHOOK_SECRET`
- `OPENROUTER_API_KEY`
- `RETELL_API_KEY`
- `DISCORD_WEBHOOK_URL`
- `CRON_SECRET`
- `WEBAUTHN_CHALLENGE_SECRET`

Names checked against `process.env` reads:

- The client key also accepts `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`,
  after the anon key and publishable key (`middleware.ts`,
  `src/lib/supabase/env.ts`). Set one of the three.
- The service credential accepts either `SUPABASE_SERVICE_ROLE_KEY` or
  `SUPABASE_SECRET_KEY` (`src/lib/supabase/env.ts`). Use the dev project's key.
- Inbound ticket replies also read `INBOUND_REPLY_DOMAIN` (non-secret) and
  `INBOUND_REPLY_SECRET` (secret) in `src/lib/inboundEmail.ts`. Both are
  optional; replies stay link-only until they are set.
- `WEBAUTHN_RP_ID`, `WEBAUTHN_RP_NAME`, and `WEBAUTHN_ORIGIN` fall back to the
  production host when unset (`src/lib/webauthn/config.ts`). Set them for the
  dev origin.
- `NEXT_PUBLIC_SITE_URL` falls back to the production site URL when unset
  (`src/lib/crm.ts`).
- Sentry is not configured through environment variables.

There is no `typecheck` script. CI and cloud agents typecheck with
`npx tsc --noEmit`.

```bash
npm run lint
npx tsc --noEmit
npm test
npm run build
```
