# Admin workspace redesign

This change reshapes the authenticated admin CRM on top of current `master`.
It adds no migrations and changes no database schema.

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
- Client search and empty states; a project directory at `/admin/projects` with
  search and status filters.
- Client tabs: Projects, People, Tickets, Notes, Activity, Contact & billing.
- Project tabs: Work, Updates, Tickets, Documents & scope.
- Milestone/request creation forms appear through explicit disclosure actions.
- Ticket conversation and composer share the main column. Status lives in the
  secondary column; metadata editing and AI instructions are expandable.
- Tabs keep unsaved form state and support Left/Right, Home, and End keys.

## Verification

- Unit tests cover the tab keyboard navigation and unsaved form preservation.
- Run `npm run lint`, `npx tsc --noEmit`, `npm test`, and `npm run build`.
- Check the admin layouts at mobile and desktop widths, project tab navigation,
  project directory search, and milestone creation against a local Supabase
  instance with admin and client fixtures. Never point local checks at
  production data.
