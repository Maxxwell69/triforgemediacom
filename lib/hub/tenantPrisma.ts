import "server-only";

import { PrismaClient } from "@prisma/client";
import { controlPrisma } from "@/lib/prismaControl";
import { isTenantSchemaName, tenantDatasourceUrl } from "@/lib/hub/schemaUrl";

const globalForTenant = globalThis as unknown as {
  tenantPrismaBySchema?: Map<string, PrismaClient>;
  tenantRoleEnumPatched?: Set<string>;
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
 * Client hubs were provisioned before Fan/Superfan existed. Those enum values
 * live per-schema, so Hub 0 migrations do not add them to hub_*.
 */
export async function ensureTenantUserRoleValues(schema: string) {
  if (!isTenantSchemaName(schema)) return;
  if (!globalForTenant.tenantRoleEnumPatched) {
    globalForTenant.tenantRoleEnumPatched = new Set();
  }
  if (globalForTenant.tenantRoleEnumPatched.has(schema)) return;

  const db = getTenantPrisma(schema);
  try {
    await db.$executeRawUnsafe(
      `ALTER TYPE "${schema}"."UserRole" ADD VALUE IF NOT EXISTS 'SUPERFAN'`
    );
    await db.$executeRawUnsafe(
      `ALTER TYPE "${schema}"."UserRole" ADD VALUE IF NOT EXISTS 'FAN'`
    );
    globalForTenant.tenantRoleEnumPatched.add(schema);
  } catch (err) {
    console.error("tenant UserRole enum patch failed", schema, err);
  }
}

/**
 * Existing client hubs were provisioned before named member types.
 * Hub 0 migrations do not add tables to hub_* schemas.
 */
export async function ensureTenantMemberTypeSchema(schema: string) {
  if (!isTenantSchemaName(schema)) return;
  const db = getTenantPrisma(schema);
  try {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "${schema}"."HubMemberType" (
        "id" TEXT NOT NULL,
        "key" TEXT,
        "name" TEXT NOT NULL,
        "sortOrder" INTEGER NOT NULL DEFAULT 0,
        "allowedMenuIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
        "signupDefault" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "HubMemberType_pkey" PRIMARY KEY ("id")
      )
    `);
    await db.$executeRawUnsafe(
      `CREATE UNIQUE INDEX IF NOT EXISTS "HubMemberType_key_key" ON "${schema}"."HubMemberType"("key")`
    );
    await db.$executeRawUnsafe(
      `ALTER TABLE "${schema}"."User" ADD COLUMN IF NOT EXISTS "memberTypeId" TEXT`
    );
    await db.$executeRawUnsafe(
      `ALTER TABLE "${schema}"."Webinar" ADD COLUMN IF NOT EXISTS "audienceMemberTypeIds" TEXT[] DEFAULT ARRAY[]::TEXT[]`
    );
    await db.$executeRawUnsafe(
      `ALTER TABLE "${schema}"."CalendarEvent" ADD COLUMN IF NOT EXISTS "audienceMemberTypeIds" TEXT[] DEFAULT ARRAY[]::TEXT[]`
    );
    await db.$executeRawUnsafe(`
      DO $$ BEGIN
        ALTER TABLE "${schema}"."User"
          ADD CONSTRAINT "User_memberTypeId_fkey"
          FOREIGN KEY ("memberTypeId") REFERENCES "${schema}"."HubMemberType"("id")
          ON DELETE SET NULL ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
  } catch (err) {
    console.error("tenant HubMemberType schema patch failed", schema, err);
  }
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
    await ensureTenantUserRoleValues(schema);
    await ensureTenantMemberTypeSchema(schema);
    return { ok: true, schema };
  } catch (err) {
    console.error("tenant schema ping failed", schema, err);
    return { ok: false, error: "Couldn't reach this hub’s database schema." };
  }
}
