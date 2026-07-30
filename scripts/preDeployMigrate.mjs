/**
 * Railway pre-deploy: apply pending Prisma migrations.
 *
 * Prod/staging briefly recorded `20260729214500_add_webinar_recordings` as failed
 * (bad timestamp order before the Webinar table). Prisma blocks all later
 * `migrate deploy` runs (P3009) until that row is marked rolled back.
 */
import { spawnSync } from "node:child_process";

const LEGACY_FAILED = "20260729214500_add_webinar_recordings";

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
  console.log(`Clearing failed legacy migration: ${LEGACY_FAILED}`);
  const resolve = run(
    ["prisma", "migrate", "resolve", "--rolled-back", LEGACY_FAILED],
    { stdio: ["ignore", "pipe", "pipe"] }
  );
  process.stdout.write(combined(resolve));
  return resolve.status === 0;
}

let deploy = migrateDeploy();
process.stdout.write(combined(deploy));

if (deploy.status !== 0) {
  const out = combined(deploy);
  const blocked =
    /P3009/i.test(out) ||
    (out.includes(LEGACY_FAILED) && /failed/i.test(out));

  if (blocked) {
    if (!clearLegacyFailed()) {
      console.error(
        "Could not clear legacy failed migration. In Railway → service shell run:\n" +
          `  npx prisma migrate resolve --rolled-back ${LEGACY_FAILED}\n` +
          "  npx prisma migrate deploy"
      );
      process.exit(1);
    }
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
