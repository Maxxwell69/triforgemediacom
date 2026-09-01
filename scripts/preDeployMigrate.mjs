/**
 * Railway pre-deploy: apply pending Prisma migrations.
 *
 * Keeps a small recovery path for the renamed webinar-recordings migration
 * leftover (P3009 / "already exists"), then exits non-zero only if migrate
 * deploy still cannot succeed.
 */
import { spawnSync } from "node:child_process";

const LEGACY_RECORDINGS = "20260729214500_add_webinar_recordings";
const RECORDINGS = "20260729221000_add_webinar_recordings";
const MODERATION = "20260730021500_add_webinar_moderation";

function run(args) {
  return spawnSync("npx", args, {
    encoding: "utf8",
    shell: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function combined(result) {
  return `${result.stdout || ""}\n${result.stderr || ""}`;
}

function migrateDeploy() {
  return run(["prisma", "migrate", "deploy"]);
}

function migrateResolve(flag, name) {
  console.log(`prisma migrate resolve ${flag} ${name}`);
  const resolve = run(["prisma", "migrate", "resolve", flag, name]);
  process.stdout.write(combined(resolve));
  return resolve.status === 0;
}

function extractMigrationName(out) {
  const patterns = [
    /Migration name:\s*`?(\d{14}_[A-Za-z0-9_]+)`?/i,
    /The `(\d{14}_[A-Za-z0-9_]+)` migration/i,
    /failed migrations?[\s\S]*?`(\d{14}_[A-Za-z0-9_]+)`/i,
  ];
  for (const re of patterns) {
    const m = out.match(re);
    if (m) return m[1];
  }
  return null;
}

function recover(out) {
  if (
    /relation ["']?WebinarRecording["']? already exists/i.test(out) ||
    (/WebinarRecording/i.test(out) && /already exists/i.test(out))
  ) {
    migrateResolve("--rolled-back", RECORDINGS);
    return migrateResolve("--applied", RECORDINGS);
  }

  if (
    /already exists/i.test(out) &&
    /forcedAudience|chatMutedUntil|kickedAt|deletedAt/i.test(out)
  ) {
    migrateResolve("--rolled-back", MODERATION);
    return migrateResolve("--applied", MODERATION);
  }

  const failed = extractMigrationName(out);
  if (!failed && !/P3009/i.test(out)) return false;

  const name = failed || RECORDINGS;
  if (name === LEGACY_RECORDINGS) {
    return migrateResolve("--rolled-back", LEGACY_RECORDINGS);
  }
  if (name === RECORDINGS || name === MODERATION) {
    migrateResolve("--rolled-back", name);
    return migrateResolve("--applied", name);
  }

  // Unknown failed migration — do not mark rolled-back. That leaves half-applied
  // SQL in place and the next deploy then dies on "already exists".
  console.error(`Leaving failed migration ${name} unresolved for a human to inspect.`);
  return false;
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is missing — cannot run migrations.");
  process.exit(1);
}

let deploy = migrateDeploy();
process.stdout.write(combined(deploy));

if (deploy.status !== 0) {
  const out = combined(deploy);
  if (recover(out)) {
    console.log("Retrying prisma migrate deploy…");
    deploy = migrateDeploy();
    process.stdout.write(combined(deploy));
  }
}

if (deploy.status !== 0) {
  console.error("prisma migrate deploy failed — refusing to start the new release.");
  process.exit(deploy.status ?? 1);
}

console.log("Migrations up to date.");
process.exit(0);
