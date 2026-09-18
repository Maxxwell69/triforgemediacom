import "server-only";

import type { PrismaClient } from "@prisma/client";
import {
  CLIENT_HUB_SUFFIX,
  HUB0_HOST,
  isPlatformHubHost,
  stripPort,
} from "@/lib/hub/host";

const HOST_RE = /^(?=.{1,253}$)(?!-)[a-z0-9-]+(\.[a-z0-9-]+)+$/;

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
  slugByHost.set(stripPort(hostname), slug);
}

export function peekHostSlug(hostname: string): string | null | undefined {
  return slugByHost.get(stripPort(hostname));
}

export async function findSlugByCustomDomain(
  control: PrismaClient,
  hostname: string
): Promise<string | null> {
  const host = stripPort(hostname);
  if (!host) return null;
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
  host: string | null
) {
  if (host == null) {
    await control.$executeRawUnsafe(`UPDATE "ClientHub" SET "customDomain" = NULL WHERE id = $1`, hubId);
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
    `UPDATE "ClientHub" SET "customDomain" = $1 WHERE id = $2`,
    host,
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
  try {
    const rows = await control.$queryRaw<Array<{ customDomain: string | null }>>`
      SELECT "customDomain" FROM "ClientHub" WHERE id = ${hubId} LIMIT 1
    `;
    return rows[0]?.customDomain ?? null;
  } catch {
    return null;
  }
}
