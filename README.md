# Event Console

A multi-event ops tool for community managers running founder dinners and receptions. Built as a take-home project demonstrating AI-assisted event ops.

**Live:** [https://your-vercel-url.vercel.app](https://event-console.vercel.app/)

## What it does

- **Parse freeform RSVP text** into a clean guest list, with merge/dedupe against existing guests
- **Generate host briefing cards** with a one-line bio, "what they're working on," and a specific conversation prompt for each guest
- **Design seating charts** with three layout options, drag-and-drop overrides, and per-seat pinning
- **Draft personalized RSVP nudges** in three tones (warm, neutral, urgent) for unconfirmed guests
- **Build run-of-show timelines** with templates for dinners, lunches, receptions, and breakfasts
- **Triage across events** from a dashboard that surfaces what's "on fire today"

## Stack

Next.js 15, TypeScript, Tailwind v4, shadcn/ui (Nova style), @dnd-kit, Anthropic Claude API. State persists in localStorage. Deployed on Vercel.

## Why it exists

Event ops is fragmented across a spreadsheet, an inbox, a notes app, and the host's head. This is one tool that handles the full loop end-to-end, with AI handling the parts that are tedious (parsing emails, drafting nudges, generating briefing prep) and humans handling the parts that matter (relationship calls, judgment, taste).

## Architecture notes

- All Claude API calls run server-side via Next.js API routes. The API key never touches the browser.
- Storage is abstracted behind an interface that mimics a Supabase client. Swapping localStorage for a real database in v2 is one file change.
- Single-user, no auth — by design for v1.5. v2 adds auth, Postgres, Google Sheets sync, and a post-event recap module.

Built in [N hours / one weekend / two evenings].
