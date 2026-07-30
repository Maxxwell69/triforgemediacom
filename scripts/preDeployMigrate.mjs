/**
 * Railway pre-deploy: apply pending Prisma migrations.
 *
 * Handles leftover state from renaming webinar recordings migration and
 * partial applies that leave P3009 / "already exists" blockers on every deploy.
 */
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const LEGACY_RECORDINGS = "20260729214500_add_webinar_recordings";
const RECORDINGS = "20260729221000_add_webinar_recordings";
const MODERATION = "20260730021500_add_webinar_moderation";

const require = createRequire(import.meta.url);

function run(args, opts = {}) {
  return spawnSync("npx", args, {
    encoding: "utf8",
    shell: true,
    ...opts,
  });
}

function combined(result) {
  return `${result.stdout || ""}\n${result.stderr || ""}`;
}

function migrateDeploy() {
  return run(["prisma", "migrate", "deploy"], { stdio: ["ignore", "pipe", "pipe"] });
}

function migrateResolve(flag, name) {
  console.log(`prisma migrate resolve ${flag} ${name}`);
  const resolve = run(["prisma", "migrate", "resolve", flag, name], {
    stdio: ["ignore", "pipe", "pipe"],
  });
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

async function getPrisma() {
  const { PrismaClient } = require("@prisma/client");
  return new PrismaClient();
}

async function tableExists(prisma, table) {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT to_regclass('public."${table}"') AS reg`
  );
  return Boolean(rows?.[0]?.reg);
}

async function columnExists(prisma, table, column) {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT 1 AS ok
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = $1
       AND column_name = $2
     LIMIT 1`,
    table,
    column
  );
  return rows.length > 0;
}

async function migrationRow(prisma, name) {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT migration_name, finished_at, rolled_back_at
     FROM "_prisma_migrations"
     WHERE migration_name = $1
     LIMIT 1`,
    name
  );
  return rows[0] ?? null;
}

async function deleteMigrationRow(prisma, name) {
  await prisma.$executeRawUnsafe(
    `DELETE FROM "_prisma_migrations" WHERE migration_name = $1`,
    name
  );
}

async function renameLegacyRecordings(prisma) {
  const legacy = await migrationRow(prisma, LEGACY_RECORDINGS);
  const current = await migrationRow(prisma, RECORDINGS);
  if (!legacy || current) return;

  // Successful apply under the old folder name (staging).
  if (legacy.finished_at && !legacy.rolled_back_at) {
    console.log(`Renaming applied migration ${LEGACY_RECORDINGS} → ${RECORDINGS}`);
    await prisma.$executeRawUnsafe(
      `UPDATE "_prisma_migrations"
       SET migration_name = $1
       WHERE migration_name = $2`,
      RECORDINGS,
      LEGACY_RECORDINGS
    );
    return;
  }

  // Failed apply under the old name (production) — drop the blocker row.
  console.log(`Removing failed legacy migration row ${LEGACY_RECORDINGS}`);
  await deleteMigrationRow(prisma, LEGACY_RECORDINGS);
}

async function ensureRecordingsApplied(prisma) {
  if (!(await tableExists(prisma, "WebinarRecording"))) return;

  const row = await migrationRow(prisma, RECORDINGS);
  if (row?.finished_at && !row.rolled_back_at) {
    console.log(`${RECORDINGS} already applied.`);
    return;
  }

  if (row) {
    console.log(`Clearing incomplete ${RECORDINGS} row (table already exists)`);
    await deleteMigrationRow(prisma, RECORDINGS);
  }

  console.log(`Marking ${RECORDINGS} applied — WebinarRecording table already present`);
  if (!migrateResolve("--applied", RECORDINGS)) {
    throw new Error(`Could not mark ${RECORDINGS} as applied`);
  }
}

async function ensureModerationApplied(prisma) {
  const hasCol = await columnExists(prisma, "WebinarAttendance", "forcedAudience");
  if (!hasCol) return;

  const row = await migrationRow(prisma, MODERATION);
  if (row?.finished_at && !row.rolled_back_at) {
    console.log(`${MODERATION} already applied.`);
    return;
  }

  if (row) {
    console.log(`Clearing incomplete ${MODERATION} row (columns already exist)`);
    await deleteMigrationRow(prisma, MODERATION);
  }

  console.log(`Marking ${MODERATION} applied — moderation columns already present`);
  if (!migrateResolve("--applied", MODERATION)) {
    throw new Error(`Could not mark ${MODERATION} as applied`);
  }
}

function recoverFromDeployFailure(out) {
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

  // Unknown failed migration: clear the gate so deploy can continue / surface next error.
  return migrateResolve("--rolled-back", name);
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is missing — cannot run migrations.");
    process.exit(1);
  }

  const prisma = await getPrisma();
  try {
    console.log("Aligning webinar migration history with database…");
    await renameLegacyRecordings(prisma);
    await ensureRecordingsApplied(prisma);
    await ensureModerationApplied(prisma);
  } finally {
    await prisma.$disconnect();
  }

  let deploy = migrateDeploy();
  process.stdout.write(combined(deploy));

  for (let attempt = 1; attempt <= 2 && deploy.status !== 0; attempt += 1) {
    const out = combined(deploy);
    if (!recoverFromDeployFailure(out)) break;
    console.log(`Retrying prisma migrate deploy (pass ${attempt})…`);
    deploy = migrateDeploy();
    process.stdout.write(combined(deploy));
  }

  if (deploy.status !== 0) {
    console.error("prisma migrate deploy failed — refusing to start the new release.");
    console.error(combined(deploy));
    process.exit(deploy.status ?? 1);
  }

  console.log("Migrations up to date.");
}

main().catch((err) => {
  console.error("preDeployMigrate failed:", err);
  process.exit(1);
});
