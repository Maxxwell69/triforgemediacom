import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { getUserPointsTotal } from "@/lib/points";
import { PLATFORM_LABELS } from "@/lib/platforms";
import { getTikTokEmbedHtml } from "@/lib/tiktokEmbed";
import { getMemberDisplayName, getMemberAvatarUrl, getMemberInitial } from "@/lib/memberDisplay";
import { isExpiredSignedAvatarUrl } from "@/lib/tiktokAvatar";
import { refreshTikTokStatsSnapshot } from "@/lib/tiktokStats";
import { networkBadgeColor } from "@/lib/mnCn";
import { isOnline } from "@/lib/presence";
import { isAdminRole } from "@/lib/rbac";
import ShareButton from "@/components/ShareButton";
import TikTokEmbed from "@/components/TikTokEmbed";
import MemberAvatar from "@/components/MemberAvatar";
import TikTokStatsCard from "@/components/TikTokStatsCard";
import EffectCheckbox from "@/components/admin/EffectCheckbox";

export const dynamic = "force-dynamic";

const SOCIAL_LINK_META: Record<string, { label: string; icon: string }> = {
  tiktok: { label: "TikTok", icon: "🎵" },
  twitch: { label: "Twitch", icon: "🎮" },
  youtube: { label: "YouTube", icon: "▶️" },
};

function profileShareUrl(userId: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${base}/members/${userId}`;
}

function tiktokHandle(url: string): string | null {
  const match = url.match(/@([\w.-]+)/);
  return match ? `@${match[1]}` : null;
}

export default async function MemberProfilePage({
  params,
}: {
  params: { userId: string };
}) {
  const { user: viewer } = await requireProfile();
  const isAdmin = isAdminRole(viewer.role);

  let member = await prisma.user.findFirst({
    where: {
      id: params.userId,
      status: "ACTIVE",
      profile: { isNot: null },
      // Admins can open hidden profiles to manage Effect / review.
      ...(isAdmin ? {} : { hiddenFromDirectory: false }),
    },
    include: {
      profile: true,
      groupMemberships: { include: { group: true } },
      tiktokConnection: true,
      tiktokStatsSnapshot: true,
      tags: { include: { tag: true } },
    },
  });
  if (!member || !member.profile) notFound();

  // TikTok CDN avatar URLs expire; refresh + mirror to R2 when the signed link is stale.
  const staleAvatar =
    isExpiredSignedAvatarUrl(member.tiktokStatsSnapshot?.avatarUrl) ||
    isExpiredSignedAvatarUrl(member.tiktokConnection?.avatarUrl);
  if (staleAvatar) {
    await refreshTikTokStatsSnapshot(member.id, { force: true }).catch(() => null);
    const refreshed = await prisma.user.findFirst({
      where: { id: member.id },
      include: {
        profile: true,
        groupMemberships: { include: { group: true } },
        tiktokConnection: true,
        tiktokStatsSnapshot: true,
        tags: { include: { tag: true } },
      },
    });
    if (refreshed?.profile) member = refreshed;
  }

  const profile = member.profile;
  if (!profile) notFound();

  const points = await getUserPointsTotal(member.id);
  const displayName = getMemberDisplayName(member);
  const avatarUrl = getMemberAvatarUrl(member);
  const initial = getMemberInitial(member);
  const online = isOnline(member.lastSeenAt);
  const groups = member.groupMemberships.map((m) => m.group);
  const tags = member.tags.map((ut) => ut.tag);
  const socialLinks = (profile.socialLinks as Record<string, string> | null) ?? {};
  const socialEntries = Object.entries(socialLinks).filter(([key, url]) => !!url && key !== "tiktok");
  const tiktokUrl = socialLinks.tiktok || null;
  const pinnedVideoUrl = profile.pinnedTiktokVideoUrl || null;
  const tiktokEmbedHtml = pinnedVideoUrl ? await getTikTokEmbedHtml(pinnedVideoUrl) : null;

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/members"
          className="font-body text-sm text-off-white/50 transition hover:text-off-white"
        >
          &larr; All members
        </Link>

        <div className="glass mt-4 flex flex-col gap-5 rounded-2xl p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <MemberAvatar
                avatarUrl={avatarUrl}
                initial={initial}
                size={64}
                textSize="text-2xl"
                online={online}
              />
              <div>
                <p className="flex items-center gap-2 font-display text-2xl tracking-wide text-off-white">
                  {displayName}
                  {online && (
                    <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 font-body text-[10px] font-semibold uppercase tracking-wide text-emerald-400">
                      Online
                    </span>
                  )}
                </p>
                {profile.platform && (
                  <span className="mt-1 inline-block rounded-full border border-cyan/30 px-2 py-0.5 font-body text-xs text-cyan">
                    {PLATFORM_LABELS[profile.platform]}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {isAdmin && <EffectCheckbox userId={member.id} effect={member.effect} />}
              <ShareButton
                title={displayName}
                text={`Check out ${displayName} on TriForge Media.`}
                url={profileShareUrl(member.id)}
                label="Share profile"
              />
            </div>
          </div>

          {profile.bio && (
            <p className="font-body text-sm leading-relaxed text-off-white/70">
              {profile.bio}
            </p>
          )}

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
                    title={tag.description ?? undefined}
                    className="rounded-full border px-2 py-0.5 font-body text-xs font-medium"
                    style={{ borderColor: `${color}66`, color }}
                  >
                    {tag.name}
                  </span>
                );
              })}
            </div>
          )}

          <p className="font-body text-sm text-off-white/50">{points} points</p>

          {tiktokUrl && (
            <div className="rounded-2xl border border-off-white/10 bg-gradient-to-br from-off-white/[0.04] to-transparent p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <a
                  href={tiktokUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 transition hover:text-cyan"
                >
                  <span className="text-2xl" aria-hidden="true">
                    🎵
                  </span>
                  <div>
                    <p className="font-body text-sm font-semibold text-off-white">TikTok</p>
                    <p className="font-body text-xs text-off-white/50">
                      {tiktokHandle(tiktokUrl) ?? "View profile"}
                    </p>
                  </div>
                </a>
                <div className="flex items-center gap-2">
                  <a
                    href={tiktokUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-cyan/40 px-3 py-1.5 font-body text-xs font-semibold text-cyan transition hover:bg-cyan/10"
                  >
                    Visit profile
                  </a>
                  <ShareButton
                    title={`${displayName} on TikTok`}
                    url={tiktokUrl}
                    label="Share"
                    className="rounded-lg border border-off-white/15 px-2.5 py-1.5 font-body text-xs text-off-white/60 transition hover:border-cyan/40 hover:text-cyan"
                  />
                </div>
              </div>

              {member.tiktokStatsSnapshot && (
                <div className="mt-4">
                  <TikTokStatsCard stats={member.tiktokStatsSnapshot} />
                </div>
              )}

              {tiktokEmbedHtml ? (
                <div className="mt-4">
                  <TikTokEmbed html={tiktokEmbedHtml} />
                </div>
              ) : pinnedVideoUrl ? (
                <p className="mt-4 font-body text-xs text-off-white/40">
                  Couldn&apos;t load the featured video —{" "}
                  <a href={pinnedVideoUrl} target="_blank" rel="noopener noreferrer" className="text-cyan underline">
                    watch it on TikTok
                  </a>
                  .
                </p>
              ) : null}
            </div>
          )}

          {socialEntries.length > 0 && (
            <div className="border-t border-off-white/10 pt-5">
              <p className="mb-3 font-body text-xs font-semibold uppercase tracking-wide text-off-white/40">
                Socials
              </p>
              <div className="flex flex-col gap-2">
                {socialEntries.map(([key, url]) => {
                  const meta = SOCIAL_LINK_META[key] ?? { label: key, icon: "🔗" };
                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between gap-3 rounded-lg border border-off-white/10 px-4 py-2.5"
                    >
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex min-w-0 items-center gap-2 font-body text-sm text-off-white/80 transition hover:text-cyan"
                      >
                        <span aria-hidden="true">{meta.icon}</span>
                        <span className="truncate">{meta.label}</span>
                      </a>
                      <ShareButton
                        title={`${displayName} on ${meta.label}`}
                        url={url}
                        label="Share"
                        className="shrink-0 rounded-lg border border-off-white/15 px-2.5 py-1 font-body text-xs text-off-white/60 transition hover:border-cyan/40 hover:text-cyan"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
