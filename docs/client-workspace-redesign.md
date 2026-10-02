# Client workspace redesign

Implemented in `/home/kgreer/dev/kyle-portfolio-admin-redesign` on
`feat/admin-workspace-redesign`, alongside the admin redesign. The branch inherits the committed project-context feature; its redesign changes
are a separate commit. The original master worktree is untouched. No new dependencies, database
migrations, or production changes were needed.

## Mobbin references

These are workflow references adapted for a restricted client experience, rather
than reproductions of the products' administrative capabilities:

- [Bonsai project workspace](https://mobbin.com/screens/01a8e962-8d5e-49ce-beeb-e8b08bf0b1e7): compact navigation and project tabs.
- [Squarespace project overview](https://mobbin.com/screens/c0bfcd2d-a52e-459b-9670-1398586e38c1): roadmap and secondary information hierarchy.
- [HoneyBook project files](https://mobbin.com/screens/4b0ac13d-c100-4b86-8389-13da8755c87b): separating different project activities.
- [Gorgias customer history](https://mobbin.com/screens/ab8e44d8-8701-4d0b-b88d-39ef5957264b): readable request history and a distinct creation action.

## Client experience

- Compact responsive navigation: Home, Projects, Support, Settings.
- Home puts client requests first, with progress summaries, recent project
  updates, and open support threads below. Open ticket count uses an exact count
  rather than the limited recent-ticket list.
- `/portal/projects` includes active, paused, and completed projects.
- `/portal/projects/[projectId]` has Overview, Needs from you, Updates, and
  Support tabs. Existing request actions and tab draft preservation are reused.
- `/portal/tickets` is support history with open/all views and title search.
- `/portal/tickets/new` provides the existing project selector and AI-assisted
  form separately from history.
- Ticket replies sit below the conversation. Cost/change-request information
  and attachments remain available.
- Existing dark brand colors are preserved; portal-only styles avoid changing
  public pages or admin styling.

## Local testing

```bash
cd /home/kgreer/dev/kyle-portfolio-admin-redesign
CONTEXT_DEV_PORT=3101 npm run dev:context
```

Open http://localhost:3101/portal and sign in with `client@context.test` /
`Context-local-only-2026!`. The launcher overrides Doppler's Supabase variables
with the isolated local instance and disables outbound notifications.

`node scripts/client-portal-demo.mjs` adds sample milestone/tasks, an outstanding
request, and an update to Booking Application. It is local-only and does not
replace existing demo rows. One private task canary verifies that internal work
is excluded from client pages and progress; visible task progress is 50%.

## Verification

- 139 tests passed; production build and TypeScript passed.
- ESLint has no errors and only three pre-existing navigation warnings.
- Client home, project details, ticket history, new ticket, and ticket detail
  inspected in the shared browser. Desktop/mobile layouts checked; page widths
  remain within the viewport. The assistant drawer opens at mobile width.
- Server checks cover all new routes, empty searches, and existing security page.
- Other-organization project access returns 404. Anonymous users redirect to login.
- HTML checks confirm the hidden-task canary and private project content are absent.
- Client request completion/reopening persisted, and another organization could
  not act on the same request. The demo request was restored to open.
- File uploads, live passkeys, and the entire AI conversation were not repeated
  during this visual redesign; those handlers were preserved.
