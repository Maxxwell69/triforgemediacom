import Link from "next/link";
import { notFound } from "next/navigation";
import { loadAgencyLiveReport, monthLabel, monthParam, parseMonthParam, requireAgencyLiveReports } from "@/lib/agencyLiveReports";
import AgencyLiveReportView from "@/components/admin/AgencyLiveReportView";
import AgencyLiveReportNotes from "@/components/admin/AgencyLiveReportNotes";
import { RunLiveReportForm } from "./RunLiveReportForm";

export const dynamic = "force-dynamic";

function monthOptions() {
  const now = new Date();
  const options: { value: string; label: string }[] = [];
  for (let i = 0; i < 24; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth() + 1;
    options.push({ value: monthParam(year, month), label: monthLabel(year, month) });
  }
  return options;
}

export default async function AdminLiveReportPersonPage({
  params,
  searchParams,
}: {
  params: { userId: string };
  searchParams?: { month?: string };
}) {
  requireAgencyLiveReports();
  const { year, month } = parseMonthParam(searchParams?.month);
  const data = await loadAgencyLiveReport(params.userId, year, month);
  if (!data) notFound();

  const ranAt = data.report?.ranAt
    ? data.report.ranAt.toLocaleString([], { dateStyle: "medium", timeStyle: "short" })
    : null;
  const ranBy = data.report?.ranBy?.name || data.report?.ranBy?.email || null;

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <Link href="/admin/live-reports" className="font-body text-sm text-cyan hover:underline">
        ← LIVE reports
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          {data.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.avatarUrl} alt="" className="h-14 w-14 rounded-full object-cover" />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-off-white/10 font-display text-2xl text-off-white/50">
              {data.name.replace(/^@/, "").charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="font-display text-4xl tracking-wide text-off-white">{data.name}</h1>
            <p className="font-body text-sm text-off-white/50">
              {data.uniqueId ? `@${data.uniqueId}` : data.email} · {monthLabel(year, month)}
            </p>
          </div>
        </div>
        <RunLiveReportForm
          key={monthParam(year, month)}
          userId={data.userId}
          month={monthParam(year, month)}
          options={monthOptions()}
        />
      </div>

      {data.metrics?.source.agencyEventsError && (
        <p className="mt-6 rounded-lg border border-orange/30 bg-orange/10 px-4 py-3 font-body text-sm text-orange">
          tik.tools agency events: {data.metrics.source.agencyEventsError}. Stream counts still
          come from hub LIVE sessions.
        </p>
      )}

      {data.metrics?.source.agencyEventsOk && (
        <p className="mt-6 font-body text-xs text-off-white/40">
          Gift totals are a tik.tools lookback of {data.metrics.source.daysLookback} day
          {data.metrics.source.daysLookback === 1 ? "" : "s"} from when this was run — not a
          calendar filter. LIVE streams, duration, and valid days use hub session windows for{" "}
          {monthLabel(year, month)}.
          {ranAt ? ` Last run ${ranAt}${ranBy ? ` by ${ranBy}` : ""}.` : ""}
        </p>
      )}

      <div className="mt-8">
        {data.metrics ? (
          <AgencyLiveReportView metrics={data.metrics} />
        ) : (
          <div className="glass rounded-2xl p-8 text-center font-body text-off-white/50">
            Pick a month and hit Run report. Diamonds and gifters come from tik.tools; funnel
            tiles TikTok Studio does not expose stay blank.
          </div>
        )}
      </div>

      <div className="mt-8">
        <AgencyLiveReportNotes
          reportId={data.report?.id ?? null}
          userId={data.userId}
          notes={data.report?.notes ?? []}
        />
      </div>
    </main>
  );
}
