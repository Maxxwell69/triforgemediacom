import type { ReactNode } from "react";
import { formatCount } from "@/lib/formatCount";
import type { CreatorInsightsData } from "@/lib/creatorInsights";
import MemberAvatar from "@/components/MemberAvatar";

function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || seconds < 0 || !Number.isFinite(seconds)) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatRatio(n: number, digits = 1): string {
  if (!Number.isFinite(n) || n <= 0) return "—";
  if (n >= 100) return n.toFixed(0);
  return n.toFixed(digits);
}

function MetricTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "orange" | "cyan";
}) {
  return (
    <div className="rounded-xl border border-off-white/10 bg-off-white/[0.03] px-3 py-3 text-center">
      <p
        className={`font-display text-xl tracking-wide ${
          accent === "orange"
            ? "text-orange"
            : accent === "cyan"
              ? "text-cyan"
              : "text-off-white"
        }`}
      >
        {value}
      </p>
      <p className="mt-0.5 font-body text-[11px] uppercase tracking-wide text-off-white/40">
        {label}
      </p>
    </div>
  );
}

/**
 * Private TikTok + hub analytics for Account (owner) and Admin user pages.
 * Do not render on public member profiles.
 */
export default function CreatorInsightsPanel({
  insights,
  actions,
  eyebrow = "Creator insights · private",
}: {
  insights: CreatorInsightsData;
  actions?: ReactNode;
  eyebrow?: string;
}) {
  const updatedAt = insights.statsFetchedAt ?? insights.liveCheckedAt;
  const liveDuration = insights.room?.liveDurationSeconds ?? null;
  const liveLikes = insights.room?.likeCount ?? null;
  const liveTotal = insights.room?.totalUser ?? null;

  return (
    <div className="glass flex flex-col gap-5 rounded-2xl p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <MemberAvatar
            avatarUrl={insights.avatarUrl}
            initial={
              (insights.nickname || insights.uniqueId).replace(/^@/, "").charAt(0).toUpperCase() ||
              "?"
            }
            size={56}
            textSize="text-xl"
          />
          <div className="min-w-0">
            <p className="font-body text-[11px] uppercase tracking-wide text-off-white/35">
              {eyebrow}
            </p>
            <div className="mt-0.5 flex flex-wrap items-center gap-2">
              <p className="truncate font-display text-2xl tracking-wide text-off-white">
                {insights.nickname || `@${insights.uniqueId}`}
              </p>
              {insights.verified && (
                <span className="rounded bg-cyan/15 px-1.5 py-0.5 font-body text-[10px] font-semibold uppercase tracking-wide text-cyan">
                  Verified
                </span>
              )}
              {insights.isLive ? (
                <span className="rounded bg-orange/20 px-1.5 py-0.5 font-body text-[10px] font-semibold uppercase tracking-wide text-orange">
                  Live
                </span>
              ) : (
                <span className="rounded bg-off-white/10 px-1.5 py-0.5 font-body text-[10px] font-semibold uppercase tracking-wide text-off-white/40">
                  Offline
                </span>
              )}
            </div>
            <p className="font-body text-xs text-off-white/45">
              @{insights.uniqueId}
              {updatedAt
                ? ` · Updated ${updatedAt.toLocaleString([], {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}`
                : null}
            </p>
          </div>
        </div>
        {actions}
      </div>

      {insights.bio && (
        <p className="font-body text-sm leading-relaxed text-off-white/65">{insights.bio}</p>
      )}

      <div>
        <p className="mb-2 font-body text-[11px] font-semibold uppercase tracking-wide text-off-white/40">
          Reach
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <MetricTile label="Followers" value={formatCount(insights.followerCount)} accent="cyan" />
          <MetricTile label="Following" value={formatCount(insights.followingCount)} />
          <MetricTile label="Likes" value={formatCount(insights.heartCount)} accent="orange" />
          <MetricTile label="Videos" value={formatCount(insights.videoCount)} />
        </div>
      </div>

      <div>
        <p className="mb-2 font-body text-[11px] font-semibold uppercase tracking-wide text-off-white/40">
          Engagement ratios
        </p>
        <div className="grid grid-cols-2 gap-2">
          <MetricTile
            label="Likes / follower"
            value={formatRatio(insights.likesPerFollower)}
          />
          <MetricTile
            label="Videos / 1k followers"
            value={formatRatio(insights.videosPer1kFollowers)}
          />
        </div>
      </div>

      {insights.isLive && (
        <div className="rounded-xl border border-orange/25 bg-orange/5 p-4">
          <p className="font-body text-[11px] font-semibold uppercase tracking-wide text-orange">
            Live session
          </p>
          <p className="mt-1 font-body text-sm text-off-white/80">
            {insights.liveTitle || "Live now"}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <MetricTile
              label="Viewers"
              value={
                insights.liveViewerCount != null
                  ? formatCount(insights.liveViewerCount)
                  : "—"
              }
              accent="orange"
            />
            <MetricTile
              label="Live likes"
              value={liveLikes != null ? formatCount(liveLikes) : "—"}
            />
            <MetricTile label="Duration" value={formatDuration(liveDuration)} />
            <MetricTile
              label="Total joined"
              value={liveTotal != null ? formatCount(liveTotal) : "—"}
            />
          </div>
          {!insights.room && (
            <p className="mt-2 font-body text-[11px] text-off-white/35">
              Extended live metrics need tik.tools Pro+ room fetch — showing cached viewers for now.
            </p>
          )}
        </div>
      )}

      <div>
        <p className="mb-2 font-body text-[11px] font-semibold uppercase tracking-wide text-off-white/40">
          Hub pulse
        </p>
        <div className="grid grid-cols-2 gap-2">
          <MetricTile label="XP points" value={formatCount(insights.hubPoints)} accent="cyan" />
          <MetricTile label="Day streak" value={String(insights.streakCount)} accent="orange" />
        </div>
      </div>
    </div>
  );
}
