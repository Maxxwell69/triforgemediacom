import { NextResponse } from "next/server";
import { hostnameFromHeaders, isCustomDomainCandidate, resolveHubHost } from "@/lib/hub/host";
import { findSlugByCustomDomain } from "@/lib/hub/customDomain";
import { getControlPrisma, pingTenantSchema } from "@/lib/hub/tenantPrisma";

/**
 * Railway healthcheck target. Platform / Railway hosts must stay 200 with no DB.
 * Client hostnames add a tenant ping (still 200) so ops can see schema reachability.
 */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const body: Record<string, unknown> = {
    ok: true,
    version: process.env.npm_package_version ?? "ok",
  };

  const host = hostnameFromHeaders(req.headers);
  const resolved = resolveHubHost(host);
  let slug = resolved.kind === "client" ? resolved.slug : null;
  if (!slug && isCustomDomainCandidate(host)) {
    slug = await findSlugByCustomDomain(getControlPrisma(), host);
  }
  if (!slug) {
    return NextResponse.json(body);
  }

  body.hub = slug;
  const hub = await getControlPrisma().clientHub.findUnique({
    where: { slug },
    select: { tenantDbName: true },
  });
  if (!hub) {
    body.tenant = "missing";
    return NextResponse.json(body);
  }
  if (!hub.tenantDbName) {
    body.tenant = "unprovisioned";
    return NextResponse.json(body);
  }

  const ping = await pingTenantSchema(hub.tenantDbName);
  body.schema = hub.tenantDbName;
  body.tenant = ping.ok ? "ok" : "error";
  return NextResponse.json(body);
}
