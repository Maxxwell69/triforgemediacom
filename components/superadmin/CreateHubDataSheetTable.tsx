import Link from "next/link";
import type { CreateHubDataSheet } from "@/lib/hub/dataSheet";
import { formatSheetBytes, formatSheetMinutes } from "@/lib/hub/dataSheet";

export default function CreateHubDataSheetTable({
  sheet,
  compact,
}: {
  sheet: CreateHubDataSheet;
  compact?: boolean;
}) {
  const rows = compact ? sheet.rows.slice(0, 8) : sheet.rows;

  return (
    <div className="overflow-x-auto rounded-2xl border border-off-white/10">
      <table className="min-w-full text-left font-body text-sm">
        <thead className="border-b border-off-white/10 bg-off-white/[0.03] text-[11px] uppercase tracking-wide text-off-white/40">
          <tr>
            <th className="px-4 py-3 font-medium">Hub</th>
            <th className="px-4 py-3 font-medium">Members</th>
            <th className="px-4 py-3 font-medium">Invited</th>
            <th className="px-4 py-3 font-medium">Live now</th>
            <th className="px-4 py-3 font-medium">Webinars</th>
            <th className="px-4 py-3 font-medium">Joins</th>
            <th className="px-4 py-3 font-medium">Live kit min</th>
            <th className="px-4 py-3 font-medium">Bandwidth 7d</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-off-white/5 last:border-0">
              <td className="px-4 py-3">
                {row.kind === "client" ? (
                  <Link href={`/superadmin/${row.id}`} className="text-off-white hover:text-cyan">
                    {row.name}
                  </Link>
                ) : (
                  <span className="text-off-white">{row.name}</span>
                )}
                <p className="text-[11px] text-off-white/40">
                  {row.kind === "hub0" ? "Forge Hub" : `${row.slug}.hub.triforgemedia.com`}
                  {row.kind === "client" && !row.provisioned ? " · not provisioned" : ""}
                </p>
              </td>
              <td className="px-4 py-3 text-off-white">{row.membersActive.toLocaleString()}</td>
              <td className="px-4 py-3 text-off-white/70">{row.membersInvited.toLocaleString()}</td>
              <td className="px-4 py-3 text-off-white">{row.liveParticipants.toLocaleString()}</td>
              <td className="px-4 py-3 text-off-white/70">{row.webinarsThisMonth.toLocaleString()}</td>
              <td className="px-4 py-3 text-off-white/70">{row.joinsThisMonth.toLocaleString()}</td>
              <td className="px-4 py-3 text-off-white">
                {formatSheetMinutes(row.estimatedMinutesThisMonth)}
              </td>
              <td className="px-4 py-3 text-off-white">{formatSheetBytes(row.bandwidthBytes7d)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="border-t border-off-white/10 bg-off-white/[0.03] font-medium text-off-white">
          <tr>
            <td className="px-4 py-3">Total</td>
            <td className="px-4 py-3">{sheet.totals.membersActive.toLocaleString()}</td>
            <td className="px-4 py-3">{sheet.totals.membersInvited.toLocaleString()}</td>
            <td className="px-4 py-3">{sheet.totals.liveParticipants.toLocaleString()}</td>
            <td className="px-4 py-3">{sheet.totals.webinarsThisMonth.toLocaleString()}</td>
            <td className="px-4 py-3">{sheet.totals.joinsThisMonth.toLocaleString()}</td>
            <td className="px-4 py-3">{formatSheetMinutes(sheet.totals.estimatedMinutesThisMonth)}</td>
            <td className="px-4 py-3">{formatSheetBytes(sheet.totals.bandwidthBytes7d)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
