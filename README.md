# KYGR Solutions Portfolio

The production website for [KYGR Solutions](https://kygrsolutions.com). In
addition to the public portfolio and service pages, this repository contains a
Supabase-backed client portal, admin CRM, project onboarding, support tickets,
passkey authentication, and AI-assisted visitor and ticket workflows.

## Stack

- Next.js 16 App Router, React 19, and TypeScript
- Tailwind CSS 4 and Motion
- Supabase Auth and Postgres
- Vercel AI SDK with OpenRouter
- Resend email, Discord notifications, and Retell webhooks
- Sentry monitoring

The repository uses npm as its declared package manager.

## Local development

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. Before submitting changes, run:

```bash
npm run lint
npm run build
```

## Configuration

Create `.env.local` and configure only the integrations needed for the flow you
are developing. Environment files are ignored by Git.

| Area | Variables |
| --- | --- |
| Supabase | `NEXT_PUBLIC_SUPABASE_URL` and a supported publishable key; a service-role or secret key for server-side admin work |
| AI | `OPENROUTER_API_KEY` (legacy code also accepts `OPEN_ROUTER_API_KEY`) |
| Email | `RESEND_API_KEY`, `CONTACT_EMAIL`, `NEXT_PUBLIC_SITE_URL` |
| Notifications | `DISCORD_WEBHOOK_URL` |
| Retell | `RETELL_API_KEY` |
| CRM access | `CRM_ADMIN_EMAILS` |
| Passkeys | `WEBAUTHN_RP_ID`, `WEBAUTHN_RP_NAME`, `WEBAUTHN_ORIGIN`, `WEBAUTHN_CHALLENGE_SECRET` |

For local passkey development, use `localhost` as the RP ID and
`http://localhost:3000` as the origin. In production, the RP ID must be the
serving domain without a scheme or port, and the origin must match exactly.

## Database

Supabase migrations live in `supabase/migrations/` and cover the CRM portal,
passkeys, chat persistence, ticket depth, and AI triage. Apply pending
migrations with:

```bash
supabase db push
```

Do not edit a migration that has already been applied. Add a later migration
for schema changes.

## Application areas

- Public site: home, about, services, projects, and contact pages
- Visitor assistant: streaming OpenRouter chat with Markdown knowledge in
  `src/data/knowledge/`, Supabase persistence, lead scoring, and email digests
- Client portal: authentication, onboarding, support tickets, and security
  settings
- Admin CRM: clients, onboarding review, tickets, notes, billing metadata, and
  security settings
- Integrations: contact email, Retell webhooks, Discord
  notifications, and Sentry

### Client onboarding

When creating a client, an admin chooses either the standard guided checklist
or immediate ticket access for an existing client. Standard clients complete
the onboarding steps in the portal and submit their responses; an admin reviews
the package at `/admin/onboarding/[organizationId]` and can complete or reopen
it.

### Passkeys

Passkey registration and management are available from both portal and admin
security settings, and passkey sign-in is available on the login page. A
deployment needs both passkey migrations and the WebAuthn variables above.

## Project map

```text
src/app/                 App Router pages and API routes
src/components/          Public-site and CRM components
src/data/                Portfolio and AI knowledge content
src/lib/                 Auth, Supabase, CRM, onboarding, AI, and integrations
src/types/               Shared TypeScript types
supabase/migrations/     Ordered database migrations
public/                  Images and project screenshots
```

Development conventions and the current architecture notes are maintained in
`AGENTS.md`.
