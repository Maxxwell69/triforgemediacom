import "server-only";
import { cookies } from "next/headers";
import { ALL_SKU_IDS, isHubSkuId } from "./catalog";

/** Cookie set from /superadmin — this browser only. Does not change production. */
export const DRY_RUN_ENABLED_COOKIE = "tf_hub_dry_run_enabled";

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
 * Dry-run module gate.
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

export function hubHas(sku: string): boolean {
  if (sku === "core") return true;
  return !getHiddenSkuIds().has(sku);
}
