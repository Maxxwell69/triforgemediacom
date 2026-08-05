import { prisma } from "@/lib/prisma";
import { requireAdminPage } from "@/lib/session";
import { getMemberDisplayName } from "@/lib/memberDisplay";
import { BUG_REPORT_STATUSES, BUG_STATUS_LABELS, BUG_STATUS_SORT_ORDER } from "@/lib/bugs";
import BugReportAdminRow from "@/components/admin/BugReportAdminRow";

export const dynamic = "force-dynamic";

export default async function AdminBugsPage() {
  await requireAdminPage();

  const reports = await prisma.bugReport.findMany({
    include: {
      reporter: {
        select: {
          id: true,
          name: true,
          profile: { select: { socialLinks: true, username: true, showRealName: true } },
          tiktokConnection: { select: { displayName: true, avatarUrl: true } },
          tiktokStatsSnapshot: {
            select: { nickname: true, avatarUrl: true, uniqueId: true },
          },
        },
      },
    },
  });

  reports.sort((a, b) => {
    const statusDiff =
      (BUG_STATUS_SORT_ORDER[a.status] ?? 99) - (BUG_STATUS_SORT_ORDER[b.status] ?? 99);
    if (statusDiff !== 0) return statusDiff;
    return b.reportedAt.getTime() - a.reportedAt.getTime();
  });

  const openCount = reports.filter(
    (r) => r.status === "REPORTED" || r.status === "IN_PROGRESS"
  ).length;

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-5xl tracking-wide">
        BUG <span className="text-gradient">REPORTS</span>
      </h1>
      <p className="mt-2 font-body text-off-white/60">
        Update status, adjust entered/fixed times, and credit finders. Members see the public board
        at{" "}
        <a href="/bugs" className="text-cyan hover:underline">
          /bugs
        </a>
        .
      </p>
      <p className="mt-3 font-body text-sm text-off-white/45">
        {openCount} open · {reports.length} total
        {BUG_REPORT_STATUSES.map((s) => {
          const n = reports.filter((r) => r.status === s).length;
          return n > 0 ? ` · ${BUG_STATUS_LABELS[s]}: ${n}` : "";
        }).join("")}
      </p>

      <div className="mt-8 flex flex-col gap-4">
        {reports.length === 0 && (
          <p className="glass rounded-2xl p-8 text-center font-body text-off-white/50">
            No bug reports yet. Members submit from /bugs.
          </p>
        )}
        {reports.map((report) => (
          <BugReportAdminRow
            key={report.id}
            report={{
              id: report.id,
              title: report.title,
              description: report.description,
              status: report.status,
              reportedAt: report.reportedAt,
              fixedAt: report.fixedAt,
              adminNotes: report.adminNotes,
              reporterName: getMemberDisplayName(report.reporter),
            }}
          />
        ))}
      </div>
    </main>
  );
}
