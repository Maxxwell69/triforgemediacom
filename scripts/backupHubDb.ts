import "dotenv/config";
import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Logical dump of DATABASE_URL into ./backups (gitignored).
 *
 * Production dumps require an explicit opt-in so a laptop .env cannot
 * silently dump (or later restore) Hub 0:
 *   ALLOW_PROD_DB_OPS=yes npm run db:backup
 *
 * Railway volume snapshots in the dashboard are still the first revert
 * step — this file is the off-platform copy.
 */

function extractHost(url: string): string | null {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const prodHost = process.env.PROD_DB_HOST?.trim();
const allowOverride = process.env.ALLOW_PROD_DB_OPS === "yes";
const currentHost = extractHost(databaseUrl);

if (databaseUrl && prodHost && currentHost?.includes(prodHost) && !allowOverride) {
  console.error(
    `\n🛑 Refusing to dump: DATABASE_URL host ("${currentHost}") matches PROD_DB_HOST ("${prodHost}").\n` +
      `Take a Railway snapshot of Postgres first, then if you also want a file:\n` +
      `  ALLOW_PROD_DB_OPS=yes npm run db:backup\n`
  );
  process.exit(1);
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const dir = join(process.cwd(), "backups");
mkdirSync(dir, { recursive: true });
const outFile = join(dir, `hub-${stamp}.sql`);

const result = spawnSync("pg_dump", [databaseUrl, "-f", outFile, "--no-owner", "--no-acl"], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

if (result.error || result.status !== 0) {
  console.error(
    "\npg_dump failed. Install PostgreSQL client tools, or skip this and use a Railway volume snapshot.\n" +
      (result.error ? String(result.error) : "")
  );
  process.exit(result.status || 1);
}

console.log(`Wrote ${outFile}`);
