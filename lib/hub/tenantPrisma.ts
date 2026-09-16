import "server-only";

import { PrismaClient } from "@prisma/client";
import { controlPrisma } from "@/lib/prismaControl";
import { isTenantSchemaName, tenantDatasourceUrl } from "@/lib/hub/schemaUrl";

const globalForTenant = globalThis as unknown as {
  tenantPrismaBySchema?: Map<string, PrismaClient>;
};

function tenantClients() {
  if (!globalForTenant.tenantPrismaBySchema) {
    globalForTenant.tenantPrismaBySchema = new Map();
  }
  return globalForTenant.tenantPrismaBySchema;
}

/** Hub 0 + Create Hub registry. Always the `public` schema. */
export function getControlPrisma() {
  return controlPrisma;
}

/**
 * Prisma client pinned to one tenant schema (`hub_acme`, …).
 * Cached per process so we do not open a new pool on every request.
 */
export function getTenantPrisma(schema: string): PrismaClient {
  if (!isTenantSchemaName(schema)) {
    throw new Error("Invalid tenant schema name.");
  }
  const cache = tenantClients();
  const existing = cache.get(schema);
  if (existing) return existing;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set.");
  }

  const client = new PrismaClient({
    datasourceUrl: tenantDatasourceUrl(databaseUrl, schema),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
  cache.set(schema, client);
  return client;
}

export async function pingTenantSchema(
  schema: string
): Promise<{ ok: true; schema: string } | { ok: false; error: string }> {
  if (!isTenantSchemaName(schema)) {
    return { ok: false, error: "Invalid tenant schema name." };
  }
  try {
    const db = getTenantPrisma(schema);
    const rows = await db.$queryRaw<Array<{ schema: string | null }>>`
      SELECT current_schema()::text AS schema
    `;
    const current = rows[0]?.schema;
    if (current !== schema) {
      return {
        ok: false,
        error: `Connected to ${current || "unknown"}, expected ${schema}.`,
      };
    }
    await db.$queryRaw`SELECT 1 FROM "_prisma_migrations" LIMIT 1`;
    return { ok: true, schema };
  } catch (err) {
    console.error("tenant schema ping failed", schema, err);
    return { ok: false, error: "Couldn't reach this hub’s database schema." };
  }
}
