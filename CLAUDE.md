# CLAUDE.md - Kyle Greer Portfolio Project

## Project Overview

This is a personal portfolio website showcasing Kyle Greer's work as a software developer. Built with Next.js 16, React 19, and Tailwind CSS, it features smooth animations, a responsive design, and interactive elements.

## Tech Stack

- **Next.js 16.0.7** - React framework with App Router
- **React 19.2.1** - UI library
- **TypeScript 5** - Type safety
- **Tailwind CSS 4** - Styling framework
- **Framer Motion** - Animation library (referred to as "motion" in package.json)
- **OGL 1.0.11** - WebGL library for graphics
- **Resend 6.4.1** - Email service for contact form
- **Retell SDK** - AI voice agent webhook integration
- **Supabase** - Database for storing call records
- **Twilio** - SMS notifications for incoming calls

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Home page
│   ├── layout.tsx            # Root layout
│   ├── api/
│   │   ├── contact/
│   │   │   └── route.ts      # Contact form API endpoint
│   │   └── retell/
│   │       └── webhook/
│   │           └── route.ts  # Retell AI webhook handler
│   └── projects/
│       └── [projectId]/
│           └── backend/
│               └── page.tsx  # Project detail page
├── components/
│   ├── Hero.tsx              # Hero section
│   ├── About.tsx             # About section
│   ├── Projects.tsx          # Projects showcase
│   ├── Contact.tsx           # Contact section
│   ├── Testimonials.tsx      # Testimonials section
│   ├── Header.tsx            # Navigation header
│   ├── ScrollHeader.tsx       # Sticky header on scroll
│   ├── BackToTop.tsx         # Back to top button
│   ├── ChatWidget.tsx        # Floating AI chat assistant (diagnostic conversations + lead capture)
│   ├── Footer.tsx            # Footer
│   ├── BackendShowcase.tsx   # Backend project showcase
│   └── index.ts              # Component exports
├── data/
│   └── knowledge/            # Markdown knowledge files consumed by the chat assistant
├── lib/
│   ├── chatKnowledge.ts      # Loads + assembles knowledge MD files into the chat system prompt
│   ├── chatStorage.ts        # Supabase persistence for chat_conversations + chat_messages
│   ├── chatLeadScoring.ts    # AI scoring of completed chat transcripts
│   ├── leadQualification.ts  # AI scoring of contact-form submissions
│   ├── supabase.ts           # Supabase server client
│   └── notifications.ts      # Email (Resend) + Discord webhook helpers
└── Particles/
    └── Particles.tsx         # Particle animation component
```

## Key Features

- **Responsive Design** - Works on mobile, tablet, and desktop
- **Smooth Animations** - Powered by Framer Motion and OGL
- **Contact Form** - Integrated with Resend for email functionality
- **Project Showcase** - Display of featured projects with details
- **Testimonials** - Client/colleague feedback section
- **Performance** - Built with Next.js App Router and Turbopack

## Scripts

- `npm run dev` - Start development server with Turbopack on http://localhost:3000
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Important Files

- `DESIGN_SYSTEM.md` - UI/component design guidelines
- `CONTACT_FORM_SETUP.md` - Contact form configuration and setup instructions
- `tsconfig.json` - TypeScript configuration
- `next.config.ts` - Next.js configuration

## Setup & Development

1. Install dependencies: `npm install`
2. Run development server: `npm run dev`
3. Open http://localhost:3000 in browser
4. Edit components in `src/components/` - hot reload enabled

## API Routes

- `POST /api/contact` - Contact form submission endpoint (sends email via Resend)
- `POST /api/retell/webhook` - Retell AI voice agent webhook (handles `call_started`, `call_ended`, `call_analyzed` events; stores calls in Supabase, sends SMS + Discord notifications)
- `POST /api/chat` - Streaming chat endpoint for the on-site AI diagnostic assistant. Uses Claude Haiku 4.5 via OpenRouter, persists each turn to Supabase (`chat_conversations`, `chat_messages`).
- `POST /api/chat/end` - Conversation finalizer. Scores the transcript with `src/lib/chatLeadScoring.ts`, marks the conversation completed in Supabase, and sends Kyle an email digest via Resend.

## Chat Assistant Knowledge Files

The on-site chat assistant (`src/components/ChatWidget.tsx`) reads its persona, services, process, FAQ, diagnostic playbook, and scoping guardrails from markdown files under `src/data/knowledge/`:

- `bio.md` — voice and background (visitor-facing)
- `services.md` — service buckets and what Kyle declines (visitor-facing)
- `process.md` — how a project works start to finish (visitor-facing)
- `faq.md` — common Q&A (visitor-facing)
- `diagnostic-questions.md` — questioning playbook (internal)
- `scoping-guidelines.md` — hard rules: never quote price, scope boundaries, when to defer to Kyle (internal)

Edit the markdown to change tone or facts; `src/lib/chatKnowledge.ts` reads them fresh on every chat request, so edits take effect on the next turn — no restart needed.

## Styling

The project uses Tailwind CSS 4 with PostCSS configuration. Global styles and component-specific styles are defined using Tailwind utility classes.

## Notes for Claude

- The contact form uses the Resend service for email - refer to CONTACT_FORM_SETUP.md for configuration
- Design system guidelines are documented in DESIGN_SYSTEM.md
- Project uses TypeScript with strict typing enabled
- Next.js App Router is used for routing (not Pages Router)
- The "motion" package in package.json is the Framer Motion animation library

# context-mode — MANDATORY routing rules

You have context-mode MCP tools available. These rules are NOT optional — they protect your context window from flooding. A single unrouted command can dump 56 KB into context and waste the entire session.

## BLOCKED commands — do NOT attempt these

### curl / wget — BLOCKED
Any Bash command containing `curl` or `wget` is intercepted and replaced with an error message. Do NOT retry.
Instead use:
- `ctx_fetch_and_index(url, source)` to fetch and index web pages
- `ctx_execute(language: "javascript", code: "const r = await fetch(...)")` to run HTTP calls in sandbox

### Inline HTTP — BLOCKED
Any Bash command containing `fetch('http`, `requests.get(`, `requests.post(`, `http.get(`, or `http.request(` is intercepted and replaced with an error message. Do NOT retry with Bash.
Instead use:
- `ctx_execute(language, code)` to run HTTP calls in sandbox — only stdout enters context

### WebFetch — BLOCKED
WebFetch calls are denied entirely. The URL is extracted and you are told to use `ctx_fetch_and_index` instead.
Instead use:
- `ctx_fetch_and_index(url, source)` then `ctx_search(queries)` to query the indexed content

## REDIRECTED tools — use sandbox equivalents

### Bash (>20 lines output)
Bash is ONLY for: `git`, `mkdir`, `rm`, `mv`, `cd`, `ls`, `npm install`, `pip install`, and other short-output commands.
For everything else, use:
- `ctx_batch_execute(commands, queries)` — run multiple commands + search in ONE call
- `ctx_execute(language: "shell", code: "...")` — run in sandbox, only stdout enters context

### Read (for analysis)
If you are reading a file to **Edit** it → Read is correct (Edit needs content in context).
If you are reading to **analyze, explore, or summarize** → use `ctx_execute_file(path, language, code)` instead. Only your printed summary enters context. The raw file content stays in the sandbox.

### Grep (large results)
Grep results can flood context. Use `ctx_execute(language: "shell", code: "grep ...")` to run searches in sandbox. Only your printed summary enters context.

## Tool selection hierarchy

1. **GATHER**: `ctx_batch_execute(commands, queries)` — Primary tool. Runs all commands, auto-indexes output, returns search results. ONE call replaces 30+ individual calls.
2. **FOLLOW-UP**: `ctx_search(queries: ["q1", "q2", ...])` — Query indexed content. Pass ALL questions as array in ONE call.
3. **PROCESSING**: `ctx_execute(language, code)` | `ctx_execute_file(path, language, code)` — Sandbox execution. Only stdout enters context.
4. **WEB**: `ctx_fetch_and_index(url, source)` then `ctx_search(queries)` — Fetch, chunk, index, query. Raw HTML never enters context.
5. **INDEX**: `ctx_index(content, source)` — Store content in FTS5 knowledge base for later search.

## Subagent routing

When spawning subagents (Agent/Task tool), the routing block is automatically injected into their prompt. Bash-type subagents are upgraded to general-purpose so they have access to MCP tools. You do NOT need to manually instruct subagents about context-mode.

## Output constraints

- Keep responses under 500 words.
- Write artifacts (code, configs, PRDs) to FILES — never return them as inline text. Return only: file path + 1-line description.
- When indexing content, use descriptive source labels so others can `ctx_search(source: "label")` later.

## ctx commands

| Command | Action |
|---------|--------|
| `ctx stats` | Call the `ctx_stats` MCP tool and display the full output verbatim |
| `ctx doctor` | Call the `ctx_doctor` MCP tool, run the returned shell command, display as checklist |
| `ctx upgrade` | Call the `ctx_upgrade` MCP tool, run the returned shell command, display as checklist |
