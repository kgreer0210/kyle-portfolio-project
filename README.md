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
npm test
npm run lint
npm run build
```

## Configuration

Create `.env.local` and configure only the integrations needed for the flow you
are developing. Environment files are ignored by Git.

| Area | Variables |
| --- | --- |
| Supabase | `NEXT_PUBLIC_SUPABASE_URL` and a supported publishable key; a service-role or secret key for server-side admin work |
| AI | `OPENROUTER_API_KEY` (SOW extraction, ticket triage, reply and update drafts) |
| Email | `RESEND_API_KEY`, `CONTACT_EMAIL`, `NEXT_PUBLIC_SITE_URL` |
| Notifications | `DISCORD_WEBHOOK_URL` |
| Retell | `RETELL_API_KEY` |
| Daily job | `CRON_SECRET` (Vercel Cron sends it as a bearer token to `/api/cron/daily`) |
| Email replies | `RESEND_WEBHOOK_SECRET`, `INBOUND_REPLY_DOMAIN` (e.g. `reply.kygrsolutions.com`), `INBOUND_REPLY_SECRET`; all optional, and emails stay link-only until set |
| Chat abuse protection | `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `TURNSTILE_ALLOWED_HOSTNAMES`, `RATE_LIMIT_SECRET`; see [Chat abuse protection](#chat-abuse-protection) |
| CRM access | `CRM_ADMIN_EMAILS` |
| Passkeys | `WEBAUTHN_RP_ID`, `WEBAUTHN_RP_NAME`, `WEBAUTHN_ORIGIN`, `WEBAUTHN_CHALLENGE_SECRET` |

For local passkey development, use `localhost` as the RP ID and
`http://localhost:3000` as the origin. In production, the RP ID must be the
serving domain without a scheme or port, and the origin must match exactly.

## Database

Supabase migrations live in `supabase/migrations/` and cover the CRM portal,
passkeys, chat persistence, ticket depth, AI triage, projects, ticket scope,
waiting-on-client automation, project updates, inbound email replies, chat
contact capture, and chat rate limits. Apply pending
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
- Client portal: authentication, project progress, requests, support tickets, and security
  settings
- Admin CRM: clients, projects, tickets, notes, billing metadata, and
  security settings
- Integrations: contact email, Retell webhooks, Discord
  notifications, and Sentry

### Projects

An admin creates a client and project with milestones, tasks, and a list of
things needed from the client. Clients see progress over client-visible tasks
and can upload files, mark items done, defer them, or ask for help from the
portal home. Legacy onboarding answers remain readable at
`/admin/clients/[organizationId]/onboarding`.

### Chat abuse protection

The visitor assistant is protected by Cloudflare Turnstile (managed mode, almost
no visible UI) and Supabase-backed rate limits. Neither needs a new vendor
beyond Cloudflare's free Turnstile widget.

| Variable | Where | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | public; handed to the browser by the server layout only when the other two server values are set | Turnstile widget site key |
| `TURNSTILE_SECRET_KEY` | server only | Turnstile `siteverify` secret |
| `TURNSTILE_ALLOWED_HOSTNAMES` | server only | Comma-separated **exact** hostnames the widget may be solved on |
| `RATE_LIMIT_SECRET` | server only | Random secret (for example `openssl rand -hex 32`) that keys the HMAC of client IPs. Not a Supabase key. |

**Turnstile**

- The first message of a conversation needs a Turnstile token (action `chat`).
  The server verifies it with Cloudflare, checks `success`, the action, and an
  exact hostname match, then stores the pass on the conversation row. Later
  turns reuse that server-side record; a client flag is never trusted. Tokens
  are single use, so a replayed token is rejected with a friendly "send it
  again" message.
- Turnstile runs only when the site key, the secret, **and** a non-empty
  hostname list are all set. If any is missing, verification is bypassed and
  the server logs a `[chat-abuse][DIAGNOSTIC][NOT PRODUCTION SAFE]` warning
  (once per instance). Visitors never see an error, and rate limits still apply.
  This is the state of any environment where the variables are not set.
- Keys set, but the script is blocked, errors, or times out in the browser:
  the widget sends nothing, keeps the visitor's message, and shows a clear
  "Try the security check again" button next to the normal ways to reach me
  (the direct phone line and the contact form). The server never accepts a
  first message without a verified token, so blocking the script is not a
  bypass. If Cloudflare itself is unreachable or rejects our secret, the server
  answers 503 `turnstile_unavailable` with the same retry-plus-contact state
  (a rejected secret also logs an error naming `TURNSTILE_SECRET_KEY`). This
  fails closed on purpose; contact options stay available throughout.
  Rejected tokens (replayed, expired, wrong action or hostname) are refused with
  a friendly "send it again" message and the widget requests a fresh token.
- The browser only gets the site key when the server will actually verify. The
  root layout (a server component) reads the three server-side values and passes
  the site key to the chat widget only if the site key, secret, **and**
  hostnames are all set. With any of them missing, the widget loads no script,
  waits for no token, and shows no retry state, matching the server's bypass.
  No secret ever reaches the browser. The layout reads the values at build time,
  so redeploy after adding or changing any of the three.

**Vercel setup (names only; nothing is configured by the repo)**

Add all four variables in Vercel for **Production** (none exist there today). Create the Turnstile widget
in Cloudflare in Managed mode with hostnames for every production frontend, at
minimum `kygrsolutions.com`, plus `www.kygrsolutions.com` if `www` serves the
site rather than redirecting. Set `TURNSTILE_ALLOWED_HOSTNAMES` to the same
list. Do not use wildcards for Vercel hosts.

Preview deployments get a new hostname per deployment, so they cannot be listed
exactly. Either leave the three Turnstile variables unset in **Preview** (the
chat then bypasses Turnstile with the diagnostic log and keeps rate limits), or
give the branch a stable alias domain, register that one hostname on the widget,
and set it in `TURNSTILE_ALLOWED_HOSTNAMES` for Preview. Set `RATE_LIMIT_SECRET`
in Preview as well if previews should share the database limiter; use a
different value from Production.

**Rate limits** (fixed windows, in `CHAT_RATE_LIMITS` in `src/lib/rateLimit.ts`)

| Bucket | Limit |
| --- | --- |
| Per IP | 15 per minute, 100 per hour |
| Per conversation (validated UUID, lower-cased) | 6 per minute, 40 per hour |
| New conversations per IP | 10 per hour |

The limit store reuses the existing server-side Supabase Secret Key through the
normal client in `src/lib/supabase/env.ts` (`SUPABASE_SERVICE_ROLE_KEY`, then
`SUPABASE_SECRET_KEY`); no new Supabase variable is needed. `RATE_LIMIT_SECRET`
is a separate HMAC secret, not a Supabase key. Counters are keyed by an HMAC of the server-derived IP (Vercel's
`x-vercel-forwarded-for`; IPv6 is collapsed to its /64 for the bucket only, while Cloudflare's `remoteip` gets the exact address) and of the
conversation id; raw IPs are never stored. Limits run before the model is
called and before any message is stored. If the database limiter errors (or the
migration is missing), the route logs and falls back to a per-instance
in-memory limiter, so protection degrades but chat stays up. If
`RATE_LIMIT_SECRET` is unset, only the in-memory limiter runs, with a diagnostic
log. Counter rows older than two days are pruned opportunistically by the same
database function.

### Chat contact capture

After a substantive exchange the assistant may ask once for an email or phone
number; it never gates an answer. Emails and common US phone formats are parsed
from every visitor message (conservatively, so dates, amounts, and IDs are
ignored) and saved on the conversation immediately as `visitor_email` and
`visitor_phone` (E.164). A captured value is only replaced by an explicit
correction. Both appear in the end-of-chat digest. The system
prompt we generate carries only "contact on file: email/phone/none" flags, never a
stored value, and logs and client responses never include contact details.

**Privacy boundary:** the visitor's own messages are still sent to the model
provider (OpenRouter) as part of the conversation, exactly as before this
change, so an email or phone number a visitor types in chat reaches OpenRouter.
The transcript is deliberately not redacted, because that would degrade the
chat. This change adds no new exposure: no contact metadata in prompts, logs, or
client responses.

Storage failures are never silent. If the conversation state cannot be read, or
the conversation row or user message cannot be written, `/api/chat` answers 503
JSON (`storage_unavailable`, a friendly "try again" message with no request
content) **before** the model runs, and the widget puts the message back so the
visitor can resend. Proceeding on an unknown state would have skipped writes
that restore a stored email, phone, or Turnstile pass. The same applies to
`/api/chat/end`: a failed read answers 503 and leaves the conversation active so
a later call can still finalize it and send the digest. Storage errors are
logged by operation and database code only, never the message, details, or
payload. Because writes now fail visibly, **apply the migrations before
deploying** (a missing `visitor_phone` or `turnstile_state` column fails the
write for a message that carries a phone or a Turnstile pass).

### Passkeys

Passkey registration and management are available from both portal and admin
security settings, and passkey sign-in is available on the login page. A
deployment needs both passkey migrations and the WebAuthn variables above.

## Project map

```text
src/app/                 App Router pages and API routes
src/components/          Public-site and CRM components
src/data/                Portfolio and AI knowledge content
src/lib/                 Auth, Supabase, CRM, projects, AI, and integrations
src/types/               Shared TypeScript types
supabase/migrations/     Ordered database migrations
public/                  Images and project screenshots
```

Development conventions and the current architecture notes are maintained in
`AGENTS.md`.
