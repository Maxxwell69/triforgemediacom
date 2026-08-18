# Deployment & environments

This project is deployed on Railway with git-based continuous deployment. Once real
members are on the platform, changes should flow through a **staging environment**
before ever touching production — this doc covers how that's wired up and the habits
that keep production data safe.

## Branch strategy

- `master` → deploys to the **production** Railway environment (`hub.triforgemedia.com`).
- `staging` → deploys to a separate **staging** Railway environment (its own app instance
  + its own Postgres database).
- Feature work happens on short-lived branches off `staging`, merged back into `staging`
  first. Once verified there, merge `staging` → `master` to release.

```
feature/xyz --> staging --> (verify on staging URL) --> master --> production
```

Never push straight to `master` for anything beyond a trivial, already-verified fix.

## Migrations — how production stays safe

- Railway runs migrations via `preDeployCommand` (`npx prisma migrate deploy`) from
  `railway.toml`, then starts the app with `npx next start`. That way the healthcheck
  isn't waiting on migrations before the HTTP port is open (which was causing failed
  deploys / yellow alert badges while the old release stayed live).
- Every deploy — staging or production — automatically applies whatever migrations are
  committed and pending, in order, non-interactively. It never resets or drops data, and
  it's a no-op if there's nothing new to apply.
- `npm run db:migrate` (`prisma migrate dev`) is for **local development only** — it's
  how you generate a new migration file while iterating on `prisma/schema.prisma`. It can
  reset data if it detects drift, which is fine locally and never okay in a shared
  environment.
- `npm run db:push` is for quick local prototyping without migration history. Same rule:
  local only.
- Both of the above (plus `db:seed`) are wrapped with `npm run guard:db`
  (`scripts/guardDb.ts`), which refuses to run if `DATABASE_URL` resolves to the host you
  put in `PROD_DB_HOST` in your `.env`. Set that once and you can't accidentally run a dev
  migration or reseed against production, even if your local `.env` still has the prod
  connection string in it from earlier testing.

### Safe migration workflow for a schema change

1. Update `prisma/schema.prisma` locally (pointed at your own local/dev database).
2. `npm run db:migrate` — names and generates the migration file, applies it locally.
3. Commit the migration folder along with your code changes.
4. Push to a feature branch → merge into `staging`. Railway redeploys staging, which runs
   `prisma migrate deploy` against the **staging** database automatically.
5. Verify the app + the specific feature on the staging URL.
6. Merge `staging` → `master`. Railway redeploys production, which runs
   `prisma migrate deploy` against the **production** database automatically.

### Risky changes (renaming/dropping columns, changing types on populated tables)

Prefer an expand/contract approach instead of a single destructive migration:

1. **Expand**: add the new column/table alongside the old one; deploy; backfill/dual-write.
2. Verify everything reads/writes correctly with both old and new in place.
3. **Contract**: a later migration removes the old column/table once nothing depends on it.

Take a manual Postgres backup (or confirm Railway's automatic backups are enabled for
your plan) before any migration in this category.

## Setting up the staging Railway environment (one-time, manual)

Do this in the Railway dashboard (not something I can do from here without CLI/API access):

1. Open the project → **New Environment** → name it `staging`. Railway will offer to
   clone the production environment's services as a starting point — use that.
2. In the `staging` environment, add a **new Postgres** database (New → Database →
   PostgreSQL) — do not reuse the production Postgres. This becomes your non-production
   database; it's fine to also point your local `.env` at this same database for day-to-day
   development, so there's exactly one "real" (production) database and one "everything
   else" database.
3. On the staging environment's app service → **Settings → Source**, set the deploy
   branch to `staging` (production's app service stays on `master`).
4. Copy environment variables from production into staging (Railway supports bulk
   variable copy), then edit on staging:
   - `DATABASE_URL` → the new staging Postgres connection string
   - `NEXTAUTH_URL` / `NEXT_PUBLIC_APP_URL` → the staging domain (Railway gives you a free
     `*.up.railway.app` domain, or attach a subdomain like `staging.hub.triforgemedia.com`)
   - Consider test/sandbox keys where available (e.g. Resend test mode) so staging traffic
     doesn't email real people or burn production rate limits.
5. Push the `staging` branch (`git push -u origin staging`) and confirm it deploys
   cleanly, migrations apply, and the site loads on the staging domain.
6. In your **local** `.env`, point `DATABASE_URL` at the new staging Postgres (get the
   public connection string from the Postgres service's **Connect** button — Public
   Network tab) instead of production, and set `PROD_DB_HOST` to production's Postgres
   host so the guard rail is active. Note: Railway shares one proxy hostname per region
   across databases, so if production and staging show the same host, include the port
   too (e.g. `sakura.proxy.rlwy.net:28726`) — the port is what actually tells them apart.

## Scheduled jobs

Both cron endpoints are plain HTTP routes guarded by `CRON_SECRET`
(`?secret=` or `Authorization: Bearer`). Nothing in-app calls them.

1. Set `CRON_SECRET` on **production** (Vercel/Railway) and as a GitHub Actions
   repo secret with the same value.
2. Workflows under `.github/workflows/` curl the production hub URL.

| Job | Workflow | Schedule | Endpoint |
|---|---|---|---|
| TikTask streak reminders | `streak-reminders.yml` | Daily 01:00 UTC | `/api/cron/streak-reminders` |
| TikTok live sync | `tiktok-live.yml` | ~every 15 min (4×/hour) | `/api/cron/tiktok-live` |

**TikTok live sync** backfills missing TikTok social links from apply handles,
polls tik.tools for who’s live, updates `TikTokStatsSnapshot`, and assigns/clears
the admin-only **LIVE** tag (powers `/live` and member filters). Requires
`TIKTOOLS_API_KEY` on production. Trigger on-demand from the Actions tab
(`workflow_dispatch`) after deploy to populate handles immediately.

GitHub Actions schedules are best-effort and often drift past 5 minutes, so the
hub also re-polls when someone opens `/live` if the roster is older than a few
minutes, and keeps confirmed LIVE rows visible for up to 90 minutes.

Staging doesn’t need these crons unless you’re testing them there.

## Email deliverability (Resend + DNS)

Sending domain in Resend: `triforgemedia.com` (DKIM + `send` subdomain SPF are
configured there). For inbox placement — especially Gmail/Outlook spam folders —
also add a **DMARC** record at the DNS host for `triforgemedia.com` (currently
Vercel DNS):

| Type | Name | Value |
|------|------|--------|
| `TXT` | `_dmarc` | `v=DMARC1; p=none; rua=mailto:admin@triforgemedia.com; fo=1` |

`p=none` monitors only (does not quarantine/reject). After a few weeks of clean
reports, you can tighten to `p=quarantine`. Hub broadcasts use Resend's batch API
plus `List-Unsubscribe` headers so bulk sends stay under rate limits and look less
like unsolicited mail.

## Versioning

`lib/version.ts` exports `APP_VERSION`, shown as a small `v3.111`-style badge in
the bottom-right corner on every page (`components/VersionBadge.tsx`) — a
quick way to confirm what's actually live versus what's expected.

**Bump it as part of every release merged into `master`** (not on every
commit to a feature branch or `staging` — just when something ships to
production). From 3.11 onward, bump the third digit for a normal batch
(`3.111` → `3.112`). Use a major bump (`3.x` → `4.0`) only for a big
milestone.

Also add a matching entry at the top of `lib/changelog.ts` (and update
`PLATFORM_PROGRAMS` if you shipped a new program). That powers the public
`/updates` page linked from the admin nav and the corner version badge.

## Rollback

- **App code**: revert the bad commit on `master` (or `git revert` + push) — Railway
  redeploys automatically.
- **Schema**: Prisma doesn't auto-generate down-migrations. For a bad migration, write a
  new forward migration that undoes the change rather than trying to rewrite history that
  may already be applied in production.

## Backups (Obtainable Hub dry-run)

Before any Prisma migrate that could touch Railway Postgres:

1. **Dashboard snapshots** (fastest revert of a volume):
   - Production **Postgres** (`postgres-volume`)
   - Staging **Postgres-AZt4** (`postgres-volume-S2Zx`)
   - **Redis** (`redis-volume`) optional
2. **File dump** (off-platform copy): `npm run db:backup` writes `backups/hub-*.sql` (gitignored).
   Dumping production requires `ALLOW_PROD_DB_OPS=yes` plus `PROD_DB_HOST` set (same tripwire as `guard:db`).
   Needs `pg_dump` on your PATH. If it is missing, the Railway snapshot is enough.

Do **not** run `FLUSHALL` on the shared Redis. The dry-run branch does not migrate schema and does not `CREATE DATABASE`.
