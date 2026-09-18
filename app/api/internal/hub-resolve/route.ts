import { NextResponse } from "next/server";
import { hostnameFromHeaders, isCustomDomainCandidate } from "@/lib/hub/host";
import { findSlugByCustomDomain } from "@/lib/hub/customDomain";
import { getControlPrisma } from "@/lib/hub/tenantPrisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const host = new URL(req.url).searchParams.get("h") || hostnameFromHeaders(req.headers);
  if (!isCustomDomainCandidate(host)) {
    return NextResponse.json({ slug: null });
  }
  const slug = await findSlugByCustomDomain(getControlPrisma(), host);
  return NextResponse.json({ slug });
}
