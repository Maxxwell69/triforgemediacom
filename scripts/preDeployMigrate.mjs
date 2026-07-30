/**
 * Railway pre-deploy: clear a known failed migration (if present), then deploy.
 *
 * Prod briefly tried to apply webinar recordings before the Webinar table
 * existed (bad timestamp order). Prisma recorded that failure and blocks all
 * later migrate deploy runs until it's marked rolled back.
 */
import { spawnSync } from "node:child_process";

const LEGACY_FAILED = "20260729214500_add_webinar_recordings";

function run(args) {
  return spawnSync("npx", args, { stdio: "inherit", shell: true });
}

const resolve = run(["prisma", "migrate", "resolve", "--rolled-back", LEGACY_FAILED]);
if (resolve.status === 0) {
  console.log(`Cleared failed legacy migration: ${LEGACY_FAILED}`);
} else {
  console.log("No legacy failed migration to clear (ok).");
}

const deploy = run(["prisma", "migrate", "deploy"]);
process.exit(deploy.status ?? 1);
