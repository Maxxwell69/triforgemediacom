/**
 * Railway pre-deploy: apply pending Prisma migrations.
 *
 * Leftover states from renaming webinar recordings migration:
 *
 * 1) Production: old name recorded as *failed* (P3009) → mark rolled back.
 * 2) Staging: old name was *applied*, folder renamed in git → rename the
 *    `_prisma_migrations` row, OR the new name failed with
 *    `relation "WebinarRecording" already exists` → mark new name applied.
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const LEGACY_NAME = "20260729214500_add_webinar_recordings";
const CURRENT_NAME = "20260729221000_add_webinar_recordings";

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
  const resolve = run(
    ["prisma", "migrate", "resolve", flag, name],
    { stdio: ["ignore", "pipe", "pipe"] }
  );
  process.stdout.write(combined(resolve));
  return resolve.status === 0;
}

function dbExecute(sql, label) {
  console.log(label);
  const dir = mkdtempSync(join(tmpdir(), "prisma-predeploy-"));
  const file = join(dir, "fix.sql");
  writeFileSync(file, sql);
  try {
    const exec = run(
      ["prisma", "db", "execute", "--file", file, "--schema", "prisma/schema.prisma"],
      { stdio: ["ignore", "pipe", "pipe"] }
    );
    process.stdout.write(combined(exec));
    return exec.status === 0;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function renameLegacyAppliedRow() {
  return dbExecute(
    `UPDATE "_prisma_migrations"
SET migration_name = '${CURRENT_NAME}'
WHERE migration_name = '${LEGACY_NAME}'
  AND finished_at IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "_prisma_migrations" WHERE migration_name = '${CURRENT_NAME}'
  );
`,
    `Renaming applied legacy migration ${LEGACY_NAME} → ${CURRENT_NAME} (no-op if absent)`
  );
}

function deleteFailedCurrentRow() {
  // Lets `migrate resolve --applied` succeed cleanly after a failed CREATE.
  return dbExecute(
    `DELETE FROM "_prisma_migrations"
WHERE migration_name = '${CURRENT_NAME}'
  AND finished_at IS NULL;
`,
    `Clearing failed (unfinished) row for ${CURRENT_NAME} if present`
  );
}

function isRecordingsAlreadyExists(out) {
  return (
    /relation ["']?WebinarRecording["']? already exists/i.test(out) ||
    (/WebinarRecording/i.test(out) && /already exists/i.test(out))
  );
}

function recoverFromDeployFailure(out) {
  // Staging: CREATE TABLE raced an already-applied (renamed) migration.
  if (isRecordingsAlreadyExists(out)) {
    deleteFailedCurrentRow();
    return migrateResolve("--applied", CURRENT_NAME);
  }

  // P3009 for the *new* name after a prior already-exists failure.
  if (/P3009/i.test(out) && out.includes(CURRENT_NAME)) {
    deleteFailedCurrentRow();
    return migrateResolve("--applied", CURRENT_NAME);
  }

  // Production: failed attempt under the old name before Webinar existed.
  if (
    (/P3009/i.test(out) && out.includes(LEGACY_NAME)) ||
    (out.includes(LEGACY_NAME) && /failed migrations?/i.test(out))
  ) {
    return migrateResolve("--rolled-back", LEGACY_NAME);
  }

  return false;
}

renameLegacyAppliedRow();

let deploy = migrateDeploy();
process.stdout.write(combined(deploy));

if (deploy.status !== 0) {
  const out = combined(deploy);
  if (recoverFromDeployFailure(out)) {
    console.log("Retrying prisma migrate deploy…");
    deploy = migrateDeploy();
    process.stdout.write(combined(deploy));
  }
}

// One more pass if the first recovery unblocked P3009 but left already-exists.
if (deploy.status !== 0) {
  const out = combined(deploy);
  if (recoverFromDeployFailure(out)) {
    console.log("Retrying prisma migrate deploy (second pass)…");
    deploy = migrateDeploy();
    process.stdout.write(combined(deploy));
  }
}

if (deploy.status !== 0) {
  console.error("prisma migrate deploy failed — refusing to start the new release.");
  console.error(
    "Manual staging fix in Railway Postgres / service shell:\n" +
      `  UPDATE "_prisma_migrations" SET migration_name = '${CURRENT_NAME}' ` +
      `WHERE migration_name = '${LEGACY_NAME}';\n` +
      `  DELETE FROM "_prisma_migrations" WHERE migration_name = '${CURRENT_NAME}' AND finished_at IS NULL;\n` +
      `  npx prisma migrate resolve --applied ${CURRENT_NAME}\n` +
      "  npx prisma migrate deploy"
  );
  process.exit(deploy.status ?? 1);
}

console.log("Migrations up to date.");
process.exit(0);
