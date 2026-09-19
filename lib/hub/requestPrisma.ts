import "server-only";

import { headers } from "next/headers";
import type { PrismaClient } from "@prisma/client";
import { hostnameFromHeaders, isCustomDomainCandidate } from "@/lib/hub/host";
import { findSlugByCustomDomain, rememberHostSlug } from "@/lib/hub/customDomain";
import { trustedClientSlug } from "@/lib/hub/requestHost";
import { getControlPrisma, getTenantPrisma } from "@/lib/hub/tenantPrisma";

export type RequestClientHub = {
  id: string;
  name: string;
  slug: string;
  enabledSkuIds: string[];
  tenantDbName: string | null;
  tenantDbAt: Date | null;
};

export type RequestHubContext =
  | { kind: "platform"; prisma: PrismaClient; control: PrismaClient; hub: null }
  | { kind: "client"; prisma: PrismaClient; control: PrismaClient; hub: RequestClientHub }
  | {
      kind: "client-unprovisioned";
      prisma: null;
      control: PrismaClient;
      hub: RequestClientHub;
    }
  | { kind: "unknown-client"; prisma: null; control: PrismaClient; hub: null; slug: string };

/**
 * Which database this request should use.
 * ClientHub rows always come from Hub 0 `public`. Member data uses the tenant schema.
 */
export async function getRequestHubContext(): Promise<RequestHubContext> {
  const control = getControlPrisma();

  let hostname = "";
  let slug: string | null = null;
  try {
    const h = headers();
    hostname = hostnameFromHeaders(h);
    slug = trustedClientSlug(h);
  } catch {
    return { kind: "platform", prisma: control, control, hub: null };
  }

  if (!slug && isCustomDomainCandidate(hostname)) {
    slug = await findSlugByCustomDomain(control, hostname);
  } else if (slug && isCustomDomainCandidate(hostname)) {
    rememberHostSlug(hostname, slug);
  }

  if (!slug) {
    return { kind: "platform", prisma: control, control, hub: null };
  }

  const hub = await control.clientHub.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      enabledSkuIds: true,
      tenantDbName: true,
      tenantDbAt: true,
    },
  });

  if (!hub) {
    return { kind: "unknown-client", prisma: null, control, hub: null, slug };
  }

  if (!hub.tenantDbName || !hub.tenantDbAt) {
    return { kind: "client-unprovisioned", prisma: null, control, hub };
  }

  return {
    kind: "client",
    prisma: getTenantPrisma(hub.tenantDbName),
    control,
    hub,
  };
}

/** App data client for this request. Throws if a client host is not provisioned. */
export async function getRequestPrisma(): Promise<PrismaClient> {
  const ctx = await getRequestHubContext();
  if (ctx.prisma) return ctx.prisma;
  if (ctx.kind === "unknown-client") {
    throw new Error(`No client hub is registered for ${ctx.slug}.`);
  }
  throw new Error("This hub’s database is not provisioned yet.");
}
