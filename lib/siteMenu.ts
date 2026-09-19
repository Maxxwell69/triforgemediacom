import { prisma } from "@/lib/prisma";

export type SiteMenuKind = "builtin" | "custom";

export type SiteMenuItem = {
  id: string;
  kind: SiteMenuKind;
  enabled: boolean;
  label: string;
  href?: string;
  builtinId?: string;
};

export type BuiltinMenuDef = {
  id: string;
  label: string;
  href: string;
  sku?: string;
  /** Extra AppShell visibility gate beyond onboarding + SKU. */
  gate?: "projects" | "personalTasks" | "progress" | "tiktask" | "suggestions";
  accent?: "live" | "nested";
};

/** Built-in sidebar rows, in the current default order. */
export const BUILTIN_MENU: readonly BuiltinMenuDef[] = [
  { id: "groups", label: "Groups", href: "/groups" },
  { id: "home", label: "Dashboard", href: "/home" },
  { id: "live", label: "Live", href: "/live", sku: "tiktokInsights", accent: "live" },
  { id: "streamingKit", label: "Streaming kit", href: "/streaming-kit", sku: "streamingKit" },
  { id: "projects", label: "Projects", href: "/apps/projects", sku: "projects", gate: "projects" },
  { id: "personalTasks", label: "My Tasks", href: "/apps/tasks", sku: "personalTasks", gate: "personalTasks" },
  { id: "campaigns", label: "Campaigns", href: "/campaigns", sku: "hubCampaigns" },
  { id: "calendar", label: "Calendar", href: "/calendar", sku: "calendar" },
  { id: "members", label: "Members", href: "/members" },
  { id: "progress", label: "Progress", href: "/progress", gate: "progress" },
  { id: "shop", label: "Shop", href: "/shop", sku: "shop" },
  { id: "rewards", label: "Rewards", href: "/rewards", sku: "rewards" },
  { id: "learn", label: "Learn", href: "/learn", sku: "learning" },
  { id: "webinars", label: "Webinars", href: "/webinars", sku: "webinars" },
  { id: "hubBug", label: "Hub Bug", href: "/bugs", sku: "hubBug" },
  { id: "support", label: "Support", href: "/support", sku: "support" },
  { id: "suggestions", label: "Suggestions", href: "/suggestions", sku: "support", gate: "suggestions" },
  { id: "hubs", label: "Hubs", href: "/hubs" },
  { id: "account", label: "Account", href: "/account" },
  { id: "notifications", label: "Notifications", href: "/notifications" },
  { id: "tiktask", label: "TikTask", href: "/apps/tiktask", sku: "tiktask", gate: "tiktask", accent: "nested" },
];

export const BUILTIN_MENU_BY_ID = new Map(BUILTIN_MENU.map((item) => [item.id, item]));

export function defaultSiteMenuItems(): SiteMenuItem[] {
  return BUILTIN_MENU.map((item) => ({
    id: item.id,
    kind: "builtin",
    enabled: true,
    label: item.label,
    builtinId: item.id,
  }));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export function parseSiteMenuItems(raw: unknown): SiteMenuItem[] {
  if (!Array.isArray(raw)) return defaultSiteMenuItems();
  const items: SiteMenuItem[] = [];
  const seenBuiltin = new Set<string>();
  for (const row of raw) {
    if (!isRecord(row) || typeof row.id !== "string" || !row.id) continue;
    const kind = row.kind === "custom" ? "custom" : "builtin";
    const builtinId = typeof row.builtinId === "string" ? row.builtinId : kind === "builtin" ? row.id : undefined;
    if (kind === "builtin") {
      if (!builtinId || !BUILTIN_MENU_BY_ID.has(builtinId) || seenBuiltin.has(builtinId)) continue;
      seenBuiltin.add(builtinId);
      const def = BUILTIN_MENU_BY_ID.get(builtinId)!;
      items.push({
        id: builtinId,
        kind: "builtin",
        enabled: row.enabled !== false,
        label: typeof row.label === "string" && row.label.trim() ? row.label.trim() : def.label,
        builtinId,
      });
      continue;
    }
    const href = typeof row.href === "string" ? sanitizeMenuHref(row.href) : null;
    const label = typeof row.label === "string" ? row.label.trim() : "";
    if (!href || !label) continue;
    items.push({
      id: row.id,
      kind: "custom",
      enabled: row.enabled !== false,
      label,
      href,
    });
  }
  for (const def of BUILTIN_MENU) {
    if (seenBuiltin.has(def.id)) continue;
    items.push({
      id: def.id,
      kind: "builtin",
      enabled: true,
      label: def.label,
      builtinId: def.id,
    });
  }
  return items;
}

/** Safe internal path or https URL. Rejects // and javascript: */
export function sanitizeMenuHref(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  if (value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\")) {
    return value.slice(0, 300);
  }
  try {
    const url = new URL(value);
    if (url.protocol === "https:" || url.protocol === "http:") {
      return url.toString().slice(0, 500);
    }
  } catch {
    return null;
  }
  return null;
}

export function isExternalMenuHref(href: string) {
  return href.startsWith("http://") || href.startsWith("https://");
}

export async function getSiteMenuItems(): Promise<SiteMenuItem[]> {
  try {
    const rows = await prisma.$queryRawUnsafe<Array<{ items: unknown }>>(
      `SELECT items FROM "SiteMenuSettings" WHERE id = 'global' LIMIT 1`
    );
    if (!rows[0]) return defaultSiteMenuItems();
    return parseSiteMenuItems(rows[0].items);
  } catch (err) {
    console.error("getSiteMenuItems failed", err);
    return defaultSiteMenuItems();
  }
}

export async function saveSiteMenuItems(items: SiteMenuItem[]) {
  const parsed = parseSiteMenuItems(items);
  const json = JSON.stringify(parsed);
  await prisma.$executeRawUnsafe(
    `INSERT INTO "SiteMenuSettings" (id, items, "updatedAt")
     VALUES ('global', $1::jsonb, NOW())
     ON CONFLICT (id) DO UPDATE SET items = EXCLUDED.items, "updatedAt" = NOW()`,
    json
  );
  return parsed;
}

export function customMenuPrefixes(items: SiteMenuItem[]): string[] {
  return items
    .filter((item) => item.kind === "custom" && item.enabled && item.href?.startsWith("/"))
    .map((item) => item.href as string);
}
