import "server-only";

import { spawn } from "node:child_process";
import { prisma } from "@/lib/prisma";

const SCHEMA_RE = /^hub_[a-z0-9_]+$/;
const MIGRATE_TIMEOUT_MS = 180_000;

export function tenantSchemaName(slug: string) {
  const name = `hub_${slug.replace(/-/g, "_")}`;
  if (!SCHEMA_RE.test(name)) {
    throw new Error("Invalid hub slug for a database schema.");
  }
  return name;
}

function withSchema(databaseUrl: string, schema: string) {
  const stripped = databaseUrl
    .replace(/([?&])schema=[^&]*/gi, "$1")
    .replace(/[?&]$/, "")
    .replace(/\?&/, "?");
  const join = stripped.includes("?") ? "&" : "?";
  return `${stripped}${join}schema=${encodeURIComponent(schema)}`;
}

function redact(text: string) {
  return text
    .replace(/postgres(?:ql)?:\/\/[^@\s]+@/gi, "postgres://***@")
    .replace(/DATABASE_URL[=:][^\s]+/gi, "DATABASE_URL=***");
}

function runMigrateDeploy(databaseUrl: string): Promise<{ ok: boolean; log: string }> {
  return new Promise((resolve) => {
    const child = spawn("npx", ["prisma", "migrate", "deploy"], {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      cwd: process.cwd(),
      shell: true,
      windowsHide: true,
    });
    let log = "";
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      log += "\n(timed out waiting for prisma migrate deploy)\n";
    }, MIGRATE_TIMEOUT_MS);
    child.stdout?.on("data", (chunk) => {
      log += String(chunk);
    });
    child.stderr?.on("data", (chunk) => {
      log += String(chunk);
    });
    child.on("error", (err) => {
      clearTimeout(timer);
      resolve({ ok: false, log: redact(`${log}\n${err.message}`) });
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ ok: code === 0, log: redact(log) });
    });
  });
}

export async function provisionTenantSchema(slug: string): Promise<{
  error: string | null;
  schema?: string;
}> {
  const schema = tenantSchemaName(slug);
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return { error: "DATABASE_URL is not set on this environment." };
  }

  try {
    await prisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
  } catch (err) {
    console.error("create tenant schema failed", schema, err);
    return { error: "Couldn't create the hub schema on Postgres. Check database permissions." };
  }

  const migrate = await runMigrateDeploy(withSchema(databaseUrl, schema));
  if (!migrate.ok) {
    console.error("tenant migrate deploy failed", schema, migrate.log);
    return {
      error: "Schema was created but migrations failed. Try Provision again, or check Railway logs.",
    };
  }

  return { error: null, schema };
}
