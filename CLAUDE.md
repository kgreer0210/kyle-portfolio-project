# CLAUDE.md

Read `AGENTS.md` before changing this repository. It is the canonical project
guide and contains the current architecture, setup, security boundaries, and
verification expectations.

## Claude-specific reminders

- Keep this file short; put shared project guidance in `AGENTS.md`.
- Preserve the visitor assistant's answer-first voice and hard scoping rules in
  `src/data/knowledge/` and `src/lib/chatKnowledge.ts`.
- The current production onboarding flow uses the fixed definitions in
  `src/lib/crm.ts`; do not assume the unreleased project-specific flow exists.
- Never expose Supabase service credentials or internal ticket-triage notes to
  browser code or client-visible responses.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
