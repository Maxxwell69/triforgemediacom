import "server-only";

import type { PrismaClient } from "@prisma/client";
import {
  CLIENT_HUB_SUFFIX,
  HUB0_HOST,
  isCustomDomainCandidate,
  isPlatformHubHost,
  stripPort,
} from "@/lib/hub/host";

const HOST_RE = /^(?=.{1,253}$)(?!-)[a-z0-9-]+(\.[a-z0-9-]+)+$/;

export type CustomDomainProvider = "cloudflare" | "railway";

export type CustomDomainDnsRecord = {
  type: "CNAME" | "TXT";
  host: string;
  value: string;
};

export type CustomDomainSetup = {
  host: string;
  provider?: CustomDomainProvider | null;
  railwayId: string | null;
  cloudflareId?: string | null;
  cnameHost: string | null;
  cnameTarget: string | null;
  txtHost: string | null;
  txtValue: string | null;
  extraTxt?: Array<{ host: string; value: string }>;
  dnsRecords?: CustomDomainDnsRecord[];
  certificateStatus: string | null;
  dnsStatus: string | null;
};

function parseDnsRecords(raw: unknown): CustomDomainDnsRecord[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const rows: CustomDomainDnsRecord[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;
    const type = rec.type === "TXT" || rec.type === "CNAME" ? rec.type : null;
    const host = typeof rec.host === "string" ? rec.host : "";
    const value = typeof rec.value === "string" ? rec.value : "";
    if (!type || !host || !value) continue;
    rows.push({ type, host, value });
  }
  return rows.length ? rows : undefined;
}

function parseExtraTxt(raw: unknown): Array<{ host: string; value: string }> | undefined {
  if (!Array.isArray(raw)) return undefined;
  const rows: Array<{ host: string; value: string }> = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;
    const host = typeof rec.host === "string" ? rec.host : "";
    const value = typeof rec.value === "string" ? rec.value : "";
    if (!host || !value) continue;
    rows.push({ host, value });
  }
  return rows.length ? rows : undefined;
}

export function parseCustomDomainSetup(raw: unknown): CustomDomainSetup | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const host = typeof row.host === "string" ? row.host : "";
  if (!host) return null;
  const provider = row.provider === "cloudflare" || row.provider === "railway" ? row.provider : null;
  return {
    host,
    provider,
    railwayId: typeof row.railwayId === "string" ? row.railwayId : null,
    cloudflareId: typeof row.cloudflareId === "string" ? row.cloudflareId : null,
    cnameHost: typeof row.cnameHost === "string" ? row.cnameHost : host,
    cnameTarget: typeof row.cnameTarget === "string" ? row.cnameTarget : null,
    txtHost: typeof row.txtHost === "string" ? row.txtHost : null,
    txtValue: typeof row.txtValue === "string" ? row.txtValue : null,
    extraTxt: parseExtraTxt(row.extraTxt),
    dnsRecords: parseDnsRecords(row.dnsRecords),
    certificateStatus: typeof row.certificateStatus === "string" ? row.certificateStatus : null,
    dnsStatus: typeof row.dnsStatus === "string" ? row.dnsStatus : null,
  };
}

export function customDomainHttpsReady(setup: CustomDomainSetup | null) {
  const cert = setup?.certificateStatus?.toUpperCase() || "";
  const dns = setup?.dnsStatus?.toUpperCase() || "";
  return (
    cert.includes("ISSUED") ||
    cert === "VALID" ||
    cert === "ACTIVE" ||
    dns === "ACTIVE"
  );
}

export function customDomainDnsRecords(setup: CustomDomainSetup): CustomDomainDnsRecord[] {
  if (setup.dnsRecords?.length) return setup.dnsRecords;
  const rows: CustomDomainDnsRecord[] = [];
  if (setup.cnameHost && setup.cnameTarget) {
    rows.push({ type: "CNAME", host: setup.cnameHost, value: setup.cnameTarget.replace(/\.$/, "") });
  }
  if (setup.txtHost && setup.txtValue) {
    rows.push({ type: "TXT", host: setup.txtHost, value: setup.txtValue });
  }
  for (const extra of setup.extraTxt || []) {
    rows.push({ type: "TXT", host: extra.host, value: extra.value });
  }
  return rows;
}

/** Host/name a registrar expects — relative to the root domain, not the FQDN. */
export function dnsRegistrarName(fqdn: string, vanityHost: string): string {
  const host = fqdn.replace(/\.$/, "").toLowerCase().trim();
  const vanity = vanityHost.replace(/\.$/, "").toLowerCase().trim();
  if (!host) return vanity;
  const vanityParts = vanity.split(".").filter(Boolean);
  const zone = vanityParts.length <= 2 ? vanity : vanityParts.slice(-2).join(".");
  if (host === zone) return "@";
  if (host.endsWith(`.${zone}`)) return host.slice(0, -(zone.length + 1));
  return host;
}

export function humanizeRailwayStatus(raw: string | null | undefined): string | null {
  if (!raw) return null;
  return raw
    .replace(/^CERTIFICATE_STATUS_TYPE_/, "")
    .replace(/^CERTIFICATE_STATUS_/, "")
    .replace(/^DNS_RECORD_STATUS_/, "")
    .replace(/_/g, " ")
    .trim()
    .toLowerCase();
}

export function normalizeCustomDomain(raw: string): string {
  let value = raw.trim().toLowerCase();
  value = value.replace(/^https?:\/\//, "");
  value = value.split("/")[0] || "";
  value = value.split("?")[0] || "";
  value = value.replace(/:\d+$/, "");
  value = value.replace(/\.$/, "");
  return value;
}

export function validateCustomDomain(
  raw: string
): { ok: true; host: string } | { ok: false; error: string } {
  const host = normalizeCustomDomain(raw);
  if (!host) return { ok: false, error: "Enter a hostname like community.example.com." };
  if (!HOST_RE.test(host)) {
    return { ok: false, error: "Use a valid hostname — letters, numbers, dots, and hyphens only." };
  }
  if (host === HUB0_HOST || host.endsWith(CLIENT_HUB_SUFFIX) || isPlatformHubHost(host)) {
    return { ok: false, error: "That host is reserved for TriForge. Use your own domain." };
  }
  if (host.split(".").length < 2) {
    return { ok: false, error: "Include a domain, for example community.yourbrand.com." };
  }
  return { ok: true, host };
}

const slugByHost = new Map<string, string | null>();

export function rememberHostSlug(hostname: string, slug: string | null) {
  const host = stripPort(hostname);
  // Never bind Hub 0 / Railway / localhost to a tenant. AUTH_URL can make a
  // vanity request look like hub.triforgemedia.com while x-hub-slug is pirate —
  // caching that pair made the main hub read an empty client community.
  if (!host || !isCustomDomainCandidate(host)) return;
  slugByHost.set(host, slug);
}

export function peekHostSlug(hostname: string): string | null | undefined {
  const host = stripPort(hostname);
  if (!host || !isCustomDomainCandidate(host)) return undefined;
  return slugByHost.get(host);
}

export async function findSlugByCustomDomain(
  control: PrismaClient,
  hostname: string
): Promise<string | null> {
  const host = stripPort(hostname);
  if (!host || !isCustomDomainCandidate(host)) return null;
  const cached = slugByHost.get(host);
  if (cached !== undefined) return cached;

  try {
    const rows = await control.$queryRaw<Array<{ slug: string }>>`
      SELECT slug FROM "ClientHub" WHERE "customDomain" = ${host} LIMIT 1
    `;
    const slug = rows[0]?.slug ?? null;
    slugByHost.set(host, slug);
    return slug;
  } catch {
    slugByHost.set(host, null);
    return null;
  }
}

export async function writeClientHubCustomDomain(
  control: PrismaClient,
  hubId: string,
  host: string | null,
  setup: CustomDomainSetup | null = null
) {
  if (host == null) {
    await control.$executeRawUnsafe(
      `UPDATE "ClientHub" SET "customDomain" = NULL, "customDomainSetup" = NULL WHERE id = $1`,
      hubId
    );
    slugByHost.clear();
    return;
  }
  const taken = await control.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM "ClientHub" WHERE "customDomain" = ${host} AND id <> ${hubId} LIMIT 1
  `;
  if (taken[0]) {
    throw new Error("That domain is already assigned to another hub.");
  }
  await control.$executeRawUnsafe(
    `UPDATE "ClientHub" SET "customDomain" = $1, "customDomainSetup" = $2::jsonb WHERE id = $3`,
    host,
    setup ? JSON.stringify(setup) : null,
    hubId
  );
  slugByHost.clear();
}

export async function readCustomDomainsByHubIds(
  control: PrismaClient,
  hubIds: string[]
): Promise<Map<string, string | null>> {
  const map = new Map<string, string | null>();
  if (hubIds.length === 0) return map;
  try {
    const rows = await control.$queryRawUnsafe<Array<{ id: string; customDomain: string | null }>>(
      `SELECT id, "customDomain" FROM "ClientHub" WHERE id = ANY($1::text[])`,
      hubIds
    );
    for (const row of rows) map.set(row.id, row.customDomain);
  } catch {
    // Column missing until migrate — slug hosts still work.
  }
  return map;
}

export async function readClientHubCustomDomain(
  control: PrismaClient,
  hubId: string
): Promise<string | null> {
  const setup = await readClientHubCustomDomainSetup(control, hubId);
  return setup?.host ?? (await readCustomDomainHostOnly(control, hubId));
}

async function readCustomDomainHostOnly(control: PrismaClient, hubId: string) {
  try {
    const rows = await control.$queryRaw<Array<{ customDomain: string | null }>>`
      SELECT "customDomain" FROM "ClientHub" WHERE id = ${hubId} LIMIT 1
    `;
    return rows[0]?.customDomain ?? null;
  } catch {
    return null;
  }
}

export async function readClientHubCustomDomainSetup(
  control: PrismaClient,
  hubId: string
): Promise<CustomDomainSetup | null> {
  try {
    const rows = await control.$queryRaw<Array<{ customDomain: string | null; customDomainSetup: unknown }>>`
      SELECT "customDomain", "customDomainSetup" FROM "ClientHub" WHERE id = ${hubId} LIMIT 1
    `;
    const parsed = parseCustomDomainSetup(rows[0]?.customDomainSetup);
    if (parsed) return parsed;
    const host = rows[0]?.customDomain ?? null;
    return host ? { host, railwayId: null, cnameHost: host, cnameTarget: null, txtHost: null, txtValue: null, certificateStatus: null, dnsStatus: null } : null;
  } catch {
    const host = await readCustomDomainHostOnly(control, hubId);
    return host
      ? {
          host,
          railwayId: null,
          cnameHost: host,
          cnameTarget: null,
          txtHost: null,
          txtValue: null,
          certificateStatus: null,
          dnsStatus: null,
        }
      : null;
  }
}
