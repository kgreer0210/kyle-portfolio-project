# Admin workspace redesign

Branch: `feat/admin-workspace-redesign`
Worktree: `/home/kgreer/dev/kyle-portfolio-admin-redesign`

This branch builds on the committed project-context feature so both can be
tested together. Its own commit contains the admin and client redesign only.
The feature worktree retains its separate branch. The redesign adds no migrations
and does not modify production.

## Design references

- [Linear project workspace](https://mobbin.com/screens/75863c28-616a-49dc-88e0-b6561b37ead3): navigation, secondary properties, and project tabs.
- [Plain support workspace](https://mobbin.com/screens/03143e01-39f7-4352-a836-041ff5e3260e): conversation first, nearby composer, secondary client information.
- [HoneyBook client project](https://mobbin.com/screens/15790c8a-47c2-4600-a012-edc3b466c120): separation of project activities.
- [Twenty client directory](https://mobbin.com/screens/f0c33d02-9df1-47c6-bbaa-c0d7d0f2ba70): searchable records and restrained navigation.

## Changes

- Persistent desktop sidebar, horizontally scrollable mobile navigation, active
  route indication, skip link, and compact header.
- Quieter admin surfaces using existing brand colors, consistent form controls,
  and visible keyboard focus.
- Overview emphasizes outstanding work; detailed ticket breakdown is expandable.
- Client search and empty states; a project directory with search/status filters.
- Client tabs: Projects, People, Tickets, Notes, Activity, Contact & billing.
- Project tabs: Work, Updates, Tickets, Documents & scope, AI context (flagged).
- Milestone/request creation forms appear through explicit disclosure actions.
- Ticket conversation and composer share the main column. Status lives in the
  secondary column; metadata editing and AI instructions are expandable.
- Tabs keep unsaved form state and support Left/Right, Home, and End keys.

## Run locally

Use the existing isolated Supabase instance described in
`project-context-local-testing.md`. Do not apply migrations to production.

```bash
cd /home/kgreer/dev/kyle-portfolio-admin-redesign
CONTEXT_DEV_PORT=3101 npm run dev:context
```

Open http://localhost:3101/login. Use `admin@context.test` and
`Context-local-only-2026!`. This launcher always overrides Doppler's Supabase
credentials with the isolated local instance and disables outbound notifications.
The default port remains 3100 when `CONTEXT_DEV_PORT` is omitted.

## Verification

- 139 tests passed, including keyboard navigation and unsaved form preservation.
- ESLint: no errors; three existing navigation warnings outside the redesign.
- Production build and TypeScript passed.
- Shared browser checked desktop and mobile admin layouts, project tab navigation,
  AI context visibility, project directory search, and milestone creation.
- Temporary verification milestone removed from local data.
- Server checks cover admin routes, empty search results, and client/anonymous
  restrictions on the new project directory.
- Shared browser became intermittent during the remaining interactive checks;
  full reply sending, billing editing, and passkey operations were not repeated.
