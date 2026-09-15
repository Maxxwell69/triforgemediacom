import Link from "next/link";
import { formatCount } from "@/lib/formatCount";
import {
  listAgencyLiveRoster,
  monthLabel,
  monthParam,
  requireAgencyLiveReports,
} from "@/lib/agencyLiveReports";
import AgencyLiveRosterAdd from "@/components/admin/AgencyLiveRosterAdd";
import AgencyLiveRosterRemove from "@/components/admin/AgencyLiveRosterRemove";

export const dynamic = "force-dynamic";

export default async function AdminLiveReportsPage() {
  requireAgencyLiveReports();
  const rows = await listAgencyLiveRoster();

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="font-display text-5xl tracking-wide">
        LIVE <span className="text-gradient">REPORTS</span>
      </h1>
      <p className="mt-2 max-w-2xl font-body text-off-white/60">
        Agency-only monthly LIVE analytics. Add creators by hand, run a month, and leave notes
        other admins can see. Members never see this.
      </p>

      <div className="mt-8">
        <AgencyLiveRosterAdd />
      </div>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left">
          <thead>
            <tr className="border-b border-off-white/10 font-body text-[11px] uppercase tracking-wide text-off-white/40">
              <th className="py-2 pr-3 font-medium">Creator</th>
              <th className="py-2 pr-3 font-medium">Handle</th>
              <th className="py-2 pr-3 font-medium">Last report</th>
              <th className="py-2 pr-3 font-medium">Diamonds</th>
              <th className="py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 font-body text-sm text-off-white/45">
                  No one on the LIVE report roster yet. Search above to add a creator with a
                  TikTok handle.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.userId} className="border-b border-off-white/5 font-body text-sm">
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-3">
                      {row.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={row.avatarUrl}
                          alt=""
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-off-white/10 text-xs text-off-white/50">
                          {row.name.replace(/^@/, "").charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-off-white">{row.name}</p>
                        <p className="truncate text-xs text-off-white/40">{row.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-3 text-off-white/70">
                    {row.uniqueId ? `@${row.uniqueId}` : "—"}
                  </td>
                  <td className="py-3 pr-3 text-off-white/70">
                    {row.lastReport
                      ? monthLabel(row.lastReport.year, row.lastReport.month)
                      : "—"}
                  </td>
                  <td className="py-3 pr-3 text-off-white">
                    {row.lastReport?.diamonds != null
                      ? formatCount(row.lastReport.diamonds)
                      : "—"}
                  </td>
                  <td className="py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/live-reports/${row.userId}${
                          row.lastReport
                            ? `?month=${monthParam(row.lastReport.year, row.lastReport.month)}`
                            : ""
                        }`}
                        className="rounded-lg bg-cyan/90 px-3 py-1.5 font-body text-xs font-semibold text-charcoal transition hover:brightness-110"
                      >
                        Report
                      </Link>
                      <AgencyLiveRosterRemove userId={row.userId} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
