# TriForge Community

Invite-only community platform for TriForge Media creators. See `CLAUDE.md` for the full
project brief and architecture notes.

**Status:** MVP1 feature-complete — application flow, invite-based auth, profile
onboarding, chat (polling-based), TikTask, and admin tooling are all wired up. See
"Not fully built yet" below for what's intentionally deferred.

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- PostgreSQL + Prisma ORM (v6)
- Auth.js (NextAuth v5) — email/password via Credentials provider
- Resend for transactional email (invite + rejection notices)
- `server/` — standalone Fastify + Socket.io scaffold for real-time chat delivery
  (not wired up yet; see `server/README.md`)

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the env template and fill in real values:

   ```bash
   cp .env.example .env
   ```

   - `DATABASE_URL` — a Postgres connection string (Railway in production; any local
     Postgres or `docker run postgres` works for dev)
   - `AUTH_SECRET` — random string (`node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`)
   - `RESEND_API_KEY` — optional for local dev; if unset, invite/rejection emails are
     logged to the console instead of sent

3. Push the schema to your database and seed an admin account, default channels, and
   starter task templates:

   ```bash
   npm run db:push
   npm run db:seed
   ```

   The seed script creates `admin@triforgemedia.com` / `changeme123!` (override via
   `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` env vars). This is the only way to get an
   `ADMIN` user, since signup is invite-only.

4. Run the dev server:

   ```bash
   npm run dev
   ```

## Flow implemented so far

1. `/apply` — public application form → creates a `User` (status `PENDING_APPLICATION`)
   + `Application` (status `PENDING`)
2. `/admin/applications` (ADMIN/MOD only) — review pending applications, approve
   (generates an invite token + emails a signup link) or reject (emails a decision note)
3. `/signup?token=...` — invitee sets a password; `User.status` flips to `ACTIVE`
4. `/login` — Auth.js Credentials sign-in
5. `/onboarding` — first-login profile setup (platform, goals, bio, social links);
   required before accessing chat or TikTask — `lib/session.ts`'s `requireProfile()`
   redirects here if a `Profile` doesn't exist yet
6. `/channels`, `/channels/[channelId]` — chat, backed by Postgres, gated by
   `Channel.minRole` (`lib/rbac.ts`). Message history + posting via
   `app/api/channels/**` routes; the client polls for new messages every few
   seconds (see "Real-time chat" below for the upgrade path)
7. `/apps/tiktask` — today's task list, generated on-demand from active
   `TaskTemplate`s matching the user's platform/goals (`lib/tiktask.ts`). Completing a
   task logs an append-only `XPEvent` and bumps `Profile.streakCount` once per day
8. `/admin` — dashboard; `/admin/users` (role changes, ban/unban); `/admin/tasks`
   (`TaskTemplate` CRUD — this is what lets TriForge tune TikTask without a code
   deploy, per `CLAUDE.md`)

## Real-time chat

Chat works today via polling (functionally correct, not live-updating). `server/`
contains a scaffold for a proper Socket.io + Fastify relay service (deployed
separately on Railway, since Vercel serverless can't hold WebSocket connections) —
see `server/README.md` for the design and the TODOs required before it's
production-ready (real auth on the socket handshake, Redis adapter for
multi-instance scaling).

## Useful scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | `prisma generate` + production build |
| `npm run db:push` | Push `prisma/schema.prisma` to the database (no migration history) |
| `npm run db:migrate` | Create/apply a dev migration |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:seed` | Seed the first admin account, default channels, and starter task templates |

## Not fully built yet (see `CLAUDE.md` for full MVP1/MVP2/MVP3 scope)

- Real-time message delivery (see `server/` scaffold above)
- DMs, reactions, threads, file uploads, presence — explicitly MVP2+
- Learning Center, leaderboards, events/calendar, public Creator Network — MVP3
