import { PrismaClient } from "@prisma/client";
import { headers } from "next/headers";
import { hostnameFromHeaders, resolveHubHost } from "@/lib/hub/host";
import { tenantSchemaName } from "@/lib/hub/schemaUrl";
import { getControlPrisma, getTenantPrisma } from "@/lib/hub/tenantPrisma";

/**
 * Request-scoped Prisma: Hub 0 hostname → public schema;
 * `{slug}.hub.triforgemedia.com` → that hub’s tenant schema.
 * Identity (password, HubMembership, ClientHub) still uses getControlPrisma().
 */

export function prismaForRequest(): PrismaClient {
  try {
    const resolved = resolveHubHost(hostnameFromHeaders(headers()));
    if (resolved.kind === "client") {
      return getTenantPrisma(tenantSchemaName(resolved.slug));
    }
  } catch {
    // Scripts, seed, or no request — Hub 0.
  }
  return getControlPrisma();
}

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    if (prop === "then" || prop === "catch" || prop === "finally") return undefined;
    const client = prismaForRequest();
    const value = Reflect.get(client, prop, client) as unknown;
    return typeof value === "function" ? value.bind(client) : value;
  },
});
