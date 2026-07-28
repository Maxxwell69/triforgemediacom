import "dotenv/config";

/**
 * Tripwire against accidentally running local-only commands (db push, dev
 * migrations, seeding) against the production database — the exact mistake
 * that's easy to make when a laptop's .env still has the production
 * DATABASE_URL in it from earlier testing.
 *
 * Set PROD_DB_HOST in .env to your production Postgres host — include the
 * port too if your provider shares one proxy hostname across multiple
 * databases (Railway does: e.g. "sakura.proxy.rlwy.net:28726" — the port is
 * what actually distinguishes prod from staging/dev in that case). Not a
 * secret on its own, it's only used here as a comparison string. Once set,
 * any command wired to this guard refuses to run if DATABASE_URL's host
 * matches, unless you explicitly opt in with ALLOW_PROD_DB_OPS=yes for that
 * one run.
 *
 * No-ops if PROD_DB_HOST isn't set, so this only activates once you've
 * configured it.
 */
function extractHost(url: string): string | null {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

const databaseUrl = process.env.DATABASE_URL;
const prodHost = process.env.PROD_DB_HOST?.trim();
const allowOverride = process.env.ALLOW_PROD_DB_OPS === "yes";

if (databaseUrl && prodHost) {
  const currentHost = extractHost(databaseUrl);
  if (currentHost && currentHost.includes(prodHost) && !allowOverride) {
    console.error(
      `\n🛑 Refusing to run: DATABASE_URL host ("${currentHost}") matches PROD_DB_HOST ("${prodHost}").\n` +
        `This command is meant for local/staging databases only — it looks like it would hit production.\n\n` +
        `If this really is intentional (e.g. a one-off manual production fix), re-run with:\n` +
        `  ALLOW_PROD_DB_OPS=yes npm run <script>\n`
    );
    process.exit(1);
  }
}
