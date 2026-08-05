import type { ReactNode } from "react";
import { formatCount } from "@/lib/formatCount";
import MemberAvatar from "@/components/MemberAvatar";

export type TikTokStatsCardData = {
  uniqueId: string;
  nickname: string | null;
  avatarUrl: string | null;
  verified: boolean;
  followerCount: number;
  heartCount: number;
  videoCount: number;
  isLive: boolean;
  liveTitle: string | null;
  liveViewerCount: number | null;
  statsFetchedAt: Date | null;
  liveCheckedAt: Date | null;
};

export default function TikTokStatsCard({
  stats,
  actions,
}: {
  stats: TikTokStatsCardData;
  actions?: ReactNode;
}) {
  const updatedAt = stats.statsFetchedAt ?? stats.liveCheckedAt;

  return (
    <div className="glass flex flex-col gap-4 rounded-2xl p-6">
      <div className="flex items-center gap-3">
        <MemberAvatar
          avatarUrl={stats.avatarUrl}
          initial={(stats.nickname || stats.uniqueId).replace(/^@/, "").charAt(0).toUpperCase() || "?"}
          size={48}
          textSize="text-lg"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-body text-sm font-semibold text-off-white">
              {stats.nickname || `@${stats.uniqueId}`}
            </p>
            {stats.verified && (
              <span className="rounded bg-cyan/15 px-1.5 py-0.5 font-body text-[10px] font-semibold uppercase tracking-wide text-cyan">
                Verified
              </span>
            )}
            {stats.isLive ? (
              <span className="rounded bg-orange/20 px-1.5 py-0.5 font-body text-[10px] font-semibold uppercase tracking-wide text-orange">
                Live
              </span>
            ) : (
              <span className="rounded bg-off-white/10 px-1.5 py-0.5 font-body text-[10px] font-semibold uppercase tracking-wide text-off-white/40">
                Offline
              </span>
            )}
          </div>
          <p className="font-body text-xs text-off-white/40">
            @{stats.uniqueId}
            {updatedAt
              ? ` · Updated ${updatedAt.toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}`
              : null}
          </p>
        </div>
      </div>

      {stats.isLive && (stats.liveTitle || stats.liveViewerCount != null) && (
        <p className="font-body text-xs text-off-white/60">
          {stats.liveTitle ? <span className="text-off-white/80">{stats.liveTitle}</span> : "Live now"}
          {stats.liveViewerCount != null
            ? ` · ${formatCount(stats.liveViewerCount)} watching`
            : null}
        </p>
      )}

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-xl border border-off-white/10 py-3">
          <p className="font-display text-xl text-off-white">
            {formatCount(stats.followerCount)}
          </p>
          <p className="font-body text-xs text-off-white/40">Followers</p>
        </div>
        <div className="rounded-xl border border-off-white/10 py-3">
          <p className="font-display text-xl text-off-white">
            {formatCount(stats.heartCount)}
          </p>
          <p className="font-body text-xs text-off-white/40">Likes</p>
        </div>
        <div className="rounded-xl border border-off-white/10 py-3">
          <p className="font-display text-xl text-off-white">
            {formatCount(stats.videoCount)}
          </p>
          <p className="font-body text-xs text-off-white/40">Videos</p>
        </div>
      </div>

      {actions}
    </div>
  );
}
