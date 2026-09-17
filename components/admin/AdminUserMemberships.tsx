"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setUserNetworkTrack, toggleUserGroup } from "@/app/admin/users/actions";
import { setUserTagAdded } from "@/app/admin/tags/actions";
import {
  CN_TAG_NAME,
  MN_TAG_NAME,
  networkBadgeColor,
  tagsNotShownAsGroups,
  type NetworkTrack,
} from "@/lib/mnCnDisplay";
import UserBadgesEditor from "@/components/admin/UserBadgesEditor";

type GroupOption = { id: string; name: string; color: string };
type TagOption = { id: string; name: string; color: string };
type BadgeOption = { id: string; name: string; icon: string | null };

function isNetworkName(name: string) {
  const n = name.trim().toUpperCase();
  return n === CN_TAG_NAME || n === MN_TAG_NAME;
}

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

function currentTrack(groups: GroupOption[], tags: TagOption[]): NetworkTrack | null {
  const names = [
    ...groups.map((g) => g.name.trim().toUpperCase()),
    ...tags.map((t) => t.name.trim().toUpperCase()),
  ];
  if (names.includes(CN_TAG_NAME)) return "CN";
  if (names.includes(MN_TAG_NAME)) return "MN";
  return null;
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
  const [error, setError] = useState<string | null>(null);
  const [addTagId, setAddTagId] = useState("");
  const [addGroupId, setAddGroupId] = useState("");
  const track = currentTrack(groups, tags);
  const otherGroups = groups.filter((g) => !isNetworkName(g.name));
  const otherTags = tagsNotShownAsGroups(otherGroups, tags.filter((t) => !isNetworkName(t.name)));
  const editorGroups = allGroups.filter((g) => !isNetworkName(g.name));
  const editorTags = allTags.filter((t) => !isNetworkName(t.name));
  const unusedGroups = editorGroups.filter((g) => !otherGroups.some((m) => m.id === g.id));
  const unusedTags = editorTags.filter((t) => !otherTags.some((m) => m.id === t.id));

  function run(work: () => Promise<void>) {
    setError(null);
    startTransition(async () => {
      try {
        await work();
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn’t save. Try again.");
      }
    });
  }

  function removeGroup(groupId: string) {
    run(async () => {
      await toggleUserGroup(userId, groupId, false);
    });
  }

  function removeTag(tagId: string) {
    run(async () => {
      await setUserTagAdded(tagId, userId, false);
    });
  }

  function setTrack(next: NetworkTrack) {
    if (next === track) return;
    run(async () => {
      await setUserNetworkTrack(userId, next);
    });
  }

  function addTag() {
    if (!addTagId) return;
    const id = addTagId;
    setAddTagId("");
    run(async () => {
      await setUserTagAdded(id, userId, true);
    });
  }

  function addGroup() {
    if (!addGroupId) return;
    const id = addGroupId;
    setAddGroupId("");
    run(async () => {
      await toggleUserGroup(userId, id, true);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="font-body text-[11px] font-semibold uppercase tracking-wide text-off-white/40">
          Network track
        </p>
        <p className="mt-0.5 font-body text-xs text-off-white/45">
          CN is Forge Creator Network. MN is Media Network (agency / outside US-CA). Choosing one
          replaces the other.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => setTrack("CN")}
            className={`rounded-full border px-3 py-1 font-body text-xs font-semibold transition disabled:opacity-40 ${
              track === "CN"
                ? "border-orange bg-orange/20 text-orange"
                : "border-off-white/20 text-off-white/60 hover:border-orange/40 hover:text-orange"
            }`}
          >
            Creator Network (CN)
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => setTrack("MN")}
            className={`rounded-full border px-3 py-1 font-body text-xs font-semibold transition disabled:opacity-40 ${
              track === "MN"
                ? "border-cyan bg-cyan/20 text-cyan"
                : "border-off-white/20 text-off-white/60 hover:border-cyan/40 hover:text-cyan"
            }`}
          >
            Media Network (MN)
          </button>
        </div>
      </div>

      <div>
        <p className="font-body text-[11px] font-semibold uppercase tracking-wide text-off-white/40">
          Tags
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {otherTags.length === 0 && (
            <span className="font-body text-xs text-off-white/30">No tags yet</span>
          )}
          {otherTags.map((t) => (
            <Chip
              key={`t-${t.id}`}
              name={t.name}
              color={networkBadgeColor(t.name, t.color, effect)}
              disabled={pending}
              onRemove={() => removeTag(t.id)}
            />
          ))}
        </div>
        {unusedTags.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <select
              value={addTagId}
              disabled={pending}
              onChange={(e) => setAddTagId(e.target.value)}
              className="min-w-[12rem] rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-1.5 font-body text-xs text-off-white outline-none transition focus:border-cyan/60"
            >
              <option value="">Add a tag…</option>
              {unusedTags.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={pending || !addTagId}
              onClick={addTag}
              className="rounded-lg bg-orange px-3 py-1.5 font-body text-xs font-semibold text-off-white shadow-glow transition hover:brightness-110 disabled:opacity-40"
            >
              Add tag
            </button>
          </div>
        )}
      </div>

      <div>
        <p className="font-body text-[11px] font-semibold uppercase tracking-wide text-off-white/40">
          Groups
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {otherGroups.length === 0 && (
            <span className="font-body text-xs text-off-white/30">No groups yet</span>
          )}
          {otherGroups.map((g) => (
            <Chip
              key={`g-${g.id}`}
              name={g.name}
              color={networkBadgeColor(g.name, g.color, effect)}
              disabled={pending}
              onRemove={() => removeGroup(g.id)}
            />
          ))}
        </div>
        {unusedGroups.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <select
              value={addGroupId}
              disabled={pending}
              onChange={(e) => setAddGroupId(e.target.value)}
              className="min-w-[12rem] rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-1.5 font-body text-xs text-off-white outline-none transition focus:border-cyan/60"
            >
              <option value="">Add a group…</option>
              {unusedGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={pending || !addGroupId}
              onClick={addGroup}
              className="rounded-lg border border-cyan/40 px-3 py-1.5 font-body text-xs font-semibold text-cyan transition hover:bg-cyan/10 disabled:opacity-40"
            >
              Add group
            </button>
          </div>
        )}
      </div>

      <div>
        <p className="font-body text-[11px] font-semibold uppercase tracking-wide text-off-white/40">
          Badges
        </p>
        <div className="mt-2">
          <UserBadgesEditor userId={userId} allBadges={allBadges} memberBadgeIds={memberBadgeIds} />
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-orange/30 bg-orange/10 px-3 py-2 font-body text-xs text-orange">
          {error}
        </p>
      )}
    </div>
  );
}
