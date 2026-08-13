---
name: Obtainable Hub SaaS
status: dry-run modeling on feature/obtainable-hub-dry-run
parked: 2026-08-13
---

# Obtainable Hub SaaS — living notes

**Do not push this branch to `master` until staging is verified.** Hub 0 stays on current production (`2.95`) until then.

## Status

Dry-run **modeling** is in the repo on `feature/obtainable-hub-dry-run`:

- SKU catalog: `lib/hub/catalog.ts` (core / optional / flagship)
- Gate: `lib/hub/modules.ts` → `hubHas()` defaults **all on**
- Admin nav tagged + filtered: `lib/adminNav.ts`
- Member menu gated in `components/AppShell.tsx`
- Catalog stub: `/superadmin` (404 unless `SUPERADMIN_EMAILS` is set)
- Hide modules on **staging only**: `HUB_DRY_RUN_HIDE=tiktokInsights,ghlImport`

Not done: tenant Postgres, Vercel DNS, Railway extra tiles, provisioner.

## Outside checklist (you, not the repo)

### A. Do this now — protect Hub 0 (before we ever migrate)

Nothing in Vercel. Nothing new in Railway except **snapshots**.

**1. Railway — snapshot production Postgres**

1. Open [Railway dashboard](https://railway.com/dashboard) → project **Triforge Media** (the canvas with five boxes).
2. Click **Postgres** (the one with the line to **triforgemediacom** / `hub.triforgemedia.com`, volume `postgres-volume`).
3. Open **Backups** (or **Data** / the volume `postgres-volume` → **Snapshots**).
4. Click **Create backup** / **Snapshot**.
5. Write down the time (e.g. `2026-08-13 14:00`). This is how you restore Hub 0 members/chat/courses.

**2. Railway — snapshot staging Postgres**

1. Same project → click **Postgres-AZt4** (volume `postgres-volume-S2Zx`).
2. Same: **Backups** / volume **Snapshot**.
3. Note the time.

**3. Railway — snapshot Redis (optional but cheap)**

1. Click **Redis** (volume `redis-volume`).
2. Snapshot the volume.
3. Never run `FLUSHALL` on this Redis.

**4. Confirm you did not change production env**

On **triforgemediacom** → **Variables**: do **not** add `HUB_DRY_RUN_HIDE` or `SUPERADMIN_EMAILS`. Empty/absent = Hub 0 looks exactly as today.

---

### B. Do **not** do yet (dry run does not need these)

| Skip | Why |
| ---- | --- |
| Vercel DNS (no new CNAME) | No client subdomain until we say so |
| Railway custom domain `{slug}.hub.triforgemedia.com` | Same |
| New Postgres / Redis / app boxes on the canvas | Client hublets reuse these five services |
| `CREATE DATABASE` | Provisioner not built |
| Cloudflare for SaaS | After beta, custom client domains |
| Stripe | Later |
| Changing Resend From / DNS | Later |
| R2 CORS for `*.hub…` | Later |
| Pushing this branch to **`master`** | That deploys production |

---

### C. Later — when we put the dry run on **staging** (you will do this when we ask)

Staging service is the box named **staging** (`staging-production-91b5.up.railway.app`), wired to **Postgres-AZt4**.

1. Merge/push the feature branch to the **`staging` git branch** (not `master`). Railway will redeploy **staging** only.
2. On **staging** → **Variables**, add:
   - `HUB_DRY_RUN_HIDE` = `tiktokInsights,ghlImport`  
     (hides Live, Network dashboard, GHL import — proves modules work)
   - `SUPERADMIN_EMAILS` = your login email on the hub (the one you use at `/login`)  
     (unlocks `/superadmin` catalog stub)
3. Open the staging URL → `/admin`. Network + Live should be gone. `/superadmin` should show the checkbox catalog.
4. Production `hub.triforgemedia.com` must stay unchanged.

---

### D. Later — first real client hub (not this week unless we say)

1. **Vercel** → project that owns **triforgemedia.com** → **Settings → Domains → DNS** (or the team DNS for `triforgemedia.com`).
2. Add CNAME:  
   - Name: `{slug}.hub` (example: `acme.hub`)  
   - Value: the Railway hostname for **triforgemediacom** (same target as existing `hub.triforgemedia.com`, often `xxx.up.railway.app`)  
   - Proxy: DNS only
3. **Railway** → **triforgemediacom** → **Settings → Networking / Custom domains** → add `acme.hub.triforgemedia.com` so TLS is issued.
4. Extra **database** on existing **Postgres** (not a new purple tile) — we will script this; do not click “New Postgres” for each client.

---

### E. If you need to revert Hub 0

1. App: production is still **`master`**. Do not deploy this feature branch there.
2. Data: Railway → **Postgres** → restore the snapshot from step A.1.
3. Staging data: restore **Postgres-AZt4** snapshot from A.2.

## Revert

- App: stay off `master`; or `git revert` if it leaked
- DB: this pass has **no schema change**
- Redis: do not `FLUSHALL`

Full architecture (DNS, DB-per-hub, Cloudflare for SaaS later) lives in the Cursor plan **Obtainable Hub SaaS**.
