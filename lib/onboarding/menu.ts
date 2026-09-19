/** Member sidebar items admins can allow during an in-progress onboarding path. */

export type MemberMenuItem = {
  id: string;
  label: string;
  prefixes: readonly string[];
  /** Always available so members can finish the checklist and manage their account. */
  always?: boolean;
};

export const ONBOARDING_ALWAYS_MENU_IDS = ["home", "account", "notifications", "hubs"] as const;

export const MEMBER_MENU_ITEMS: readonly MemberMenuItem[] = [
  { id: "home", label: "Dashboard", prefixes: ["/home"], always: true },
  { id: "account", label: "Account", prefixes: ["/account"], always: true },
  { id: "notifications", label: "Notifications", prefixes: ["/notifications"], always: true },
  { id: "hubs", label: "Hubs", prefixes: ["/hubs"], always: true },
  { id: "groups", label: "Groups", prefixes: ["/groups"] },
  { id: "chat", label: "Chat", prefixes: ["/channels", "/dms"] },
  { id: "live", label: "Live", prefixes: ["/live"] },
  { id: "streamingKit", label: "Streaming kit", prefixes: ["/streaming-kit"] },
  { id: "projects", label: "Projects", prefixes: ["/apps/projects"] },
  { id: "personalTasks", label: "My Tasks", prefixes: ["/apps/tasks"] },
  { id: "campaigns", label: "Campaigns", prefixes: ["/campaigns"] },
  { id: "calendar", label: "Calendar", prefixes: ["/calendar"] },
  { id: "members", label: "Members", prefixes: ["/members"] },
  { id: "progress", label: "Progress", prefixes: ["/progress"] },
  { id: "shop", label: "Shop", prefixes: ["/shop"] },
  { id: "rewards", label: "Rewards", prefixes: ["/rewards", "/leaderboard"] },
  { id: "learn", label: "Learn", prefixes: ["/learn"] },
  { id: "webinars", label: "Webinars", prefixes: ["/webinars"] },
  { id: "hubBug", label: "Hub Bug", prefixes: ["/bugs"] },
  { id: "support", label: "Support", prefixes: ["/support"] },
  { id: "suggestions", label: "Suggestions", prefixes: ["/suggestions"] },
  { id: "tiktask", label: "TikTask", prefixes: ["/apps/tiktask"] },
] as const;

export const MEMBER_MENU_IDS = new Set(MEMBER_MENU_ITEMS.map((item) => item.id));

export const SELECTABLE_MEMBER_MENU_ITEMS = MEMBER_MENU_ITEMS.filter((item) => !item.always);

function pathMatchesPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function menuIdForPath(pathname: string): string | null {
  for (const item of MEMBER_MENU_ITEMS) {
    if (item.prefixes.some((prefix) => pathMatchesPrefix(pathname, prefix))) {
      return item.id;
    }
  }
  return null;
}

export function isOnboardingMenuPathAllowed(
  pathname: string,
  allowedIds: ReadonlySet<string>,
  extraPrefixes: readonly string[] = []
): boolean {
  if (extraPrefixes.some((prefix) => pathMatchesPrefix(pathname, prefix))) {
    return true;
  }
  const id = menuIdForPath(pathname);
  if (!id) return false;
  return allowedIds.has(id);
}

export function canSeeOnboardingMenuItem(
  allowedIds: ReadonlySet<string> | null,
  id: string
): boolean {
  if (!allowedIds) return true;
  return allowedIds.has(id);
}
