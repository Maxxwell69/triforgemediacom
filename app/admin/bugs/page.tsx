import { prisma } from "@/lib/prisma";
import { requireAdminPage } from "@/lib/session";
import { getMemberDisplayName } from "@/lib/memberDisplay";
import { BUG_REPORT_STATUSES, BUG_STATUS_LABELS, BUG_STATUS_SORT_ORDER } from "@/lib/bugs";
import BugReportAdminRow from "@/components/admin/BugReportAdminRow";
import { importBugChannelAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminBugsPage({
  searchParams,
}: {
  searchParams?: { import?: string; msg?: string };
}) {
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
        HUB <span className="text-gradient">BUG</span>
      </h1>
      <p className="mt-2 font-body text-off-white/60">
        Update status, adjust entered/fixed times, and credit finders. Members see the board at{" "}
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

      {searchParams?.msg && (
        <p
          className={`mt-4 rounded-lg border px-4 py-3 font-body text-sm ${
            searchParams.import === "ok"
              ? "border-cyan/30 bg-cyan/10 text-cyan"
              : "border-orange/30 bg-orange/10 text-orange"
          }`}
        >
          {searchParams.msg}
        </p>
      )}

      <form action={importBugChannelAction} className="glass mt-6 rounded-2xl p-5">
        <h2 className="font-display text-lg tracking-wide text-off-white/80">
          Import from #bugs chat
        </h2>
        <p className="mt-1 font-body text-xs text-off-white/45">
          Pulls messages from the legacy bugs channel into Hub Bug (safe to run more than once —
          already-imported messages are skipped).
        </p>
        <button
          type="submit"
          className="mt-3 rounded-lg border border-cyan/40 px-4 py-2 font-body text-sm font-semibold text-cyan transition hover:bg-cyan/10"
        >
          Import #bugs messages
        </button>
      </form>

      <div className="mt-8 flex flex-col gap-4">
        {reports.length === 0 && (
          <p className="glass rounded-2xl p-8 text-center font-body text-off-white/50">
            No Hub Bug reports yet. Members submit from /bugs, or import the old chat above.
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
              platform: report.platform,
              pageUrl: report.pageUrl,
              screenshotUrl: report.screenshotUrl,
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
