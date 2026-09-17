"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleUserGroup } from "@/app/admin/users/actions";
import { setUserTagAdded } from "@/app/admin/tags/actions";
import { networkBadgeColor, tagsNotShownAsGroups } from "@/lib/mnCn";
import UserGroupsEditor from "@/components/admin/UserGroupsEditor";
import UserTagsEditor from "@/components/admin/UserTagsEditor";
import UserBadgesEditor from "@/components/admin/UserBadgesEditor";

type GroupOption = { id: string; name: string; color: string };
type TagOption = { id: string; name: string; color: string };
type BadgeOption = { id: string; name: string; icon: string | null };

function Chip({
  name,
  color,
  disabled,
  onRemove,
}: {
  name: string;
  color: string;
  disabled: boolean;
  onRemove: () => void;
}) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border py-0.5 pl-2 pr-1 font-body text-xs"
      style={{ borderColor: `${color}66`, color }}
    >
      {name}
      <button
        type="button"
        disabled={disabled}
        onClick={onRemove}
        aria-label={`Remove ${name}`}
        title={`Remove ${name}`}
        className="rounded-full px-1 text-[11px] leading-none text-current/70 transition hover:bg-off-white/10 hover:text-current disabled:opacity-40"
      >
        ×
      </button>
    </span>
  );
}

export default function AdminUserMemberships({
  userId,
  groups,
  tags,
  allGroups,
  allTags,
  allBadges,
  memberBadgeIds,
  effect,
}: {
  userId: string;
  groups: GroupOption[];
  tags: TagOption[];
  allGroups: GroupOption[];
  allTags: TagOption[];
  allBadges: BadgeOption[];
  memberBadgeIds: string[];
  effect: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const visibleTags = tagsNotShownAsGroups(groups, tags);

  function removeGroup(groupId: string) {
    startTransition(async () => {
      await toggleUserGroup(userId, groupId, false);
      router.refresh();
    });
  }

  function removeTag(tagId: string) {
    startTransition(async () => {
      await setUserTagAdded(tagId, userId, false);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {groups.length === 0 && visibleTags.length === 0 && (
        <span className="font-body text-xs text-off-white/30">No groups or tags</span>
      )}
      {groups.map((g) => (
        <Chip
          key={`g-${g.id}`}
          name={g.name}
          color={networkBadgeColor(g.name, g.color, effect)}
          disabled={pending}
          onRemove={() => removeGroup(g.id)}
        />
      ))}
      {visibleTags.map((t) => (
        <Chip
          key={`t-${t.id}`}
          name={t.name}
          color={networkBadgeColor(t.name, t.color, effect)}
          disabled={pending}
          onRemove={() => removeTag(t.id)}
        />
      ))}
      <UserGroupsEditor
        userId={userId}
        allGroups={allGroups}
        memberGroupIds={groups.map((g) => g.id)}
      />
      <UserTagsEditor userId={userId} allTags={allTags} memberTagIds={tags.map((t) => t.id)} />
      <UserBadgesEditor userId={userId} allBadges={allBadges} memberBadgeIds={memberBadgeIds} />
    </div>
  );
}
