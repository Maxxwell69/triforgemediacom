/**
 * Railway pre-deploy: apply pending Prisma migrations.
 *
 * Two leftover states from renaming the webinar recordings migration:
 *
 * 1) Production: old name recorded as *failed* (P3009) because it ran before
 *    the Webinar table existed → mark rolled back, then deploy.
 * 2) Staging: old name recorded as *applied*, but the folder was renamed in
 *    git → Prisma refuses deploy ("applied but missing from migrations").
 *    Rename that `_prisma_migrations` row to the new name, then deploy.
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

function clearLegacyFailed() {
  console.log(`Clearing failed legacy migration: ${LEGACY_NAME}`);
  const resolve = run(
    ["prisma", "migrate", "resolve", "--rolled-back", LEGACY_NAME],
    { stdio: ["ignore", "pipe", "pipe"] }
  );
  process.stdout.write(combined(resolve));
  return resolve.status === 0;
}

function renameLegacyAppliedRow() {
  console.log(
    `Ensuring legacy migration row is renamed ${LEGACY_NAME} → ${CURRENT_NAME} (no-op if absent)`
  );
  const dir = mkdtempSync(join(tmpdir(), "prisma-predeploy-"));
  const file = join(dir, "rename.sql");
  writeFileSync(
    file,
    `UPDATE "_prisma_migrations"
SET migration_name = '${CURRENT_NAME}'
WHERE migration_name = '${LEGACY_NAME}'
  AND NOT EXISTS (
    SELECT 1 FROM "_prisma_migrations" WHERE migration_name = '${CURRENT_NAME}'
  );
`
  );
  try {
    const exec = run(
      ["prisma", "db", "execute", "--file", file, "--schema", "prisma/schema.prisma"],
      { stdio: ["ignore", "pipe", "pipe"] }
    );
    process.stdout.write(combined(exec));
    // Non-zero here usually means no DB / wrong schema — still continue so
    // migrate deploy surfaces the real error.
    return exec.status === 0;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function markCurrentApplied() {
  console.log(`Marking ${CURRENT_NAME} as already applied`);
  const resolve = run(
    ["prisma", "migrate", "resolve", "--applied", CURRENT_NAME],
    { stdio: ["ignore", "pipe", "pipe"] }
  );
  process.stdout.write(combined(resolve));
  return resolve.status === 0;
}

function isLegacyFailedBlock(out) {
  return (
    /P3009/i.test(out) ||
    (out.includes(LEGACY_NAME) && /failed migrations?/i.test(out))
  );
}

function isRecordingsAlreadyExists(out) {
  return (
    out.includes(CURRENT_NAME) &&
    (/already exists/i.test(out) || /WebinarRecording/i.test(out))
  );
}

// Staging: old applied name still in `_prisma_migrations` after the folder rename.
renameLegacyAppliedRow();

let deploy = migrateDeploy();
process.stdout.write(combined(deploy));

if (deploy.status !== 0) {
  const out = combined(deploy);
  let recovered = false;

  if (isLegacyFailedBlock(out)) {
    recovered = clearLegacyFailed();
  } else if (isRecordingsAlreadyExists(out)) {
    recovered = markCurrentApplied();
  }

  if (recovered) {
    console.log("Retrying prisma migrate deploy…");
    deploy = migrateDeploy();
    process.stdout.write(combined(deploy));
  }
}

if (deploy.status !== 0) {
  console.error("prisma migrate deploy failed — refusing to start the new release.");
  console.error(
    "If staging still has the old recordings migration name, run once in Railway shell:\n" +
      `  UPDATE "_prisma_migrations" SET migration_name = '${CURRENT_NAME}' ` +
      `WHERE migration_name = '${LEGACY_NAME}';\n` +
      "  npx prisma migrate deploy"
  );
  process.exit(deploy.status ?? 1);
}

console.log("Migrations up to date.");
process.exit(0);
