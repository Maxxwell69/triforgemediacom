import { PrismaClient } from "@prisma/client";
import { headers } from "next/headers";
import { hostnameFromHeaders, isCustomDomainCandidate, resolveHubHost } from "@/lib/hub/host";
import { peekHostSlug } from "@/lib/hub/customDomain";
import { tenantSchemaName } from "@/lib/hub/schemaUrl";
import { getControlPrisma, getTenantPrisma } from "@/lib/hub/tenantPrisma";

/**
 * Request-scoped Prisma: Hub 0 hostname → public schema;
 * `{slug}.hub.triforgemedia.com` or a saved custom domain → that hub’s tenant schema.
 * Identity (password, HubMembership, ClientHub) still uses getControlPrisma().
 */

export function prismaForRequest(): PrismaClient {
  try {
    const h = headers();
    const pinned = h.get("x-hub-slug");
    if (pinned && /^[a-z0-9-]+$/.test(pinned)) {
      return getTenantPrisma(tenantSchemaName(pinned));
    }
    const hostname = hostnameFromHeaders(h);
    const resolved = resolveHubHost(hostname);
    if (resolved.kind === "client") {
      return getTenantPrisma(tenantSchemaName(resolved.slug));
    }
    if (isCustomDomainCandidate(hostname)) {
      const cached = peekHostSlug(hostname);
      if (cached) return getTenantPrisma(tenantSchemaName(cached));
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
