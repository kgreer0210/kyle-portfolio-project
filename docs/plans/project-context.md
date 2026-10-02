# Project context for ticket reply drafts and ticket intake

Status: implemented for isolated local testing on `feat/project-ticket-context`.
See `docs/project-context-local-testing.md` for startup, credentials, verification,
and the remaining GitHub App/production scheduler setup. The findings below
record the pre-implementation system; production remains unchanged.

## Outcome and scope

Maintain project-specific context before a ticket arrives. Use relevant context
to improve Kyle's reply drafts first, then the client ticket-writing assistant.
Kyle still reviews and sends replies. The client assistant identifies the
affected feature and gathers reproduction details; it does not diagnose a
failure as verified merely because it found matching code.

Support public website pages, GitHub code, and manually maintained workflow
notes. Authenticated browser inspection, production database access, automated
fixes, and automatic ticket replies are later, separate capabilities.

## Findings verified on September 30, 2026

- Supabase MCP access works. The KYGR Solutions project is
  `paseihtqgpqefeiajhey`; schema inspection was read-only.
- `organizations.website_url` exists and can prefill source setup.
- `tickets.project_id` exists. Ticket creation auto-selects a project only
  when exactly one project is active. The client form has no project selector.
- Projects have organization-scoped ownership; project SOW access is admin-only.
- No public context tables currently exist. `vector`, `pgmq`, and `pg_cron`
  are not currently installed. They are not prerequisites for this plan.
- Reply drafts stream from
  `src/app/api/admin/tickets/[ticketId]/draft-reply/route.ts` and use
  `src/lib/ticketReplyDraft.ts` with the existing thread and project scope.
- Client assistance streams from `src/app/api/crm/tickets/assist/route.ts`.
  It currently authenticates the client but does not load project context.
- `vercel.json` schedules daily housekeeping; reliable context refresh needs
  its own processing/retry schedule, sized to the deployment's supported limits.

## 1. Establish source management and storage

Create three new tables through a new timestamped migration. Use the Supabase
CLI migration creation workflow and keep the exact migration in the repository
when applying it through MCP. Never rewrite an applied migration.

### `project_context_sources`

One row per project website, repository, or manual workflow collection.

Suggested fields:

- `id`, `project_id`, `organization_id`, `kind`, `label`, `enabled`.
- `website_url`, or GitHub `repository_id`, `repository_owner`,
  `repository_name`, `branch`, and `installation_id` as appropriate.
- `environment` (production, staging, or unknown); do not equate a repository
  branch with deployed production without deployment evidence.
- Validated `config` JSON for include/exclude paths and bounded fetch settings.
- `active_run_id`, `last_attempt_at`, `last_success_at`, `next_sync_at`,
  sanitized `last_error`, `created_at`, `updated_at`.

Validate kind-specific configuration. Store connection identifiers, never
GitHub tokens or site passwords, in these rows. A disabled source is immediately
excluded from retrieval, even if its old entries remain for retention.

### `project_context_sync_runs`

One row per initial scan, refresh, or published manual-note revision; automated
runs also serve as durable work records.

Suggested fields:

- `id`, `source_id`, `project_id`, `organization_id`, `trigger`, `status`.
- `dedupe_key`, `attempt_count`, `available_at`, `claimed_until`, `claim_token`.
- Bounded `cursor`/checkpoint for batched work, `started_at`, `completed_at`.
- `source_version` (commit SHA or website scan version), processing counts,
  sanitized error, timestamps.

Deduplicate webhook deliveries and pending refreshes. Claim work atomically;
completion must prove ownership of the current claim. An expired worker cannot
publish over a newer run. Use the existing notification claim/fencing behavior
as a reference, with separate context-specific functions and records.

### `project_context_entries`

One row per searchable page, code excerpt, or workflow section in a run.
These are reusable application facts, not descriptions of an individual ticket.

Suggested fields:

- `id`, `source_id`, `run_id`, `project_id`, `organization_id`.
- `entry_key`, `kind`, `title`, `content`, `metadata`, `audience`.
- `source_locator` (URL or file path), `content_hash`, `observed_at`, timestamps.
- Searchable text/index covering title, feature terms, and content.

Structured metadata can include route, button label, link destination, form
fields, user role, line numbers, and parent-entry provenance. Start with
Postgres full-text search and explicit URL/path matches. Use a small fixed
context budget. Add semantic retrieval only if pilot results justify it.

Raw website/code entries default to `admin`. Client-safe entries are a separate,
reviewed projection: select approved fields or write a sanitized workflow entry.
Do not pass private code to the client model and rely on a prompt to hide it.
Manual client-safe notes must not silently become automatic scraper output.

### Integrity, access, publication, and retention

- Enforce matching organization/project/source/run ownership with composite
  foreign keys, following the existing project child-table pattern.
- Enable RLS and explicit grants. Admins manage context through authenticated
  admin routes. Clients cannot directly read raw source, run, or entry tables;
  client assistance retrieves approved entries through a membership-checked
  server path. Service-role functions and job claims remain server-only.
- Build new entries under a pending run. Atomically switch `active_run_id` only
  after the run completes successfully. Retrieval uses that run exclusively.
- Preserve the last successful version on failure. Successful publication removes
  deleted pages/files from the active view. Explicit disconnect/access revocation
  excludes the source immediately rather than continuing to use private content.
- Keep the active and previous successful run initially; prune older completed
  runs after a short configurable retention window. Never prune active work.

No new Storage bucket is required initially. Extracted text lives in table rows.
If screenshots or source files are later retained, create a private bucket with
organization/project paths, restricted policies, retention, and row references.

## 2. Add admin source settings

Extend the existing admin project page with a separate `ProjectContextPanel`.
Keep the existing project editor focused on tasks and milestones.

- Add website, connect repository, and add workflow note actions.
- Show source type, environment, last successful check, entry count, and
  queued/syncing/ready/failed state. Distinguish last success from last attempt.
- Provide refresh, inspect entries, approve a client-safe projection, edit,
  disable, and disconnect controls.
- Prefill website from the organization but require saving an explicit source.
- Add admin endpoints below `/api/admin/projects/[projectId]/context/` for source
  management, entries, and refresh. Reuse existing auth and JSON error helpers.

Mobbin inspiration inspected through MCP:

- [Intercom knowledge sources](https://mobbin.com/screens/926aa374-291e-4191-8247-dd97387764fc):
  source groups, connection status, and sync/import actions.
- [Featurebase ticket copilot](https://mobbin.com/screens/b0510562-5e86-4aef-9613-6981579dd756):
  contextual assistance beside the conversation and reply composer.

Adapt those arrangements to existing dark palette, cards, typography, and
buttons. On mobile, stack source cards and collapse evidence below the draft.

## 3. Build bounded background ingestion

Add server-only modules for fetching, extracting, run processing, publication,
and retrieval. Keep the implementations separated by source type.

Website ingestion:

- Fetch configured public pages and same-origin links within bounded depth/page
  counts. Extract readable text, links, button labels, and forms where present.
- Static HTML cannot fully capture JavaScript-rendered screens. Record coverage
  gaps and permit manual notes; evaluate browser rendering separately if needed.
- Validate URLs, DNS destinations, and each redirect; block private/internal
  addresses. Limit time, bytes, content types, concurrency, and crawl scope.
- Use hashes and HTTP validators when available to avoid repeated extraction.

GitHub ingestion:

- Use a read-only GitHub App installation with access to selected repositories.
  Configuration requires registering the app, server-held private key/app ID,
  webhook secret, callback wiring, and installation by an authorized repo owner.
- Validate signed webhooks and installation/repository mappings; the webhook
  only enqueues work and acknowledges promptly.
- Pin each scan to a commit SHA. Index allowed code and documentation; exclude
  secrets, environment files, binaries, generated output, and dependency folders.
- Refresh on relevant pushes, with periodic reconciliation for missed events.
  Only label code as deployed when a connected deployment source confirms it.
- Track installation access/revocation. With multiple installations, introduce
  a fourth table, `github_app_installations`, for installation/account IDs,
  connection lifecycle, and server-validated ownership mapping. It stores no
  tokens and is needed when shipping GitHub connections, not website-only work.

Queue processing:

- Persist each job before starting work. Use a dedicated bounded processor;
  an immediate post-response attempt can improve responsiveness but does not
  replace a durable retry runner.
- Add a protected scheduled processor with a cadence supported by the hosting
  plan. Verify cadence and function limits before implementing; if inadequate,
  choose a managed worker/queue instead. Do not bundle scans into daily email work.
- Checkpoint large scans, retry with backoff, cap attempts, expose failures, and
  publish atomically. Coalesce overlapping refreshes and serialize publication.

For Lexi, begin with repository context plus workflow notes. Public URL scans
will not access her private backend. Authenticated browsing would require an
additional scoped account/session design and is outside this initial release.

## 4. Improve reply drafts first

Update `src/lib/ticketReplyDraft.ts`, the draft route, and
`src/components/crm/TicketReplyForm.tsx`.

- Resolve the ticket's project and organization from the database, then load
  relevant active entries using title, description, recent messages, and steer.
- Include source version, observed time, and coverage/freshness limitations.
- Treat retrieved text as evidence, never instructions. Prevent claims of
  reproduction, deployment, fixes, or current availability without evidence.
- Keep generation streaming. Extend its response protocol to carry a bounded
  evidence metadata event and draft text events; update the reader accordingly.
  Display the exact entries supplied to that generation, not a later query.
- Evidence shows source title/link, version, freshness, and missing context.
  Preserve review/edit/send behavior; generated drafts are not automatically sent.
- No project, no matching entries, or retrieval failure falls back to the
  existing drafting flow. Draft requests never initiate an entire crawl.

## 5. Add project-aware client ticket assistance

Update the portal ticket page, `NewTicketForm`, `TicketAssistPanel`, the assist
route, ticket creation route, and `src/lib/ticketProjects.ts`.

- Load eligible projects for the authenticated organization. Auto-select a sole
  active project; offer a selector when multiple exist and a general-ticket option.
- Include the chosen project in assistance and submission requests. Validate
  membership and project eligibility server-side; never trust posted ownership.
- Reset the assistant conversation when its project changes to prevent context
  from the prior project influencing the next ticket.
- Retrieve only approved client-safe entries. For ambiguous buttons/screens,
  confirm the match before adding location/expected behavior to the summary.
- Preserve existing one-question-at-a-time behavior and summary markers. Include
  page URL/screen name, control label, expected and reported behavior where known.
- Preserve ticket submission even when assistance or context retrieval fails.
  Leave AI triage changes for a subsequent increment rather than expanding scope.

## 6. Verify, pilot, and release

- Focused tests: organization isolation, client-safe selection, stale/missing
  context fallback, project selection, URL/redirect safety, secret exclusions,
  webhook signatures/deduplication, retries, claim fencing, atomic publication,
  deletion/revocation behavior, and streaming metadata association.
- Database checks: constraints, grants, RLS as admin/member/other member/anon,
  worker permissions, and Supabase security/performance advisors.
- Run `npm run test`, `npm run lint`, and `npm run build` for runtime changes.
- Verify source settings, draft evidence, ticket assistance, and submission at
  desktop/mobile widths with representative roles and multiple projects.
- Pilot a simple website and a private application such as Lexi's, using approved
  source access and sample issues. Measure retrieval relevance, freshness, sync
  duration, tokens, time to first draft text, and overall response latency.
- Initial design budgets: no external crawling in interactive requests, a small
  capped entry/token budget, and a short retrieval deadline with fallback. Set
  numerical latency targets only after measuring the current generation baseline.
- Roll out website/manual-note drafts, then repository drafts, then client intake.
  Disable retrieval per source/project if problems appear; tickets keep working.
- Update AGENTS.md with the final context ownership, publication, and visibility
  invariants once implemented. Report external access/setup checks not completed.

## Decisions and prerequisites

Default storage is Supabase Postgres; files and semantic search are optional.
Private workflow coverage comes from code and curated notes in the initial scope.
GitHub App setup and repo access, production deployment mapping, and supported
retry scheduling are implementation prerequisites to verify, not assumed access.
No production schemas, client data, credentials, or application runtime were
changed while preparing this plan.
