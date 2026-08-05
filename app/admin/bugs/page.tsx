import { prisma } from "@/lib/prisma";
import { requireAdminPage } from "@/lib/session";
import { getMemberDisplayName } from "@/lib/memberDisplay";
import { BUG_REPORT_STATUSES, BUG_STATUS_LABELS, BUG_STATUS_SORT_ORDER } from "@/lib/bugs";
import BugReportAdminRow from "@/components/admin/BugReportAdminRow";

export const dynamic = "force-dynamic";

export default async function AdminBugsPage() {
  await requireAdminPage();

  const [reports, memberRows] = await Promise.all([
    prisma.bugReport.findMany({
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: { select: { socialLinks: true, username: true, showRealName: true } },
            tiktokConnection: { select: { displayName: true, avatarUrl: true } },
            tiktokStatsSnapshot: {
              select: { nickname: true, avatarUrl: true, uniqueId: true },
            },
          },
        },
      },
    }),
    prisma.user.findMany({
      where: { status: "ACTIVE", profile: { isNot: null } },
      select: {
        id: true,
        name: true,
        email: true,
        profile: { select: { socialLinks: true, username: true, showRealName: true } },
        tiktokConnection: { select: { displayName: true, avatarUrl: true } },
        tiktokStatsSnapshot: {
          select: { nickname: true, avatarUrl: true, uniqueId: true },
        },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  reports.sort((a, b) => {
    const statusDiff =
      (BUG_STATUS_SORT_ORDER[a.status] ?? 99) - (BUG_STATUS_SORT_ORDER[b.status] ?? 99);
    if (statusDiff !== 0) return statusDiff;
    return b.ticketNumber - a.ticketNumber;
  });

  const members = memberRows
    .map((u) => ({
      id: u.id,
      label: `${getMemberDisplayName(u)}${u.email ? ` · ${u.email}` : ""}`,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));

  // Ensure current credit holders appear even if somehow inactive/no profile.
  for (const report of reports) {
    if (!members.some((m) => m.id === report.reporterId)) {
      members.unshift({
        id: report.reporter.id,
        label: `${getMemberDisplayName(report.reporter)} (current)`,
      });
    }
  }

  const openCount = reports.filter(
    (r) => r.status === "REPORTED" || r.status === "IN_PROGRESS"
  ).length;

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-5xl tracking-wide">
        HUB <span className="text-gradient">BUG</span>
      </h1>
      <p className="mt-2 font-body text-off-white/60">
        Update status, credit, and entered/fixed times. Members see the board at{" "}
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
            No Hub Bug reports yet. Members submit from /bugs.
          </p>
        )}
        {reports.map((report) => (
          <BugReportAdminRow
            key={report.id}
            members={members}
            report={{
              id: report.id,
              ticketNumber: report.ticketNumber,
              title: report.title,
              description: report.description,
              status: report.status,
              platform: report.platform,
              pageUrl: report.pageUrl,
              screenshotUrl: report.screenshotUrl,
              reportedAt: report.reportedAt,
              fixedAt: report.fixedAt,
              adminNotes: report.adminNotes,
              reporterId: report.reporterId,
              reporterName: getMemberDisplayName(report.reporter),
            }}
          />
        ))}
      </div>
    </main>
  );
}
