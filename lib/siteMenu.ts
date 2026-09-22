export type SiteMenuKind = "builtin" | "custom";

export type SiteMenuItem = {
  id: string;
  kind: SiteMenuKind;
  enabled: boolean;
  label: string;
  href?: string;
  builtinId?: string;
  /** One-level nest: this row sits under another lineup item. */
  parentId?: string;
  /** Custom links only. When omitted, http(s) URLs open in a new tab. */
  newTab?: boolean;
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
  { id: "streamingKit", label: "Branding kit", href: "/streaming-kit", sku: "streamingKit" },
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
      const storedLabel = typeof row.label === "string" ? row.label.trim() : "";
      const renamedDefaults: Record<string, string[]> = {
        streamingKit: ["Streaming kit", "Streaming Kit"],
      };
      const keepStored =
        storedLabel &&
        storedLabel !== def.label &&
        !(renamedDefaults[builtinId] ?? []).includes(storedLabel);
      items.push({
        id: builtinId,
        kind: "builtin",
        enabled: row.enabled !== false,
        label: keepStored ? storedLabel : def.label,
        builtinId,
        parentId: readParentId(row),
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
      parentId: readParentId(row),
      newTab: typeof row.newTab === "boolean" ? row.newTab : isExternalMenuHref(href),
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
  return normalizeMenuTree(items);
}

function readParentId(row: Record<string, unknown>): string | undefined {
  return typeof row.parentId === "string" && row.parentId ? row.parentId : undefined;
}

export function menuRoots(items: SiteMenuItem[]): SiteMenuItem[] {
  return items.filter((item) => !item.parentId);
}

export function menuChildren(items: SiteMenuItem[], parentId: string): SiteMenuItem[] {
  return items.filter((item) => item.parentId === parentId);
}

export function rebuildMenuOrder(items: SiteMenuItem[]): SiteMenuItem[] {
  return menuRoots(items).flatMap((root) => [root, ...menuChildren(items, root.id)]);
}

/** One level only: parent must exist and must itself be top-level. */
export function normalizeMenuTree(items: SiteMenuItem[]): SiteMenuItem[] {
  const ids = new Set(items.map((item) => item.id));
  const next = items.map((item) => {
    const parentId = item.parentId;
    if (!parentId || parentId === item.id || !ids.has(parentId)) {
      if (!item.parentId && item.newTab === undefined) return item;
      const copy = { ...item };
      delete copy.parentId;
      return copy;
    }
    return item;
  });
  const byId = new Map(next.map((item) => [item.id, item]));
  return rebuildMenuOrder(
    next.map((item) => {
      if (!item.parentId) return item;
      const parent = byId.get(item.parentId);
      if (!parent || parent.parentId) {
        const copy = { ...item };
        delete copy.parentId;
        return copy;
      }
      return item;
    })
  );
}

export function setMenuParent(
  items: SiteMenuItem[],
  id: string,
  parentId: string | undefined
): SiteMenuItem[] {
  const safeParent =
    parentId && parentId !== id && items.some((item) => item.id === parentId && !item.parentId)
      ? parentId
      : undefined;
  return normalizeMenuTree(
    items.map((item) => {
      if (item.id === id) {
        const copy = { ...item, parentId: safeParent };
        if (!safeParent) delete copy.parentId;
        return copy;
      }
      if (safeParent && item.parentId === id) {
        return { ...item, parentId: safeParent };
      }
      return item;
    })
  );
}

export function moveMenuSibling(items: SiteMenuItem[], id: string, dir: -1 | 1): SiteMenuItem[] {
  const current = items.find((item) => item.id === id);
  if (!current) return items;
  const siblings = current.parentId
    ? menuChildren(items, current.parentId)
    : menuRoots(items);
  const index = siblings.findIndex((item) => item.id === id);
  const swap = siblings[index + dir];
  if (!swap) return items;
  const nextSiblings = [...siblings];
  nextSiblings[index] = swap;
  nextSiblings[index + dir] = current;
  if (current.parentId) {
    const copy = [...items];
    const a = copy.findIndex((item) => item.id === current.id);
    const b = copy.findIndex((item) => item.id === swap.id);
    copy[a] = swap;
    copy[b] = current;
    return rebuildMenuOrder(copy);
  }
  return rebuildMenuOrder(
    nextSiblings.flatMap((root) => [root, ...menuChildren(items, root.id)])
  );
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

export function customMenuPrefixes(items: SiteMenuItem[]): string[] {
  return items
    .filter((item) => item.kind === "custom" && item.enabled && item.href?.startsWith("/"))
    .map((item) => item.href as string);
}
