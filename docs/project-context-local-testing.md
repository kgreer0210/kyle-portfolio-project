# Test project context locally

The feature lives on `feat/project-ticket-context` in the separate worktree
`/home/kgreer/dev/kyle-portfolio-project-context`. The original checkout stays on
`master`. No live database migrations have been applied.

## Start or restart

```bash
cd /home/kgreer/dev/kyle-portfolio-project-context
doppler setup --project kygr-solutions-website --config dev --no-interactive
npm ci
npx supabase start
npx supabase migration up --local
npm run context:seed
npm run dev:context
```

In another terminal in that worktree:

```bash
npm run context:worker
```

The app runs at http://localhost:3100. The separate Supabase instance uses API
port 55421, database port 55422, Studio port 55423, and local email port 55424.
Its Docker project name is `kyle-portfolio-project-context`.

`dev:context` obtains model credentials through Doppler, then forcibly replaces
all Supabase credentials/URLs with this local instance. It refuses another API
port. It disables outbound Resend/Discord/Retell integrations and uses local auth
settings. There is no need to copy `.env.local` or export real secret values.
AI generations still use the configured OpenRouter account.

The default feature flag is off. The local launcher explicitly enables
`PROJECT_CONTEXT_ENABLED=true`. Normal production settings are unchanged.

## Test accounts

These are synthetic local accounts, unrelated to real client logins:

| Role | Email | Password |
| --- | --- | --- |
| Admin | admin@context.test | Context-local-only-2026! |
| Client | client@context.test | Context-local-only-2026! |
| Other organization client | other@context.test | Context-local-only-2026! |

## Admin test

1. Sign in at `/login` as the local admin.
2. Open Clients → Context Demo Client → Booking Application, or visit
   `/admin/clients/10000000-0000-4000-8000-000000000001/projects/20000000-0000-4000-8000-000000000001`.
3. Inspect the two seeded sources: an approved booking workflow and a private
   implementation note. The canary strings are synthetic isolation test markers.
4. Add/edit a workflow note; approve only content appropriate for clients.
   Refresh it and inspect the published entry. Disable/enable or disconnect it.
5. Add a public HTTPS website. Scans are bounded to 24 pages and do not log into
   private screens or render JavaScript-only interfaces. `www` canonical redirects
   are allowed; private network URLs and redirects to other websites are blocked.
6. Open Tickets → Booking button does nothing and select Draft reply. Expand
   Project evidence and review source timestamps/coverage. The draft stays editable
   and is not sent automatically. Sending a test reply writes only to the local DB.

## Client test

1. Sign out and sign in as the local client.
2. Open Tickets and select Booking Application.
3. Open Help me write this and describe a booking-button issue. The assistant
   should use approved workflow details to clarify location and behavior.
4. Switch projects; the assistant conversation should reset.
5. Apply the summary and submit. Verify the resulting ticket retains the selected
   project. General support is allowed without a project.
6. Sign in as the other organization client; the first organization's projects,
   tickets, and context must be inaccessible.

## GitHub setup

Repository ingestion is implemented but requires a read-only GitHub App. No App
credentials were found in the current Doppler dev configuration. GitHub stays
unavailable in the source selector until credentials are configured.

- Register a GitHub App with repository Contents read-only and Metadata read-only.
- Set `GITHUB_CONTEXT_APP_ID`, `GITHUB_CONTEXT_PRIVATE_KEY`, and
  `GITHUB_CONTEXT_WEBHOOK_SECRET` in an appropriate Doppler config. Never commit
  keys. The private key accepts PEM newlines or escaped newlines.
- Configure webhook URL `/api/webhooks/github-context` on a reachable test host,
  subscribe to Push and installation/repository access events, and install the
  app on only the selected repositories.
- From the installation settings URL, obtain its installation ID. Add a repository
  source using `owner/repository`, installation ID, and branch. The server verifies
  access. Code is always private, pinned to a commit, and does not prove deployment.
- The initial scan retains up to 60 sorted, allowed source/documentation files,
  each limited to 16,000 characters. Large/truncated repository trees report a
  coverage error; use curated notes for workflows outside these limits.

For a production rollout, first apply the checked-in migrations to a test database,
verify GitHub access and RLS, then configure a durable scheduler calling the
protected `/api/cron/project-context` endpoint with `CRON_SECRET`. The existing
production `vercel.json` schedule is intentionally unchanged for this local test
release. Confirm hosting cadence/limits before enabling automated production scans.

## Verification commands

```bash
npm run test
npm run lint
npm run build:context
npm run context:test-db
docker exec -i supabase_db_kyle-portfolio-project-context psql -U postgres -d postgres < scripts/context-db-checks.sql
```

Avoid running a build and dev server simultaneously if their Next output interferes.
The database SQL checks use a transaction and roll back their temporary fixtures.

## Stop

Stop the dev server and worker with Ctrl+C. To stop only this local Supabase
instance, run `npx supabase stop` from this worktree. Do not stop another project's
containers. Do not remove the worktree while its feature changes are uncommitted.

## Verification performed

- 137 automated tests passed; lint passed with three existing navigation warnings.
- Production build and TypeScript checks passed.
- Local SQL/REST checks passed for organization ownership, RLS/RPC access, client-safe
  selection, fenced claims, failed-scan preservation, disabled sources, webhook
  deduplication, and mid-scan follow-up refreshes.
- Browser interactions verified admin source creation, evidence-backed reply
  generation, client assistant summary application, and ticket submission with
  the selected project. Unauthorized project/admin access returned 403.
- Desktop/mobile DOM layout checks found no horizontal overflow. Preview screenshot
  capture was unavailable, so visual screenshot review could not be completed.
- A public website scan completed and published 11 entries. Real GitHub ingestion
  remains unverified because the App credentials have not been configured.
