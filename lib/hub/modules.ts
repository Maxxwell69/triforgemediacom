import "server-only";
import { ALL_SKU_IDS, isHubSkuId } from "./catalog";

/**
 * Dry-run module gate.
 *
 * Default: every SKU is on (flagship Hub 0 looks identical to today).
 * Staging can hide SKUs with HUB_DRY_RUN_HIDE=tiktokInsights,ghlImport
 * (comma-separated catalog ids). Never set this on production.
 */
export function getHiddenSkuIds(): Set<string> {
  const raw = process.env.HUB_DRY_RUN_HIDE?.trim();
  if (!raw) return new Set();

  const hidden = new Set<string>();
  for (const part of raw.split(",")) {
    const id = part.trim();
    if (id && isHubSkuId(id)) hidden.add(id);
  }
  return hidden;
}

export function getEnabledSkuIds(): Set<string> {
  const hidden = getHiddenSkuIds();
  return new Set(ALL_SKU_IDS.filter((id) => !hidden.has(id)));
}

/** Core is always enabled. Optional/flagship SKUs can be hidden in dry-run. */
export function hubHas(sku: string): boolean {
  if (sku === "core") return true;
  return !getHiddenSkuIds().has(sku);
}
