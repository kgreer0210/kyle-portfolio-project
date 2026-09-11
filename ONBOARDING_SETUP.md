# Client Onboarding Setup

The client onboarding flow is admin-prepared and project-specific. It runs after
scope is agreed, the agreement is signed, and the deposit is collected. Its only
job is to collect what is needed to begin the agreed work.

## Flow

1. **Create the client** (`/admin/clients/new`). New clients are created without
   a portal invitation by default. Turn on "Send the portal invitation now" to
   keep the old invite-at-creation behavior; legacy clients are always invited
   immediately.
2. **Prepare onboarding** from the client record
   (`/admin/clients/<id>/onboarding-setup`):
   - pick a project type preset (new website, existing website, new app,
     existing app);
   - confirm known information (contact, website) and write a short
     client-friendly project summary plus main deliverables — a confirmation
     aid, not a replacement for the signed SOW;
   - decide per item: Already have it / Ask client / Not needed, with an
     optional note; add custom items if needed;
   - preview the exact client flow, save the plan, and **Send**.
3. **Send** either sends the portal invitation (no member yet) or emails the
   client that onboarding is ready (already has access). It stamps
   `plan_sent_at`, which unlocks the flow in the portal.
4. **Client completes four steps**: contact and communication, project
   confirmation, materials and access, review and submit. Every save persists
   every step's answers. Submission validates required fields only.
5. **Review** at `/admin/onboarding/<id>`: Provided / Sending later / Needs
   help / To discuss groups, then decide to mark reviewed or reopen. Submission
   never marks a project ready.

## Database migration

Apply `supabase/migrations/20260908120000_onboarding_plans.sql` with
`supabase db push` or by pasting it into the Supabase SQL editor. It is additive
and idempotent:

- adds `flow_version`, `project_type`, `project_summary`, `plan`,
  `plan_updated_at`, `plan_sent_at` to `client_onboardings`;
- adds a `BEFORE UPDATE` trigger that stops non-admin (RLS) writes from
  changing admin-owned columns, since org members can update their own row.

Existing rows default to `flow_version = 'v1'` and keep rendering the original
five-step questionnaire. A `not_started` v1 row with no answers shows the client
a "being prepared" notice until a plan is sent. Rows with answers or any other
status are untouched and cannot be switched to a plan.

## Environment

No new variables. Emails use `RESEND_API_KEY`; portal links use
`NEXT_PUBLIC_SITE_URL`. The invite fallback (already-registered email) uses the
service-role key to generate a magic link and sends it through Resend.

## Tests

```bash
npm test
```

Unit tests cover preset output, admin selections, conditional fields, step
status, submission validation, answer sanitization, and follow-up summaries.
A component test verifies that edits on one step survive navigating to another
and saving, that submission sends every step, and that blank steps are not
labelled complete.
