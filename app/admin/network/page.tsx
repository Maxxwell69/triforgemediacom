import Link from "next/link";
import { formatCount } from "@/lib/formatCount";
import {
  loadNetworkDashboard,
  type NetworkCreatorRow,
  type NetworkDashboardTrackFilter,
} from "@/lib/networkDashboard";

export const dynamic = "force-dynamic";

function Metric({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: "orange" | "cyan";
}) {
  return (
    <div className="rounded-xl border border-off-white/10 bg-off-white/[0.03] px-4 py-3">
      <p className="font-body text-[11px] uppercase tracking-wide text-off-white/40">{label}</p>
      <p
        className={`mt-1 font-display text-2xl tracking-wide ${
          accent === "orange" ? "text-orange" : accent === "cyan" ? "text-cyan" : "text-off-white"
        }`}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 font-body text-[11px] text-off-white/35">{hint}</p> : null}
    </div>
  );
}

function Section({
  title,
  children,
  note,
}: {
  title: string;
  children: React.ReactNode;
  note?: string;
}) {
  return (
    <section className="glass rounded-2xl p-6">
      <h2 className="font-display text-xl tracking-wide text-off-white/85">{title}</h2>
      {note ? <p className="mt-1 font-body text-xs text-off-white/40">{note}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function CreatorTable({
  rows,
  columns,
}: {
  rows: NetworkCreatorRow[];
  columns: "followers" | "hearts" | "live" | "league";
}) {
  if (rows.length === 0) {
    return <p className="font-body text-sm text-off-white/45">No creators in this list yet.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-left">
        <thead>
          <tr className="border-b border-off-white/10 font-body text-[11px] uppercase tracking-wide text-off-white/40">
            <th className="py-2 pr-3 font-medium">Creator</th>
            <th className="py-2 pr-3 font-medium">Track</th>
            {columns === "followers" || columns === "hearts" ? (
              <>
                <th className="py-2 pr-3 font-medium">Followers</th>
                <th className="py-2 pr-3 font-medium">Likes</th>
                <th className="py-2 font-medium">Videos</th>
              </>
            ) : null}
            {columns === "live" ? (
              <>
                <th className="py-2 pr-3 font-medium">Viewers</th>
                <th className="py-2 font-medium">Handle</th>
              </>
            ) : null}
            {columns === "league" ? (
              <>
                <th className="py-2 pr-3 font-medium">Class</th>
                <th className="py-2 font-medium">Rank</th>
              </>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.userId} className="border-b border-off-white/5 font-body text-sm">
              <td className="py-2.5 pr-3">
                <Link href={`/admin/users/${r.userId}`} className="text-cyan hover:underline">
                  {r.name}
                </Link>
              </td>
              <td className="py-2.5 pr-3 text-off-white/50">{r.track}</td>
              {columns === "followers" || columns === "hearts" ? (
                <>
                  <td className="py-2.5 pr-3">{formatCount(r.followers)}</td>
                  <td className="py-2.5 pr-3">{formatCount(r.hearts)}</td>
                  <td className="py-2.5">{formatCount(r.videos)}</td>
                </>
              ) : null}
              {columns === "live" ? (
                <>
                  <td className="py-2.5 pr-3 text-orange">
                    {r.liveViewers != null ? formatCount(r.liveViewers) : "—"}
                  </td>
                  <td className="py-2.5 text-off-white/55">
                    {r.uniqueId ? `@${r.uniqueId}` : "—"}
                  </td>
                </>
              ) : null}
              {columns === "league" ? (
                <>
                  <td className="py-2.5 pr-3">{r.leagueLabel || "—"}</td>
                  <td className="py-2.5">
                    {r.leagueRank != null ? `#${r.leagueRank}` : "—"}
                  </td>
                </>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function parseTrack(raw: string | string[] | undefined): NetworkDashboardTrackFilter {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v === "CN" || v === "MN") return v;
  return "ALL";
}

export default async function AdminNetworkDashboardPage({
  searchParams,
}: {
  searchParams?: { track?: string };
}) {
  const track = parseTrack(searchParams?.track);
  const data = await loadNetworkDashboard(track);

  const tabs: { id: NetworkDashboardTrackFilter; label: string }[] = [
    { id: "ALL", label: "All network" },
    { id: "CN", label: "Creator Network" },
    { id: "MN", label: "Media Network" },
  ];

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl tracking-wide">
            NETWORK <span className="text-gradient">CREATORS</span>
          </h1>
          <p className="mt-2 max-w-2xl font-body text-off-white/60">
            Live snapshot of creators on the TriForge network — headcount, TikTok reach, who’s
            live, Diamond Rush league, and hub engagement.
          </p>
        </div>
        <p className="font-body text-xs text-off-white/35">
          Updated {data.generatedAt.toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            href={tab.id === "ALL" ? "/admin/network" : `/admin/network?track=${tab.id}`}
            className={`rounded-full border px-4 py-1.5 font-body text-xs font-semibold transition ${
              track === tab.id
                ? "border-orange bg-orange text-off-white"
                : "border-off-white/20 text-off-white/60 hover:border-off-white/40"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <Metric
          label="Active creators"
          value={formatCount(data.counts.activeCreators)}
          accent="cyan"
          hint={`${data.counts.invited} invited`}
        />
        <Metric
          label="With TikTok stats"
          value={formatCount(data.counts.withTikTokStats)}
          hint={`${data.counts.verified} verified`}
        />
        <Metric
          label="Live now"
          value={formatCount(data.counts.currentlyLive)}
          accent="orange"
          hint={`${formatCount(data.counts.liveViewersTotal)} viewers`}
        />
        <Metric
          label="Pending apps"
          value={formatCount(data.counts.pendingApplications)}
        />
        <Metric
          label="Active in hub (7d)"
          value={formatCount(data.counts.activeLast7d)}
          hint={`${data.counts.unseenLast7d} quiet`}
        />
        <Metric
          label="Network followers"
          value={formatCount(data.reach.followersTotal)}
          accent="cyan"
          hint={`avg ${formatCount(Math.round(data.reach.followersAvg))}`}
        />
        <Metric
          label="Network likes"
          value={formatCount(data.reach.heartsTotal)}
          hint={`avg ${formatCount(Math.round(data.reach.heartsAvg))}`}
        />
        <Metric
          label="CN TikTok requests"
          value={formatCount(data.counts.tiktokNetworkRequested)}
          hint="Forge contract flow"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Section title="Reach distribution" note="Among creators with a TikTok stats snapshot.">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Metric label="Median followers" value={formatCount(Math.round(data.reach.followersMedian))} />
            <Metric label="Total videos" value={formatCount(data.reach.videosTotal)} />
            <Metric label="Avg videos" value={formatCount(Math.round(data.reach.videosAvg))} />
          </div>
          <div className="mt-4 flex flex-col gap-2">
            {data.reach.buckets.map((b) => {
              const max = Math.max(...data.reach.buckets.map((x) => x.count), 1);
              const pct = Math.round((b.count / max) * 100);
              return (
                <div key={b.label} className="flex items-center gap-3">
                  <span className="w-20 shrink-0 font-body text-xs text-off-white/45">{b.label}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-off-white/10">
                    <div className="h-full rounded-full bg-cyan/70" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-8 text-right font-body text-xs text-off-white/60">{b.count}</span>
                </div>
              );
            })}
          </div>
        </Section>

        <Section
          title="Live on TikTok"
          note="Current session only — we don’t store historical stream length yet."
        >
          <div className="mb-4 grid grid-cols-3 gap-2">
            <Metric label="Live" value={formatCount(data.live.creators.length)} accent="orange" />
            <Metric label="Avg viewers" value={formatCount(Math.round(data.live.avgViewers))} />
            <Metric label="Peak viewers" value={formatCount(data.live.maxViewers)} />
          </div>
          <CreatorTable rows={data.live.creators.slice(0, 12)} columns="live" />
        </Section>

        <Section
          title="Diamond Rush league"
          note="League class/rank from tik.tools when available — not diamond earnings."
        >
          <Metric
            label="Creators with league data"
            value={formatCount(data.league.withLeagueData)}
            hint={
              data.league.byClass.length
                ? data.league.byClass.map((c) => `${c.label}: ${c.count}`).join(" · ")
                : "No league data yet (may need higher tik.tools tier)"
            }
          />
          <div className="mt-4">
            <CreatorTable rows={data.league.topRanked} columns="league" />
          </div>
        </Section>

        <Section title="Hub engagement">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Metric label="XP total" value={formatCount(data.hub.xpTotal)} accent="cyan" />
            <Metric label="XP (7d)" value={formatCount(data.hub.xpLast7d)} />
            <Metric label="TikTask today" value={formatCount(data.hub.tikTaskDoneToday)} accent="orange" />
            <Metric label="TikTask (7d)" value={formatCount(data.hub.tikTaskDoneLast7d)} />
            <Metric label="TikTask (30d)" value={formatCount(data.hub.tikTaskDoneLast30d)} />
            <Metric
              label="Avg streak"
              value={data.hub.streakAvg.toFixed(1)}
              hint={`max ${data.hub.streakMax}`}
            />
            <Metric label="Chat msgs (7d)" value={formatCount(data.hub.messagesLast7d)} />
            <Metric label="Webinar joins (30d)" value={formatCount(data.hub.webinarJoinsLast30d)} />
            <Metric label="Course enrollments" value={formatCount(data.hub.courseEnrollments)} />
          </div>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 font-body text-[11px] font-semibold uppercase tracking-wide text-off-white/40">
                Top streaks
              </p>
              <ul className="flex flex-col gap-1.5">
                {data.hub.topStreaks.length === 0 ? (
                  <li className="font-body text-sm text-off-white/40">No streaks yet.</li>
                ) : (
                  data.hub.topStreaks.map((r) => (
                    <li key={r.userId} className="flex justify-between font-body text-sm">
                      <Link href={`/admin/users/${r.userId}`} className="text-cyan hover:underline">
                        {r.name}
                      </Link>
                      <span className="text-orange">{r.streak}d</span>
                    </li>
                  ))
                )}
              </ul>
            </div>
            <div>
              <p className="mb-2 font-body text-[11px] font-semibold uppercase tracking-wide text-off-white/40">
                Top XP
              </p>
              <ul className="flex flex-col gap-1.5">
                {data.hub.topXp.length === 0 ? (
                  <li className="font-body text-sm text-off-white/40">No XP yet.</li>
                ) : (
                  data.hub.topXp.map((r) => (
                    <li key={r.userId} className="flex justify-between font-body text-sm">
                      <Link href={`/admin/users/${r.userId}`} className="text-cyan hover:underline">
                        {r.name}
                      </Link>
                      <span className="text-cyan">{formatCount(r.xp)}</span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </Section>

        <Section title="Top by followers">
          <CreatorTable rows={data.topByFollowers} columns="followers" />
        </Section>

        <Section title="Top by likes">
          <CreatorTable rows={data.topByHearts} columns="hearts" />
        </Section>
      </div>

      <div className="mt-6 rounded-xl border border-off-white/10 bg-off-white/[0.03] p-4">
        <p className="font-body text-[11px] font-semibold uppercase tracking-wide text-off-white/40">
          Data limits
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 font-body text-xs text-off-white/50">
          {data.limitations.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>
    </main>
  );
}
