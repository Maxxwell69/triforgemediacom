/**
 * Railway pre-deploy: apply pending Prisma migrations to Hub 0 (`public`)
 * and every provisioned client-hub schema (`hub_*`).
 *
 * Keeps a small recovery path for the renamed webinar-recordings migration
 * leftover (P3009 / "already exists"), then exits non-zero only if migrate
 * deploy still cannot succeed.
 */
import { spawnSync } from "node:child_process";

const LEGACY_RECORDINGS = "20260729214500_add_webinar_recordings";
const RECORDINGS = "20260729221000_add_webinar_recordings";
const MODERATION = "20260730021500_add_webinar_moderation";
const ANNOUNCEMENT_MEDIA = "20260901190000_announcement_media";
const PERSONAL_TASK_CATEGORY = "20260903200000_personal_task_category";
const BOOKING_REMIND_CANCEL = "20260904020000_booking_remind_cancel";
const CLIENT_HUB_TENANT_DB = "20260904040000_client_hub_tenant_db_name";
const HUB_MEMBERSHIP = "20260915210000_hub_membership";

/** Additive-only migrations that are safe to mark applied if SQL already landed. */
const SAFE_MARK_APPLIED = new Set([
  ANNOUNCEMENT_MEDIA,
  PERSONAL_TASK_CATEGORY,
  BOOKING_REMIND_CANCEL,
  CLIENT_HUB_TENANT_DB,
  HUB_MEMBERSHIP,
]);

const TENANT_SCHEMA_RE = /^hub_[a-z0-9_]+$/;

function withSchema(databaseUrl, schema) {
  const stripped = databaseUrl
    .replace(/([?&])schema=[^&]*/gi, "$1")
    .replace(/[?&]$/, "")
    .replace(/\?&/, "?");
  const join = stripped.includes("?") ? "&" : "?";
  return `${stripped}${join}schema=${encodeURIComponent(schema)}`;
}

function envForSchema(schema) {
  return { ...process.env, DATABASE_URL: withSchema(process.env.DATABASE_URL, schema) };
}

function run(args, env = process.env, timeout = 0) {
  return spawnSync("npx", args, {
    encoding: "utf8",
    shell: true,
    stdio: ["ignore", "pipe", "pipe"],
    env,
    timeout: timeout || undefined,
    killSignal: "SIGTERM",
  });
}

function combined(result) {
  return `${result.stdout || ""}\n${result.stderr || ""}`;
}

function migrateDeploy(env = process.env, timeout = 0) {
  return run(["prisma", "migrate", "deploy"], env, timeout);
}

function migrateResolve(flag, name, env = process.env) {
  console.log(`prisma migrate resolve ${flag} ${name}`);
  const resolve = run(["prisma", "migrate", "resolve", flag, name], env);
  process.stdout.write(combined(resolve));
  return resolve.status === 0;
}

function extractMigrationName(out) {
  const patterns = [
    /Migration name:\s*`?(\d{14}_[A-Za-z0-9_]+)`?/i,
    /The `(\d{14}_[A-Za-z0-9_]+)` migration/i,
    /failed migrations?[\s\S]*?`(\d{14}_[A-Za-z0-9_]+)`/i,
    /Migration `(\d{14}_[A-Za-z0-9_]+)` failed/i,
  ];
  for (const re of patterns) {
    const m = out.match(re);
    if (m) return m[1];
  }
  return null;
}

function recover(out, env = process.env) {
  if (
    /relation ["']?WebinarRecording["']? already exists/i.test(out) ||
    (/WebinarRecording/i.test(out) && /already exists/i.test(out))
  ) {
    migrateResolve("--rolled-back", RECORDINGS, env);
    return migrateResolve("--applied", RECORDINGS, env);
  }

  if (
    /already exists/i.test(out) &&
    /forcedAudience|chatMutedUntil|kickedAt|deletedAt/i.test(out)
  ) {
    migrateResolve("--rolled-back", MODERATION, env);
    return migrateResolve("--applied", MODERATION, env);
  }

  const failed = extractMigrationName(out);
  if (!failed && !/P3009/i.test(out)) return false;

  const name = failed || RECORDINGS;
  if (name === LEGACY_RECORDINGS) {
    return migrateResolve("--rolled-back", LEGACY_RECORDINGS, env);
  }
  if (name === RECORDINGS || name === MODERATION) {
    migrateResolve("--rolled-back", name, env);
    return migrateResolve("--applied", name, env);
  }

  // Additive column migrations: first apply can fail with "already exists".
  // Later deploys only report P3009 ("migration X failed") with no column text.
  // Roll back the failed row, then mark applied so deploy can continue.
  if (SAFE_MARK_APPLIED.has(name)) {
    console.log(`Recovering additive migration ${name} (mark applied).`);
    migrateResolve("--rolled-back", name, env);
    return migrateResolve("--applied", name, env);
  }

  // Unknown failed migration — do not mark rolled-back. That leaves half-applied
  // SQL in place and the next deploy then dies on "already exists".
  console.error(`Leaving failed migration ${name} unresolved for a human to inspect.`);
  return false;
}

function deployWithRecover(label, env = process.env, timeout = 0) {
  let deploy = migrateDeploy(env, timeout);
  process.stdout.write(combined(deploy));

  if (deploy.status !== 0) {
    const out = combined(deploy);
    if (recover(out, env)) {
      console.log(`Retrying prisma migrate deploy (${label})…`);
      deploy = migrateDeploy(env, timeout);
      process.stdout.write(combined(deploy));
    }
  }

  return deploy.status === 0;
}

async function listTenantSchemas(prisma) {
  try {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT "tenantDbName" AS schema FROM "ClientHub" WHERE "tenantDbName" IS NOT NULL`
    );
    const names = rows
      .map((row) => row.schema)
      .filter((name) => typeof name === "string" && TENANT_SCHEMA_RE.test(name));
    if (names.length) return [...new Set(names)].sort();
  } catch (err) {
    console.warn("Could not list ClientHub tenant schemas:", err?.message || err);
  }

  const rows = await prisma.$queryRawUnsafe(
    `SELECT nspname AS schema FROM pg_namespace WHERE nspname ~ '^hub_[a-z0-9_]+$' ORDER BY 1`
  );
  return rows.map((row) => row.schema).filter(Boolean);
}

async function migrateTenants() {
  let PrismaClient;
  try {
    ({ PrismaClient } = await import("@prisma/client"));
  } catch (err) {
    console.warn("Skipping tenant migrate — Prisma client unavailable:", err?.message || err);
    return;
  }

  const prisma = new PrismaClient();
  try {
    const schemas = await listTenantSchemas(prisma);
    if (schemas.length === 0) {
      console.log("No client-hub schemas to migrate.");
      return;
    }

    console.log(`Migrating ${schemas.length} client-hub schema(s): ${schemas.join(", ")}`);
    for (const schema of schemas) {
      console.log(`prisma migrate deploy → ${schema}`);
      const ok = deployWithRecover(schema, envForSchema(schema), 90_000);
      if (!ok) {
        console.error(
          `prisma migrate deploy failed for ${schema} — Hub 0 will still start. Apply this hub_* schema by hand.`
        );
      }
    }
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is missing — cannot run migrations.");
  process.exit(1);
}

if (!deployWithRecover("public")) {
  console.error("prisma migrate deploy failed — refusing to start the new release.");
  process.exit(1);
}

try {
  await migrateTenants();
} catch (err) {
  console.error("Tenant schema migrate skipped after error:", err?.message || err);
}

console.log("Migrations up to date (public). Tenant schemas attempted.");
process.exit(0);
