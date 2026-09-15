import { formatCount, formatDurationSeconds } from "@/lib/formatCount";
import type { AgencyLiveMetrics } from "@/lib/agencyLiveReportTypes";

function dash(value: number | null | undefined, format?: (n: number) => string) {
  if (value == null || Number.isNaN(value)) return "—";
  return format ? format(value) : formatCount(value);
}

function deltaPct(current: number | null | undefined, prior: number | null | undefined) {
  if (current == null || prior == null || prior === 0) return null;
  return ((current - prior) / Math.abs(prior)) * 100;
}

function Delta({ value }: { value: number | null }) {
  if (value == null) return null;
  const up = value >= 0;
  return (
    <span className={`font-body text-xs ${up ? "text-cyan" : "text-orange"}`}>
      {up ? "↑" : "↓"} {Math.abs(value).toFixed(1)}%
    </span>
  );
}

function KpiCard({
  label,
  value,
  delta,
}: {
  label: string;
  value: string;
  delta?: number | null;
}) {
  return (
    <div className="rounded-xl border border-off-white/10 bg-off-white/[0.03] px-4 py-3">
      <p className="font-body text-[11px] uppercase tracking-wide text-off-white/40">{label}</p>
      <p className="mt-1 font-display text-3xl tracking-wide text-off-white">{value}</p>
      {delta != null && (
        <p className="mt-1">
          <Delta value={delta} />
        </p>
      )}
    </div>
  );
}

function FunnelRow({
  label,
  value,
  max,
}: {
  label: string;
  value: number | null;
  max: number;
}) {
  const width = value != null && value > 0 && max > 0 ? Math.max(8, Math.round((value / max) * 100)) : 0;
  return (
    <div className="grid grid-cols-[7.5rem_1fr_4.5rem] items-center gap-3">
      <p className="font-body text-xs uppercase tracking-wide text-off-white/45">{label}</p>
      <div className="h-2.5 overflow-hidden rounded-full bg-off-white/10">
        {value != null ? (
          <div
            className="h-full rounded-full bg-gradient-to-r from-orange to-cyan"
            style={{ width: `${width}%` }}
          />
        ) : null}
      </div>
      <p className="text-right font-body text-sm text-off-white">{dash(value)}</p>
    </div>
  );
}

const TRAFFIC_COLORS = {
  liveFeed: "#FD4802",
  forYou: "#00D4FF",
  following: "#5B7CFF",
  share: "#F5F5F5",
  other: "#6B7280",
} as const;

function TrafficDonut({
  traffic,
}: {
  traffic: AgencyLiveMetrics["traffic"];
}) {
  const slices = [
    { key: "liveFeed", label: "LIVE feed", value: traffic.liveFeed },
    { key: "forYou", label: "For You", value: traffic.forYou },
    { key: "following", label: "Following", value: traffic.following },
    { key: "share", label: "Share", value: traffic.share },
    { key: "other", label: "Other", value: traffic.other },
  ] as const;
  const total = slices.reduce((sum, slice) => sum + (slice.value ?? 0), 0);
  const hasData = slices.some((slice) => slice.value != null && slice.value > 0);

  const r = 36;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
      <svg viewBox="0 0 100 100" className="h-36 w-36 shrink-0">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(245,245,245,0.08)" strokeWidth="14" />
        {hasData &&
          slices.map((slice) => {
            const value = slice.value ?? 0;
            if (value <= 0 || total <= 0) return null;
            const len = (value / total) * c;
            const dash = `${len} ${c - len}`;
            const el = (
              <circle
                key={slice.key}
                cx="50"
                cy="50"
                r={r}
                fill="none"
                stroke={TRAFFIC_COLORS[slice.key]}
                strokeWidth="14"
                strokeDasharray={dash}
                strokeDashoffset={-offset}
                transform="rotate(-90 50 50)"
              />
            );
            offset += len;
            return el;
          })}
        <text x="50" y="54" textAnchor="middle" fill="#F5F5F5" style={{ fontSize: "11px" }}>
          {hasData ? formatCount(total) : "—"}
        </text>
      </svg>
      <ul className="flex flex-1 flex-col gap-1.5">
        {slices.map((slice) => (
          <li key={slice.key} className="flex items-center justify-between gap-3 font-body text-sm">
            <span className="flex items-center gap-2 text-off-white/70">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ background: TRAFFIC_COLORS[slice.key] }}
              />
              {slice.label}
            </span>
            <span className="text-off-white">{dash(slice.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function rateLabel(value: number | null) {
  if (value == null) return "—";
  return `${(value * 100).toFixed(1)}%`;
}

export default function AgencyLiveReportView({ metrics }: { metrics: AgencyLiveMetrics }) {
  const prior = metrics.prior;
  const funnel = [
    { label: "Impressions", value: metrics.impressions },
    { label: "Reached", value: metrics.reachedAudience },
    { label: "Views", value: metrics.views },
    { label: "Viewers", value: metrics.viewers },
    { label: "Gifts", value: metrics.giftEvents },
    { label: "Gifters", value: metrics.uniqueGifters },
  ];
  const funnelMax = Math.max(1, ...funnel.map((row) => row.value ?? 0));

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <KpiCard
          label="Diamonds"
          value={dash(metrics.diamonds)}
          delta={deltaPct(metrics.diamonds, prior?.diamonds)}
        />
        <KpiCard
          label="Valid go LIVE days"
          value={dash(metrics.validGoLiveDays, (n) => String(n))}
          delta={deltaPct(metrics.validGoLiveDays, prior?.validGoLiveDays)}
        />
        <KpiCard
          label="Avg watch duration"
          value={
            metrics.avgWatchDurationSeconds == null
              ? "—"
              : formatDurationSeconds(metrics.avgWatchDurationSeconds)
          }
          delta={deltaPct(metrics.avgWatchDurationSeconds, prior?.avgWatchDurationSeconds)}
        />
        <KpiCard
          label="LIVE duration"
          value={formatDurationSeconds(metrics.liveDurationSeconds)}
          delta={deltaPct(metrics.liveDurationSeconds, prior?.liveDurationSeconds)}
        />
        <KpiCard
          label="LIVE streams"
          value={dash(metrics.liveStreams, (n) => String(n))}
          delta={deltaPct(metrics.liveStreams, prior?.liveStreams)}
        />
        <KpiCard
          label="New followers"
          value={dash(metrics.newFollowers)}
          delta={deltaPct(metrics.newFollowers, prior?.newFollowers)}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="glass rounded-2xl p-6">
          <h2 className="font-display text-xl tracking-wide text-off-white/80">Funnel</h2>
          <div className="mt-4 flex flex-col gap-3">
            {funnel.map((row) => (
              <FunnelRow key={row.label} label={row.label} value={row.value} max={funnelMax} />
            ))}
          </div>
        </section>

        <div className="flex flex-col gap-6">
          <section className="glass rounded-2xl p-6">
            <h2 className="font-display text-xl tracking-wide text-off-white/80">Rates</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <p className="font-body text-[11px] uppercase tracking-wide text-off-white/40">
                  Tap-through
                </p>
                <p className="mt-1 font-display text-3xl text-off-white">
                  {rateLabel(metrics.tapThroughRate)}
                </p>
              </div>
              <div>
                <p className="font-body text-[11px] uppercase tracking-wide text-off-white/40">
                  Gifting
                </p>
                <p className="mt-1 font-display text-3xl text-off-white">
                  {rateLabel(metrics.giftingRate)}
                </p>
              </div>
            </div>
            <p className="mt-3 font-body text-xs text-off-white/40">
              Gifting uses unique gifters ÷ viewers, or joins when viewer count is missing.
              Tap-through needs impressions and views — shown as — until Studio data is available.
            </p>
          </section>

          <section className="glass rounded-2xl p-6">
            <h2 className="font-display text-xl tracking-wide text-off-white/80">Traffic sources</h2>
            <p className="mt-1 font-body text-xs text-off-white/40">
              LIVE feed / For You / Following / Share / Other — blank until Creator Studio cookies
              are connected.
            </p>
            <div className="mt-4">
              <TrafficDonut traffic={metrics.traffic} />
            </div>
          </section>
        </div>
      </div>

      {(metrics.likes != null || metrics.joins != null || metrics.battles != null) && (
        <p className="font-body text-xs text-off-white/40">
          Supporting activity
          {metrics.likes != null ? ` · ${formatCount(metrics.likes)} likes` : ""}
          {metrics.joins != null ? ` · ${formatCount(metrics.joins)} joins` : ""}
          {metrics.battles != null
            ? ` · ${formatCount(metrics.battles)} battles${
                metrics.battleWins != null ? ` (${formatCount(metrics.battleWins)} wins)` : ""
              }`
            : ""}
        </p>
      )}
    </div>
  );
}
