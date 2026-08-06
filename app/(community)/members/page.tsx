import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { getUserPointsTotals } from "@/lib/points";
import { backfillNetworkMemberships, networkBadgeColor } from "@/lib/mnCn";
import { ensureLiveTag, LIVE_STALE_MS } from "@/lib/tiktokLive";
import { parseTikTokUniqueId } from "@/lib/tiktools";
import { PLATFORM_LABELS } from "@/lib/platforms";
import { getMemberDisplayName, getMemberAvatarUrl, getMemberInitial } from "@/lib/memberDisplay";
import { isOnline } from "@/lib/presence";
import { isAdminRole } from "@/lib/rbac";
import MemberAvatar from "@/components/MemberAvatar";

export const dynamic = "force-dynamic";

function tagFilterWhere(tag: { id: string; name: string }): Prisma.UserWhereInput {
  const network = tag.name.toUpperCase();
  // CN/MN show on profiles as group pills and/or tags. Match either, plus the
  // application track, so the filter agrees with what members see on cards.
  if (network === "CN" || network === "MN") {
    return {
      OR: [
        { tags: { some: { tagId: tag.id } } },
        {
          groupMemberships: {
            some: { group: { name: { equals: network, mode: "insensitive" } } },
          },
        },
        { application: { is: { answers: { path: ["track"], equals: network } } } },
      ],
    };
  }
  return { tags: { some: { tagId: tag.id } } };
}

function membersHref(opts: { tag?: string | null; effect?: boolean }) {
  const params = new URLSearchParams();
  if (opts.tag) params.set("tag", opts.tag);
  if (opts.effect) params.set("effect", "1");
  const qs = params.toString();
  return qs ? `/members?${qs}` : "/members";
}

export default async function MembersPage({
  searchParams,
}: {
  searchParams?: { tag?: string; effect?: string };
}) {
  const { user: viewer } = await requireProfile();
  const isAdmin = isAdminRole(viewer.role);
  const effectFilter = searchParams?.effect === "1" || searchParams?.effect === "true";

  // Keep CN/MN tag+group in sync so chips and profile badges stay aligned.
  await backfillNetworkMemberships();
  await ensureLiveTag();

  const activeTagParam = searchParams?.tag;
  const allTags = await prisma.tag.findMany({ orderBy: { name: "asc" } });
  const activeTag = activeTagParam
    ? allTags.find(
        (t) =>
          t.id === activeTagParam ||
          t.name.toLowerCase() === activeTagParam.toLowerCase()
      ) ?? null
    : null;

  const members = await prisma.user.findMany({
    where: {
      status: "ACTIVE",
      profile: { isNot: null },
      hiddenFromDirectory: false,
      ...(activeTag ? tagFilterWhere(activeTag) : {}),
      ...(effectFilter ? { effect: true } : {}),
    },
    include: {
      profile: true,
      groupMemberships: { include: { group: true } },
      tiktokConnection: true,
      tiktokStatsSnapshot: true,
      tags: { include: { tag: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const pointsTotals = await getUserPointsTotals(members.map((m) => m.id));

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="font-display text-5xl tracking-wide">
          THE <span className="text-gradient">COMMUNITY</span>
        </h1>
        <p className="mt-2 font-body text-off-white/60">
          {members.length} active member{members.length === 1 ? "" : "s"}
          {effectFilter ? " · Effect" : ""}
        </p>

        {(allTags.length > 0 || isAdmin) && (
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href={membersHref({ effect: effectFilter })}
              className={`rounded-full border px-3 py-1.5 font-body text-xs font-semibold transition ${
                !activeTag
                  ? "border-off-white/40 bg-off-white/10 text-off-white"
                  : "border-off-white/15 text-off-white/50 hover:border-off-white/30 hover:text-off-white/80"
              }`}
            >
              All
            </Link>
            {allTags.map((tag) => {
              const active = activeTag?.id === tag.id;
              return (
                <Link
                  key={tag.id}
                  href={membersHref({ tag: tag.id, effect: effectFilter })}
                  className="rounded-full border px-3 py-1.5 font-body text-xs font-semibold transition"
                  style={
                    active
                      ? { borderColor: tag.color, color: "#0A0A0A", backgroundColor: tag.color }
                      : { borderColor: `${tag.color}66`, color: tag.color }
                  }
                >
                  {tag.name}
                </Link>
              );
            })}
            {isAdmin && (
              <Link
                href={membersHref({
                  tag: activeTag?.id ?? null,
                  effect: !effectFilter,
                })}
                className={`rounded-full border px-3 py-1.5 font-body text-xs font-semibold transition ${
                  effectFilter
                    ? "border-emerald-400 bg-emerald-400/20 text-emerald-400"
                    : "border-off-white/15 text-off-white/50 hover:border-off-white/30 hover:text-off-white/80"
                }`}
              >
                Effect
              </Link>
            )}
          </div>
        )}

        {members.length === 0 && (
          <p className="glass mt-8 rounded-2xl p-8 text-center font-body text-off-white/50">
            No members with this tag yet.
          </p>
        )}

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => {
            const displayName = getMemberDisplayName(member);
            const avatarUrl = getMemberAvatarUrl(member);
            const initial = getMemberInitial(member);
            const groups = member.groupMemberships.map((m) => m.group);
            const tags = member.tags.map((ut) => ut.tag);
            const platform = member.profile?.platform;
            const online = isOnline(member.lastSeenAt);
            const snap = member.tiktokStatsSnapshot;
            const isLive =
              !!snap?.isLive &&
              !!snap.liveCheckedAt &&
              Date.now() - snap.liveCheckedAt.getTime() <= LIVE_STALE_MS;
            const tiktokHandle =
              member.tiktokStatsSnapshot?.uniqueId ||
              parseTikTokUniqueId(
                ((member.profile?.socialLinks as Record<string, string> | null) ?? {}).tiktok
              );

            return (
              <Link
                key={member.id}
                href={`/members/${member.id}`}
                className={`glass flex flex-col gap-3 rounded-2xl p-5 transition hover:border-cyan/40 ${
                  isLive ? "border border-orange/35" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <MemberAvatar avatarUrl={avatarUrl} initial={initial} size={44} online={online} />
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 truncate font-body font-medium text-off-white">
                      {online && (
                        <span
                          className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400"
                          title="Online"
                          aria-hidden
                        />
                      )}
                      {displayName}
                      {isLive && (
                        <span className="shrink-0 rounded bg-orange/20 px-1.5 py-0.5 font-body text-[10px] font-semibold uppercase tracking-wide text-orange">
                          Live
                        </span>
                      )}
                    </p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                      {tiktokHandle && (
                        <span className="font-body text-xs text-off-white/45">@{tiktokHandle}</span>
                      )}
                      {platform && (
                        <span className="inline-block rounded-full border border-cyan/30 px-2 py-0.5 font-body text-xs text-cyan">
                          {PLATFORM_LABELS[platform]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {groups.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {groups.map((g) => {
                      const color = networkBadgeColor(g.name, g.color, member.effect);
                      return (
                        <span
                          key={g.id}
                          className="rounded-full border px-2 py-0.5 font-body text-xs"
                          style={{ borderColor: `${color}66`, color }}
                        >
                          {g.name}
                        </span>
                      );
                    })}
                  </div>
                )}

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag) => {
                      const color = networkBadgeColor(tag.name, tag.color, member.effect);
                      return (
                        <span
                          key={tag.id}
                          className="rounded-full border px-2 py-0.5 font-body text-xs font-medium"
                          style={{ borderColor: `${color}66`, color }}
                        >
                          {tag.name}
                        </span>
                      );
                    })}
                  </div>
                )}

                <p className="font-body text-sm text-off-white/50">
                  {pointsTotals[member.id] ?? 0} points
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
