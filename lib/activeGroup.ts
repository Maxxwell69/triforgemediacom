export const ACTIVE_GROUP_COOKIE = "tf_active_group";

export type ChannelWithGroups = {
  id: string;
  name: string;
  groups: { id: string; isHome: boolean }[];
};

/** Prefer cookie if valid membership; otherwise Home. */
export function resolveActiveGroupId(
  cookieValue: string | undefined,
  memberGroupIds: string[],
  homeGroupId: string | null
): string | null {
  if (cookieValue && memberGroupIds.includes(cookieValue)) {
    return cookieValue;
  }
  return homeGroupId;
}

/**
 * Channels for the selected space.
 * Home also includes legacy ungrouped channels.
 */
export function filterChannelsForActiveGroup<T extends ChannelWithGroups>(
  channels: T[],
  activeGroupId: string | null,
  homeGroupId: string | null
): T[] {
  if (!activeGroupId) return channels;

  const isHome = Boolean(homeGroupId && activeGroupId === homeGroupId);

  return channels.filter((c) => {
    if (c.groups.some((g) => g.id === activeGroupId)) return true;
    if (isHome && c.groups.length === 0) return true;
    return false;
  });
}
