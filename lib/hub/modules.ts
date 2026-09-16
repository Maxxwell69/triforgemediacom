import "server-only";
import { cookies } from "next/headers";
import { ALL_SKU_IDS, isHubSkuId } from "./catalog";
import { clientSlugFromHeaders } from "@/lib/hub/requestHost";
import { getControlPrisma } from "@/lib/hub/tenantPrisma";
import { seedTenantDefaults } from "@/lib/hub/seedTenant";

/** Cookie set from /superadmin — this browser only. Does not change production. */
export const DRY_RUN_ENABLED_COOKIE = "tf_hub_dry_run_enabled";

const clientEnabledCache = new Map<string, Set<string>>();
const seededTenantSchemas = new Set<string>();

function parseSkuList(raw: string | undefined | null): Set<string> {
  const ids = new Set<string>();
  if (!raw?.trim()) return ids;
  for (const part of raw.split(",")) {
    const id = part.trim();
    if (id && isHubSkuId(id)) ids.add(id);
  }
  return ids;
}

function hiddenFromEnabled(enabled: Set<string>): Set<string> {
  const hidden = new Set<string>();
  for (const id of ALL_SKU_IDS) {
    if (id === "core") continue;
    if (!enabled.has(id)) hidden.add(id);
  }
  return hidden;
}

function hiddenFromEnv(): Set<string> {
  return parseSkuList(process.env.HUB_DRY_RUN_HIDE);
}

/**
 * Dry-run module gate (Hub 0 only).
 * 1. Super-admin preview cookie (this browser) if set
 * 2. Else HUB_DRY_RUN_HIDE env
 * 3. Else everything on (flagship default)
 */
export function getHiddenSkuIds(): Set<string> {
  try {
    const cookie = cookies().get(DRY_RUN_ENABLED_COOKIE)?.value;
    if (cookie != null && cookie !== "") {
      return hiddenFromEnabled(parseSkuList(cookie));
    }
  } catch {
    // No request context (scripts) — fall through to env.
  }
  return hiddenFromEnv();
}

export function getEnabledSkuIds(): Set<string> {
  const hidden = getHiddenSkuIds();
  return new Set(ALL_SKU_IDS.filter((id) => !hidden.has(id)));
}

/** Load this hub’s SKUs (and seed empty tenant rows) before hubHas() runs. */
export async function bindClientHubSkus() {
  const slug = clientSlugFromHeaders();
  if (!slug) return;

  const hub = await getControlPrisma().clientHub.findUnique({
    where: { slug },
    select: { enabledSkuIds: true, tenantDbName: true, tenantDbAt: true },
  });
  clientEnabledCache.set(slug, new Set<string>(["core", ...(hub?.enabledSkuIds ?? [])]));

  if (hub?.tenantDbName && hub.tenantDbAt && !seededTenantSchemas.has(hub.tenantDbName)) {
    await seedTenantDefaults(hub.tenantDbName).catch((err) =>
      console.error("tenant seed skipped", slug, err)
    );
    seededTenantSchemas.add(hub.tenantDbName);
  }
}

export function hubHas(sku: string): boolean {
  if (sku === "core") return true;
  const slug = clientSlugFromHeaders();
  if (slug) {
    const enabled = clientEnabledCache.get(slug);
    return enabled ? enabled.has(sku) : false;
  }
  return !getHiddenSkuIds().has(sku);
}
