/**
 * Railway pre-deploy: unblock a known failed migration (if present), then deploy.
 *
 * Prod/staging briefly recorded `20260729214500_add_webinar_recordings` as failed
 * (bad timestamp order before the Webinar table). Prisma blocks all later
 * `migrate deploy` runs (P3009) until that row is marked rolled back.
 *
 * Important: only resolve when migrate status actually reports a failure.
 * Blindly resolving every deploy is noisy and can fail once the legacy folder
 * is gone from the repo — which aborts the release and leaves the old version live.
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

const status = run(["prisma", "migrate", "status"], { stdio: ["ignore", "pipe", "pipe"] });
const statusOut = combined(status);
process.stdout.write(statusOut);

const blockedByLegacy =
  statusOut.includes(LEGACY_FAILED) &&
  (/failed/i.test(statusOut) || /P3009/i.test(statusOut));

if (blockedByLegacy) {
  console.log(`\nAttempting to clear failed legacy migration: ${LEGACY_FAILED}`);
  const resolve = run(
    ["prisma", "migrate", "resolve", "--rolled-back", LEGACY_FAILED],
    { stdio: "inherit" }
  );
  if (resolve.status !== 0) {
    console.error(
      "Could not clear legacy failed migration. In Railway → service shell run:\n" +
        `  npx prisma migrate resolve --rolled-back ${LEGACY_FAILED}\n` +
        "  npx prisma migrate deploy"
    );
    process.exit(resolve.status ?? 1);
  }
  console.log(`Cleared failed legacy migration: ${LEGACY_FAILED}`);
} else {
  console.log("No legacy failed migration blocking deploy (ok).");
}

const deploy = run(["prisma", "migrate", "deploy"], { stdio: "inherit" });
if (deploy.status !== 0) {
  console.error("prisma migrate deploy failed — refusing to start the new release.");
  process.exit(deploy.status ?? 1);
}

console.log("Migrations up to date.");
process.exit(0);
