/** Client-safe CN/MN display helpers — no Prisma. */

export const MN_GROUP_NAME = "MN";
export const MN_TAG_NAME = "MN";
export const CN_GROUP_NAME = "CN";
export const CN_TAG_NAME = "CN";

/** Green used for CN badges when a user's admin "Effect" flag is on. */
export const CN_EFFECT_COLOR = "#22C55E";

export type NetworkTrack = "CN" | "MN";

/** CN pill/text color — green when Effect is enabled, otherwise the stored tag/group color. */
export function networkBadgeColor(
  name: string,
  baseColor: string,
  effectEnabled: boolean
): string {
  if (effectEnabled && name.toUpperCase() === CN_TAG_NAME) {
    return CN_EFFECT_COLOR;
  }
  return baseColor;
}

/**
 * CN/MN (and any other mirrored group+tag) are stored twice so filters work,
 * but member profiles should only show one pill. Keep the group; drop tags
 * whose name already matches a group.
 */
export function tagsNotShownAsGroups<T extends { name: string }>(
  groups: { name: string }[],
  tags: T[]
): T[] {
  const groupNames = new Set(groups.map((g) => g.name.trim().toUpperCase()));
  return tags.filter((t) => !groupNames.has(t.name.trim().toUpperCase()));
}
