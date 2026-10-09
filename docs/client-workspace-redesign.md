# Client workspace redesign

This change reshapes the signed-in client portal on top of current `master`. It
adds no new dependencies, database migrations, or production configuration.

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
- `/portal/tickets/new` provides the AI-assisted ticket form separately from
  history.
- Ticket replies sit below the conversation. Cost/change-request information
  and attachments remain available.
- Existing dark brand colors are preserved; portal-only styles avoid changing
  public pages or admin styling.

## Verification

- Run `npm run lint`, `npx tsc --noEmit`, `npm test`, and `npm run build`.
- Check client home, project details, ticket history, new ticket, and ticket
  detail at mobile and desktop widths against a local Supabase instance with
  client fixtures. Never point local checks at production data.
- Confirm other-organization project access returns 404 and anonymous users
  redirect to login. Confirm hidden tasks and private project content are absent
  from client pages.
