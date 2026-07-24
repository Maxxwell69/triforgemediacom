# TriForge Community — Project Brief

## What this is
An invite-only, Discord-style community platform for TriForge Media (creator agency for
streamers, TikTok creators, live hosts, gaming personalities). Members apply, get approved,
and get access to real-time chat plus internal creator tools — starting with **TikTask**, a
personalized daily task engine that tells each creator what to do today (go live, post
content, engage, etc.) based on their platform and goals.

This is a **separate repo and separate deployment** from the existing TriForge marketing
site (`triforge-web`, deployed on Vercel at triforgemedia.com). This repo deploys to
`hub.triforgemedia.com`.

## Architecture decision (important — do not split into microservices)
Build this as a **modular monolith**: one Next.js app, one Postgres database, one auth
session. Internally organized into clean module boundaries, but everything shares the same
`User` / `Profile` tables so features like TikTask can read streaks/XP and chat can display
them instantly — no cross-service API calls needed.

Module boundaries (folders, not separate apps):
- `/app/(community)` — chat: servers/channels/messages
- `/app/apps/tiktask` — TikTask module
- `/app/admin` — admin dashboard
- `/app/apply` — public application form (unauthenticated)

If a module later needs independent scaling, split it out then — don't architect for that
speculatively now.

## Stack
- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS — deploy on **Vercel**
- **Backend/API:** Next.js API routes for most things; a small standalone Node/Fastify +
  Socket.io service for real-time chat, deployed on **Railway** (Vercel serverless can't hold
  long-lived WebSocket connections)
- **Database:** PostgreSQL on Railway, accessed via **Prisma ORM**
- **Realtime scaling:** Redis (Railway addon) as the Socket.io adapter
- **Auth:** Auth.js (NextAuth) with Prisma adapter, **email/password only for MVP1** (no
  OAuth yet — can add Discord/Google in MVP2 without schema changes)
- **Email:** Resend — invite emails, application status notifications
- **File storage:** Cloudflare R2 (S3-compatible) — not needed until MVP2 (attachments)

## Brand system (locked — use exactly)
- Colors: Charcoal `#0A0A0A`, Electric Orange `#FD4802`, Deep Blue `#0E1A3D`,
  Neon Cyan `#00D4FF`, Off-White `#F5F5F5`
- Typography: Bebas Neue (display), Outfit (body) — Google Fonts
- Aesthetic: dark charcoal base, glassmorphism/glow cards, gradient text, scroll-reveal
  animations (match the existing marketing site's visual language, but chat/app UI should be
  functional-first — glow accents on key actions, not on every element)

## Core data model
See `prisma/schema.prisma` in this repo for the full schema. Key entities:
- `User` — auth identity + role (admin/mod/creator/member) + status
- `Application` — the `/apply` form submission, reviewed by admins, approve → triggers
  invite email via Resend
- `Profile` — platform (TikTok/Twitch/YouTube/etc), goals, streak count — drives TikTask
  personalization
- `Channel` / `Message` — chat core
- `TaskTemplate` — admin-managed; defines what tasks get assigned per platform/goal
  combination (NOT hardcoded in application logic — admins must be able to edit these
  without a code deploy)
- `DailyTask` — a generated instance of a template for a specific user on a specific date
- `XPEvent` — logged whenever XP is awarded (task completion, etc.) — keep this as an
  append-only log, don't just increment a counter, so we have history for future
  leaderboards/analytics

## MVP1 scope (build this first, in this order)
1. **Application flow**: public `/apply` form → stores `Application` in Postgres
2. **Admin approval queue**: list pending applications, approve/reject with notes.
   Approve → generates invite token → Resend sends signup email
3. **Auth**: Auth.js email/password, signup only via valid invite token, login/session
4. **Profile setup**: on first login, capture platform + goals (required for TikTask)
5. **Chat core**: one community, multiple text channels, roles (Admin/Mod/Creator/Member)
   gate channel visibility, real-time messaging via Socket.io, messages persisted to Postgres
6. **TikTask**: daily task list generated from `TaskTemplate` matched to the user's
   platform/goal, checkbox completion, streak counter, XP awarded on completion
7. **Admin extras**: user management (view/role change/ban), task template manager (CRUD
   on `TaskTemplate` — this is what lets TriForge tune TikTask without code changes)

## Explicitly out of scope for MVP1 (later stages)
- DMs, reactions, threads, file uploads, presence, moderation tooling beyond basic ban →
  **MVP2**
- Learning Center (courses/XP/badges), leaderboards, events/calendar, public Creator
  Network directory, OAuth logins → **MVP3**

## Known constraints / things to watch
- Invite-only means **no public signup route** — signup must validate an invite token tied
  to an approved `Application`
- `TaskTemplate` must be admin-editable data, not hardcoded logic — this is the whole point
  of the module being useful long-term
- Keep the brand tokens (colors/fonts) in a single config file so they're easy to sync with
  the marketing site repo by hand for now
- This repo does not touch GoHighLevel — GHL work is being phased out for community/
  membership functionality by this rebuild
