import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCount } from "@/lib/formatCount";
import {
  loadActivityRoster,
  type RosterHubFilter,
  type RosterLiveFilter,
  type RosterSort,
  type RosterTrackFilter,
} from "@/lib/activityRoster";

export const dynamic = "force-dynamic";

function fmtWhen(d: Date | null): string {
  if (!d) return "—";
  return d.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function parseHub(raw: string | undefined): RosterHubFilter {
  const v = raw || "all";
  if (
    v === "in_hub" ||
    v === "never" ||
    v === "new_7d" ||
    v === "new_30d" ||
    v === "active_7d" ||
    v === "quiet_7d"
  ) {
    return v;
  }
  return "all";
}

function parseLive(raw: string | undefined): RosterLiveFilter {
  if (raw === "ever" || raw === "never" || raw === "live_now") return raw;
  return "all";
}

function parseSort(raw: string | undefined): RosterSort {
  if (
    raw === "lastLogin" ||
    raw === "created" ||
    raw === "name" ||
    raw === "liveCount" ||
    raw === "xp" ||
    raw === "level"
  ) {
    return raw;
  }
  return "lastSeen";
}

function parseTrack(raw: string | undefined): RosterTrackFilter {
  if (raw === "CN" || raw === "MN") return raw;
  return "ALL";
}

const fieldClass =
  "rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white outline-none focus:border-cyan/60";

export default async function AdminActivityRosterPage({
  searchParams,
}: {
  searchParams?: {
    q?: string;
    track?: string;
    hub?: string;
    live?: string;
    level?: string;
    sort?: string;
    page?: string;
  };
}) {
  const q = searchParams?.q || "";
  const track = parseTrack(searchParams?.track);
  const hub = parseHub(searchParams?.hub);
  const live = parseLive(searchParams?.live);
  const levelId = searchParams?.level || "";
  const sort = parseSort(searchParams?.sort);
  const page = Math.max(1, Number(searchParams?.page) || 1);

  const [data, levels] = await Promise.all([
    loadActivityRoster({
      q,
      track,
      hub,
      live,
      levelId: levelId || undefined,
      sort,
      page,
    }),
    prisma.progressionLevel.findMany({
      where: { status: "ACTIVE" },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));
  const qs = (overrides: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams();
    const merged: Record<string, string | undefined> = {
      q: q || undefined,
      track: track === "ALL" ? undefined : track,
      hub: hub === "all" ? undefined : hub,
      live: live === "all" ? undefined : live,
      level: levelId || undefined,
      sort: sort === "lastSeen" ? undefined : sort,
      page: undefined,
      ...Object.fromEntries(
        Object.entries(overrides).map(([k, v]) => [k, v == null || v === "" ? undefined : String(v)])
      ),
    };
    for (const [k, v] of Object.entries(merged)) {
      if (v) params.set(k, v);
    }
    const s = params.toString();
    return s ? `/admin/roster?${s}` : "/admin/roster";
  };

  return (
    <main className="mx-auto max-w-7xl px-6 py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl tracking-wide">
            ACTIVITY <span className="text-gradient">ROSTER</span>
          </h1>
          <p className="mt-2 max-w-2xl font-body text-off-white/60">
            Levels, hub participation, and TikTok go-lives. Filter who has actually signed into the
            hub versus invited accounts that never showed up.
          </p>
        </div>
        <Link href="/admin/network" className="font-body text-sm text-cyan hover:underline">
          Network dashboard →
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "In this view", value: data.total },
          { label: "Signed in (ever)", value: data.counts.inHub },
          { label: "Never signed in", value: data.counts.never },
          { label: "New in hub (7d)", value: data.counts.new7d },
          { label: "Active in hub (7d)", value: data.counts.active7d },
          { label: "Live now", value: data.counts.liveNow },
        ].map((m) => (
          <div key={m.label} className="rounded-xl border border-off-white/10 bg-off-white/[0.03] px-4 py-3">
            <p className="font-body text-[11px] uppercase tracking-wide text-off-white/40">{m.label}</p>
            <p className="mt-1 font-display text-2xl text-off-white">{formatCount(m.value)}</p>
          </div>
        ))}
      </div>

      <form className="mt-6 grid grid-cols-1 gap-3 rounded-2xl border border-off-white/10 bg-off-white/[0.03] p-4 md:grid-cols-3 lg:grid-cols-6">
        <input name="q" defaultValue={q} placeholder="Search name, email, @handle" className={fieldClass} />
        <select name="track" defaultValue={track} className={fieldClass}>
          <option value="ALL">All tracks</option>
          <option value="CN">Creator Network</option>
          <option value="MN">Media Network</option>
        </select>
        <select name="hub" defaultValue={hub} className={fieldClass}>
          <option value="all">All hub status</option>
          <option value="in_hub">Has signed into hub</option>
          <option value="never">Never signed in</option>
          <option value="new_7d">Came in last 7 days</option>
          <option value="new_30d">Came in last 30 days</option>
          <option value="active_7d">Active in hub (7d)</option>
          <option value="quiet_7d">Signed in, quiet 7d</option>
        </select>
        <select name="live" defaultValue={live} className={fieldClass}>
          <option value="all">All live history</option>
          <option value="live_now">Live now</option>
          <option value="ever">Has gone live</option>
          <option value="never">Never gone live</option>
        </select>
        <select name="level" defaultValue={levelId} className={fieldClass}>
          <option value="">All levels</option>
          <option value="none">No level yet</option>
          {levels.map((level) => (
            <option key={level.id} value={level.id}>
              {level.name}
            </option>
          ))}
        </select>
        <select name="sort" defaultValue={sort} className={fieldClass}>
          <option value="lastSeen">Sort: last seen</option>
          <option value="lastLogin">Sort: last login</option>
          <option value="created">Sort: joined</option>
          <option value="name">Sort: name</option>
          <option value="liveCount">Sort: live count (page)</option>
          <option value="xp">Sort: XP (page)</option>
          <option value="level">Sort: level (page)</option>
        </select>
        <button
          type="submit"
          className="rounded-lg bg-orange px-4 py-2 font-body text-sm font-semibold text-off-white hover:brightness-110 md:col-span-3 lg:col-span-6"
        >
          Apply filters
        </button>
      </form>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[980px] text-left">
          <thead>
            <tr className="border-b border-off-white/10 font-body text-[11px] uppercase tracking-wide text-off-white/40">
              <th className="py-2 pr-3 font-medium">Creator</th>
              <th className="py-2 pr-3 font-medium">Track</th>
              <th className="py-2 pr-3 font-medium">Level</th>
              <th className="py-2 pr-3 font-medium">Hub</th>
              <th className="py-2 pr-3 font-medium">Last seen</th>
              <th className="py-2 pr-3 font-medium">XP / streak</th>
              <th className="py-2 pr-3 font-medium">TikTask 7d</th>
              <th className="py-2 pr-3 font-medium">Chat 7d</th>
              <th className="py-2 font-medium">Lives</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 font-body text-sm text-off-white/45">
                  No members match these filters.
                </td>
              </tr>
            ) : (
              data.rows.map((row) => (
                <tr key={row.userId} className="border-b border-off-white/5 font-body text-sm">
                  <td className="py-2.5 pr-3">
                    <Link href={`/admin/users/${row.userId}`} className="text-cyan hover:underline">
                      {row.name}
                    </Link>
                    <p className="text-xs text-off-white/35">{row.email}</p>
                  </td>
                  <td className="py-2.5 pr-3 text-off-white/55">{row.track}</td>
                  <td className="py-2.5 pr-3">{row.levelName || "—"}</td>
                  <td className="py-2.5 pr-3">
                    {row.lastLoginAt ? (
                      <span className="text-cyan">In hub</span>
                    ) : (
                      <span className="text-orange">Never</span>
                    )}
                    <p className="text-[11px] text-off-white/35">
                      {row.firstLoginAt
                        ? `First ${fmtWhen(row.firstLoginAt)}`
                        : `Created ${fmtWhen(row.createdAt)}`}
                    </p>
                  </td>
                  <td className="py-2.5 pr-3 text-off-white/70">{fmtWhen(row.lastSeenAt)}</td>
                  <td className="py-2.5 pr-3">
                    {formatCount(row.xp)}
                    <span className="text-off-white/35"> · {row.streak}d</span>
                  </td>
                  <td className="py-2.5 pr-3">{row.tikTask7d}</td>
                  <td className="py-2.5 pr-3">{row.messages7d}</td>
                  <td className="py-2.5">
                    {row.isLiveNow ? <span className="text-orange">LIVE · </span> : null}
                    {row.liveCount}
                    <p className="text-[11px] text-off-white/35">
                      {row.lastLiveAt ? fmtWhen(row.lastLiveAt) : "no sessions yet"}
                    </p>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div className="mt-6 flex items-center justify-between font-body text-sm text-off-white/50">
          <span>
            Page {data.page} of {totalPages}
          </span>
          <div className="flex gap-3">
            {data.page > 1 ? (
              <Link href={qs({ page: data.page - 1 })} className="text-cyan hover:underline">
                Previous
              </Link>
            ) : null}
            {data.page < totalPages ? (
              <Link href={qs({ page: data.page + 1 })} className="text-cyan hover:underline">
                Next
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}

      <p className="mt-6 font-body text-xs text-off-white/35">
        Live counts start from this release — earlier go-lives were not stored. “Came into the hub”
        uses first login.
      </p>
    </main>
  );
}
