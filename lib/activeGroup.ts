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

/** Best group to sync when opening a channel. */
export function inferGroupIdForChannel(
  channelGroups: { id: string; isHome: boolean }[],
  currentActiveId: string | null,
  homeGroupId: string | null
): string | null {
  if (channelGroups.length === 0) return homeGroupId;
  if (currentActiveId && channelGroups.some((g) => g.id === currentActiveId)) {
    return currentActiveId;
  }
  const nonHome = channelGroups.find((g) => !g.isHome);
  if (nonHome) return nonHome.id;
  return channelGroups[0]?.id ?? homeGroupId;
}
