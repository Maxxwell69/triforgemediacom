import {
  CN_TAG_NAME,
  MN_TAG_NAME,
  networkBadgeColor,
  tagsNotShownAsGroups,
} from "@/lib/mnCnDisplay";

type Option = { id: string; name: string; color: string };

function isNetworkName(name: string) {
  const n = name.trim().toUpperCase();
  return n === CN_TAG_NAME || n === MN_TAG_NAME;
}

export default function AdminUserMembershipPills({
  groups,
  tags,
  effect,
}: {
  groups: Option[];
  tags: Option[];
  effect: boolean;
}) {
  const names = [
    ...groups.map((g) => g.name.trim().toUpperCase()),
    ...tags.map((t) => t.name.trim().toUpperCase()),
  ];
  const track = names.includes(CN_TAG_NAME) ? "CN" : names.includes(MN_TAG_NAME) ? "MN" : null;
  const otherGroups = groups.filter((g) => !isNetworkName(g.name));
  const otherTags = tagsNotShownAsGroups(
    otherGroups,
    tags.filter((t) => !isNetworkName(t.name))
  );
  const chips = [
    ...(track
      ? [
          {
            key: `track-${track}`,
            name: track,
            color: networkBadgeColor(track, track === "CN" ? "#FD4802" : "#00D4FF", effect),
          },
        ]
      : []),
    ...otherTags.map((t) => ({
      key: `t-${t.id}`,
      name: t.name,
      color: networkBadgeColor(t.name, t.color, effect),
    })),
    ...otherGroups.map((g) => ({
      key: `g-${g.id}`,
      name: g.name,
      color: networkBadgeColor(g.name, g.color, effect),
    })),
  ];

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {chips.length === 0 ? (
        <span className="font-body text-xs text-off-white/30">No tags or groups</span>
      ) : (
        chips.map((chip) => (
          <span
            key={chip.key}
            className="inline-flex items-center rounded-full border px-2 py-0.5 font-body text-xs"
            style={{ borderColor: `${chip.color}66`, color: chip.color }}
          >
            {chip.name}
          </span>
        ))
      )}
    </div>
  );
}
