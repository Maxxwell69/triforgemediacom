import Link from "next/link";
import {
  getLeaderboard,
  LEADERBOARD_PERIODS,
  type LeaderboardPeriod,
} from "@/lib/leaderboard";
import MemberAvatar from "@/components/MemberAvatar";

export function parseLeaderboardPeriod(raw: string | undefined): LeaderboardPeriod {
  if (raw === "daily" || raw === "weekly" || raw === "monthly" || raw === "all") {
    return raw;
  }
  return "weekly";
}

type Props = {
  viewerId: string;
  period: LeaderboardPeriod;
  /** Base path for period chip links (e.g. /rewards). */
  periodHrefBase?: string;
};

export default async function LeaderboardSection({
  viewerId,
  period,
  periodHrefBase = "/rewards",
}: Props) {
  const { entries, viewer } = await getLeaderboard(period, {
    take: 50,
    viewerId,
  });

  const periodLabel =
    LEADERBOARD_PERIODS.find((p) => p.value === period)?.label ?? "This week";

  return (
    <section id="leaderboard" className="scroll-mt-8">
      <h2 className="font-display text-2xl tracking-wide text-off-white/80">
        Leaderboard
      </h2>
      <p className="mt-1 font-body text-sm text-off-white/45">
        XP earned {period === "all" ? "all time" : periodLabel.toLowerCase()} — from TikTask,
        courses, shares, and more.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {LEADERBOARD_PERIODS.map((p) => {
          const active = p.value === period;
          return (
            <Link
              key={p.value}
              href={`${periodHrefBase}?period=${p.value}#leaderboard`}
              className={`rounded-full border px-3 py-1.5 font-body text-xs font-semibold transition ${
                active
                  ? "border-orange bg-orange/20 text-orange"
                  : "border-off-white/15 text-off-white/50 hover:border-off-white/30 hover:text-off-white/80"
              }`}
            >
              {p.label}
            </Link>
          );
        })}
      </div>

      {viewer && (
        <div className="glass mt-6 flex items-center gap-4 rounded-2xl border border-cyan/25 p-4">
          <span className="w-8 shrink-0 text-center font-display text-xl text-cyan">
            #{viewer.rank}
          </span>
          <MemberAvatar
            avatarUrl={viewer.image}
            initial={viewer.name.replace(/^@/, "").charAt(0).toUpperCase() || "?"}
            size={40}
            online={viewer.online}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate font-body font-semibold text-off-white">
              You · {viewer.name}
            </p>
            <p className="font-body text-xs text-off-white/45">{periodLabel}</p>
          </div>
          <p className="shrink-0 font-display text-xl text-gradient">{viewer.points}</p>
        </div>
      )}

      {entries.length === 0 ? (
        <p className="glass mt-6 rounded-2xl p-8 text-center font-body text-off-white/50">
          No XP earned in this period yet. Complete a TikTask to get on the board.
        </p>
      ) : (
        <ol className="mt-6 flex flex-col gap-2">
          {entries.map((entry) => {
            const isYou = entry.userId === viewerId;
            const medal =
              entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : null;
            return (
              <li key={entry.userId}>
                <Link
                  href={`/members/${entry.userId}`}
                  className={`glass flex items-center gap-4 rounded-xl p-3 transition hover:border-cyan/40 ${
                    isYou ? "border-cyan/30" : ""
                  }`}
                >
                  <span className="w-8 shrink-0 text-center font-display text-lg text-off-white/50">
                    {medal ?? `#${entry.rank}`}
                  </span>
                  <MemberAvatar
                    avatarUrl={entry.image}
                    initial={entry.name.replace(/^@/, "").charAt(0).toUpperCase() || "?"}
                    size={40}
                    online={entry.online}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-body font-medium text-off-white">
                      {entry.name}
                      {isYou && (
                        <span className="ml-2 font-body text-xs text-cyan">(you)</span>
                      )}
                    </p>
                  </div>
                  <p className="shrink-0 font-display text-lg text-orange">{entry.points}</p>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
