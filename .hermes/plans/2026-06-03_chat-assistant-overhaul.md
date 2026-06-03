# Chat Assistant Overhaul — From Diagnostic to Helpful

**Date:** 2026-06-03  
**Project:** kyle-portfolio-project (kygrsolutions.com)  
**Status:** Plan — no code changed yet

---

## The Problem

The current assistant is designed as a **diagnostic interview tool** — its whole job is to extract information through a series of questions before producing a "framing." This is fundamentally mismatched with how real website visitors behave:

- They have a specific question (pricing, services, availability, how to work with Kyle) and want an **answer**, not an intake form.
- Getting asked 2-4 questions before you get any value kills trust and engagement.
- The `diagnostic-questions.md` playbook — even though it says "ask 2-4, not all" — naturally produces multi-question sessions because the AI wants to gather data before committing to anything.
- The closing flow (framing → Calendly) makes sense as an **output** at the end, but isn't useful as the main feature of the chat.

**Root cause:** The system prompt and knowledge files treat the assistant as a discovery session for Kyle's benefit, not a resource for the visitor's benefit.

---

## The Goal

Rebuild the assistant as a **knowledgeable, helpful, low-friction first stop** for website visitors. It should:

1. Answer common questions directly and confidently (services, tech, past work, how to hire Kyle, rough project types).
2. Feel conversational, not like an intake process.
3. Naturally surface the Calendly booking when the visitor is ready — without forcing it.
4. Still capture leads (email + summary) as a **side effect**, not the main objective.

---

## Proposed Approach

### What changes

**1. System prompt persona: from "diagnostic interviewer" to "knowledgeable friend"**

Rewrite `buildSystemPrompt` in `chatKnowledge.ts` around a new persona:
- The assistant knows Kyle's work, services, tech stack, and past projects.
- It answers questions **first**, then follows up with one relevant question if appropriate.
- It never opens with a question unless the visitor's message gives literally nothing to work with.

**2. Eliminate the diagnostic-first interrogation structure**

- Remove or gut `diagnostic-questions.md` as the conversation driver.
- Replace with a document focused on **answering patterns** — how to handle common visitor intents: "I need a website", "how much does it cost", "what have you built", "can you build X", "how do I work with you".
- Rename it to `visitor-intents.md` to reflect the new purpose.

**3. Rewrite the system prompt instructions**

New core rules for the AI:
- **Answer first, ask second.** If you know the answer, give it. One follow-up question max per turn.
- **One question per message.** Never stack.
- **Proactively offer the Calendly link** at the right moment, not only when triggered by specific phrases.
- **FAQ-first mindset**: treat every visitor as "probably wondering about pricing, services, tech, or next steps."

**4. Update `scoping-guidelines.md`**

- The "never quote a price" and faith/values rules stay — they're the right guardrails.
- Remove the current "closing every conversation" checklist — it reads as a script. Replace with natural escalation guidance.
- Update the Calendly trigger rules to be more proactive and natural.

**5. Update `faq.md` to be more comprehensive**

Add answers to the questions visitors actually ask most:
- "How long does a project take?"
- "Do you work with solo entrepreneurs / very small businesses?"
- "What's your tech stack?"
- "What's the first step to working with you?"
- "Do you do maintenance/support after launch?"

**6. Keep what works**

- Lead capture (email prompt after 3 turns) — good, keep it.
- Conversation digest on end/close — good, keep it.
- Streaming + session persistence — good, keep it.
- No markdown rendering in the chat UI — already enforced, keep it.
- The `ChatWidget.tsx` UI itself — no changes needed.
- `/api/chat/route.ts` and `/api/chat/end/route.ts` — no changes needed.

---

## Files to Change

| File | What changes |
|------|-------------|
| `src/lib/chatKnowledge.ts` | Rewrite `buildSystemPrompt` — new persona, answer-first rules, natural name gathering |
| `src/data/knowledge/diagnostic-questions.md` | Replace contents with visitor-intent answering guide (rename to `visitor-intents.md`) |
| `src/data/knowledge/scoping-guidelines.md` | Remove scripted closing checklist, update Calendly trigger guidance |
| `src/data/knowledge/faq.md` | Expand with common visitor questions |
| `src/components/ChatWidget.tsx` | Add starter prompt quick-reply chips on the initial/empty state screen |

**No changes to:**
- `api/chat/route.ts`
- `api/chat/end/route.ts`
- `chatStorage.ts`, `chatLeadScoring.ts`, `notifications.ts`
- Any CRM or auth code

---

## Step-by-Step Plan

### Step 1 — Rewrite `faq.md`
Add direct answers to the 8-10 most common portfolio visitor questions. These become the assistant's primary knowledge source for answering without asking.

### Step 2 — Replace `diagnostic-questions.md` → `visitor-intents.md`
Reframe from "questions to ask" to "how to respond to these intents." The AI still gathers context, but by responding helpfully and asking **one** natural follow-up, not by front-loading questions.

Contents:
- `I need a website` → answer what Kyle builds, ask one clarifying thing
- `How much does it cost?` → honest no-price answer, redirect to scoping call
- `What have you built?` → point to projects, offer to dig in
- `Can you build [specific thing]?` → yes/no based on services, offer call for scope
- `How do I hire you?` → clear next-step: Calendly + what happens after

### Step 3 — Update `scoping-guidelines.md`
- Keep the hard rules (no prices, no blueprints, faith values).
- Replace the scripted "closing every conversation" section with: "When the visitor is ready, offer the Calendly link naturally. Don't make them reach a checklist — read the conversation."
- Add: "If the visitor's first message is a direct question, answer it. Don't ask for their name before answering."

### Step 4 — Rewrite the system prompt in `chatKnowledge.ts`
New persona:
```
You are Kyle Greer's assistant on kygrsolutions.com. You know Kyle's work inside and out. 
When a visitor asks a question, answer it directly. Then, if it makes sense, ask one 
follow-up question to understand their situation better.

Never open a response with a question unless the visitor gave you nothing to work with. 
Never ask more than one question at a time. Never make the visitor feel like they're 
being interviewed before they get any value.

Your goal: be genuinely helpful first. The natural outcome of being helpful is that 
serious visitors will want to book a call with Kyle.
```

### Step 5 — Test the new flow
Manual test the common scenarios:
- "What do you build?" → should answer directly
- "How much does a website cost?" → should give honest no-price answer + Calendly offer
- "I need an app for my business" → should respond helpfully, ask ONE clarifying question
- "What's the next step to work with you?" → should give direct path: Calendly link
- Open-ended "hi" → should ask how to help (graceful fallback)

---

## Risks & Tradeoffs

| Risk | Mitigation |
|------|-----------|
| AI becomes too "salesy" or pushy about Calendly | Keep the Calendly guidance as "offer when ready, read the room" |
| Without diagnostic questions, Kyle gets less context before calls | The call is for scoping — that's fine. This is a better UX tradeoff. |
| FAQ answers might be wrong/stale | Review `faq.md` carefully; add "Kyle can clarify" as a fallback tone |
| Personality drift — sounds generic | Keep the "sound like Kyle" voice rules intact in the system prompt |

---

## Decisions (resolved 2026-06-03)

1. **Name gathering** — Keep it, but make it optional/natural. The assistant should answer the visitor's question first and weave in asking for their name conversationally rather than blocking the conversation on it. If they give their name in context, great; if not, don't gate anything on it.
2. **Proactive callouts** — Nothing needed at this time.
3. **Starter prompt buttons** — ✅ Add them. Quick-reply chips in the widget UI (e.g., "What do you build?", "How do I work with you?", "What's the first step?"). This is a `ChatWidget.tsx` change — the only UI file that changes.
