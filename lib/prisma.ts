import { PrismaClient } from "@prisma/client";
import { headers } from "next/headers";
import { hostnameFromHeaders, isCustomDomainCandidate } from "@/lib/hub/host";
import { peekHostSlug } from "@/lib/hub/customDomain";
import { trustedClientSlug } from "@/lib/hub/requestHost";
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
    const hostname = hostnameFromHeaders(h);
    const slug = trustedClientSlug(h);
    if (slug) {
      return getTenantPrisma(tenantSchemaName(slug));
    }
    if (isCustomDomainCandidate(hostname)) {
      const cached = peekHostSlug(hostname);
      if (cached) return getTenantPrisma(tenantSchemaName(cached));
      throw new Error(`No client hub is registered for ${hostname}.`);
    }
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("No client hub is registered")) {
      throw err;
    }
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
