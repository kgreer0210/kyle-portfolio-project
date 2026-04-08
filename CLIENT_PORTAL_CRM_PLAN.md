# Client Portal CRM Plan

## Product Summary

Build a Supabase-backed CRM portal inside the existing Next.js site so Kyle can invite clients, onboard new accounts, add legacy clients, and manage support tickets in one place.

## Current Status Snapshot

- [x] Product direction decided: company-based clients, manual invites, guided onboarding, ticket portal, and legacy client support.
- [x] Execution order defined for foundation, database, admin workflows, client portal, and notifications.
- [x] Root tracking document created for cross-machine handoff.
- [x] Supabase auth clients split into browser, SSR, and admin variants.
- [x] Protected route strategy added for `/login`, `/portal/*`, and `/admin/*`.
- [x] CRM schema and RLS migrations created in `supabase/migrations`.
- [x] Admin client management and invite flow implemented.
- [x] Client onboarding flow implemented end-to-end.
- [x] Client ticket workflow implemented end-to-end.
- [x] CRM notifications fully wired to live CRM actions.
- [ ] Verification pass completed with real Supabase-backed manual smoke testing.

## Architecture Decisions

- Same Next.js app and same domain; no separate portal application.
- Supabase is the system of record for auth, relational data, RLS, and Storage.
- Resend is used for CRM emails.
- `admin` and `client` are the only user roles in v1.
- Clients belong to organizations through an `organization_members` join table.
- New clients complete the standard onboarding checklist.
- Existing clients are created from the admin area, invited into the portal, and can skip onboarding with immediate ticket access.
- Ticket attachments are supported in v1; onboarding remains form-based.
- Legacy client migration in v1 preserves basic company and contact records only.

## Route Map

### Public / auth

- `/login`
- `/auth/callback`

### Client portal

- `/portal`
- `/portal/onboarding`
- `/portal/tickets`
- `/portal/tickets/[ticketId]`

### Admin

- `/admin`
- `/admin/clients`
- `/admin/clients/new`
- `/admin/clients/[organizationId]`
- `/admin/tickets/[ticketId]`

## Supabase Schema Plan

- `profiles`
  - `id`, `email`, `full_name`, `role`, `status`, timestamps
- `organizations`
  - company profile, slug, notes, lifecycle state, timestamps
- `organization_members`
  - organization-to-user membership with `owner | member`
- `client_onboardings`
  - one onboarding record per organization with workflow status and mode
- `onboarding_step_responses`
  - step-specific `jsonb` payloads and save timestamps
- `tickets`
  - ticket type, status, title, description, last activity, resolution timestamps
- `ticket_messages`
  - threaded messages with `public | internal` visibility
- `ticket_attachments`
  - metadata for uploaded files stored in Supabase Storage

## Auth and RLS Plan

- Use SSR auth for route protection and server components.
- Use a browser client for login and client-side mutations.
- Use a server-only admin client for invite flows, storage writes, and elevated admin actions.
- RLS should allow:
  - admins to manage all CRM data
  - clients to access only records tied to their organization memberships
  - clients to see only public ticket messages and their own attachments
- Storage policies should scope ticket uploads by organization path.

## Notification Plan

- Invite sent
- Invite accepted
- Onboarding submitted
- New ticket created
- New public reply added
- Ticket status changed

## Required Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `RESEND_API_KEY`
- `CONTACT_EMAIL`
- `CRM_ADMIN_EMAILS`

## Implementation Checklist

### Phase 1: Foundation

- [x] Create shared tracking document in repo root.
- [x] Capture architecture decisions, routes, schema plan, and assumptions.
- [x] Refactor Supabase setup into browser, SSR, and admin clients.
- [x] Add middleware-based protection for portal and admin routes.
- [x] Add shared auth and role helpers.
- [x] Add profile bootstrap logic for authenticated users.

### Phase 2: Database and security

- [x] Create migration for CRM enums and tables.
- [x] Add helper SQL functions for admin and organization membership checks.
- [x] Add RLS policies for CRM tables.
- [x] Add Storage bucket and storage policies for ticket attachments.
- [x] Document required environment variables for CRM auth and invites.

### Phase 3: Admin workflows

- [x] Build admin dashboard shell.
- [x] Build client list and client detail views.
- [x] Build create-client form for new vs legacy clients.
- [x] Implement Supabase invite flow with organization membership creation.
- [x] Add working admin ticket detail workflow and status updates.

### Phase 4: Client portal

- [x] Build login page.
- [x] Build client dashboard.
- [x] Build onboarding checklist UI with draft-save client wiring.
- [x] Build onboarding submission flow.
- [x] Build ticket list and ticket creation UI shell.
- [x] Build ticket detail thread with public replies and attachments.
- [x] Allow legacy clients to skip onboarding in the portal UI.

### Phase 5: Notifications and hardening

- [x] Implement CRM email helpers with Resend.
- [x] Trigger emails for invite, onboarding, tickets, replies, and status changes from live API handlers.
- [x] Add server-side validation and authorization checks to CRM routes.
- [x] Run lint and fix implementation regressions.
- [ ] Smoke test existing public-site flows after CRM changes.

## Completed

### 2026-04-07

- [x] Confirmed existing app shape: marketing site with API routes and a Supabase folder ready for migrations.
- [x] Defined v1 product scope: manual invites, company/member model, onboarding checklist, ticketing, admin dashboard, and legacy client creation path.
- [x] Added the living CRM tracking document to support handoff across machines.
- [x] Added Supabase SSR/browser/admin clients, profile sync helpers, login page, and protected route middleware.
- [x] Added the first CRM migration with tables, enums, helper functions, RLS policies, and ticket attachment bucket setup.
- [x] Built the initial admin and client portal page shells: dashboard, client list/detail, create-client screen, onboarding screen, ticket list, and ticket detail pages.
- [x] Implemented CRM API routes for admin client creation, onboarding save/submit, ticket creation, ticket replies, and admin ticket status updates.
- [x] Wired CRM notification helpers into live API handlers and added environment variable documentation.
- [x] Passed `npm run lint` and `npm run build`.

## Next Up

1. Run the Supabase migration against the target project and verify the `ticket-attachments` bucket plus RLS policies were created successfully.
2. With real Supabase and Resend env vars configured, manually test:
   - admin client creation and invite email delivery
   - new-client onboarding save/submit flow
   - legacy-client ticket access
   - ticket replies, status changes, and notification emails
3. Decide whether to add a dedicated admin action to reopen onboarding or mark it completed after review.

## Open Questions / Deferred Items

- CSV or bulk import for legacy clients is deferred beyond v1.
- Historical project notes and prior ticket history migration are deferred beyond v1.
- Billing, invoices, contracts, and document vault features are out of scope for v1.
- Rich SLA automation and ticket assignment rules are out of scope for v1.
