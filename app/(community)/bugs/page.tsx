import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { getMemberDisplayName } from "@/lib/memberDisplay";
import {
  BUG_REPORT_STATUSES,
  BUG_STATUS_LABELS,
  BUG_STATUS_SORT_ORDER,
} from "@/lib/bugs";
import type { BugReportStatus } from "@prisma/client";
import BugReportCard from "@/components/bugs/BugReportCard";
import BugReportForm from "@/components/bugs/BugReportForm";
import { createBugReportAction } from "./actions";

export const dynamic = "force-dynamic";

const FILTERS = ["ALL", ...BUG_REPORT_STATUSES] as const;

function parseFilter(raw: string | undefined): (typeof FILTERS)[number] {
  if (raw && (FILTERS as readonly string[]).includes(raw)) {
    return raw as (typeof FILTERS)[number];
  }
  return "ALL";
}

export default async function BugsPage({
  searchParams,
}: {
  searchParams?: { filter?: string; submitted?: string; ticket?: string; error?: string };
}) {
  await requireProfile();
  const filter = parseFilter(searchParams?.filter);

  const [reports, counts] = await Promise.all([
    prisma.bugReport.findMany({
      where: filter === "ALL" ? undefined : { status: filter as BugReportStatus },
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
    }),
    prisma.bugReport.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  reports.sort((a, b) => {
    const statusDiff =
      (BUG_STATUS_SORT_ORDER[a.status] ?? 99) - (BUG_STATUS_SORT_ORDER[b.status] ?? 99);
    if (statusDiff !== 0) return statusDiff;
    return b.reportedAt.getTime() - a.reportedAt.getTime();
  });

  const countByStatus = Object.fromEntries(
    counts.map((c) => [c.status, c._count._all])
  ) as Partial<Record<BugReportStatus, number>>;
  const allCount = counts.reduce((sum, c) => sum + c._count._all, 0);

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-5xl tracking-wide">
          HUB <span className="text-gradient">BUG</span>
        </h1>
        <p className="mt-2 font-body text-off-white/60">
          Spot something broken? File it here. The board shows status, who found it, and how long
          it took to fix.
        </p>

        {searchParams?.submitted === "1" && (
          <p className="mt-4 rounded-lg border border-cyan/30 bg-cyan/10 px-4 py-3 font-body text-sm text-cyan">
            Thanks — your Hub Bug
            {searchParams.ticket ? (
              <>
                {" "}
                <span className="font-semibold">{searchParams.ticket}</span>
              </>
            ) : null}{" "}
            is logged as Reported. Admins have been notified.
          </p>
        )}

        <div className="mt-8">
          <BugReportForm action={createBugReportAction} error={searchParams?.error} />
        </div>

        <div className="mt-10 flex flex-wrap gap-2">
          <FilterChip href="/bugs" active={filter === "ALL"} label={`All (${allCount})`} />
          {BUG_REPORT_STATUSES.map((status) => (
            <FilterChip
              key={status}
              href={`/bugs?filter=${status}`}
              active={filter === status}
              label={`${BUG_STATUS_LABELS[status]} (${countByStatus[status] ?? 0})`}
            />
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-3">
          {reports.length === 0 && (
            <p className="glass rounded-2xl p-8 text-center font-body text-off-white/50">
              No Hub Bug reports{filter === "ALL" ? " yet" : " in this status"}.
            </p>
          )}
          {reports.map((report) => (
            <BugReportCard
              key={report.id}
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
                reporterName: getMemberDisplayName(report.reporter),
                reporterId: report.reporter.id,
              }}
            />
          ))}
        </div>
      </div>
    </main>
  );
}

function FilterChip({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1 font-body text-xs font-semibold transition ${
        active
          ? "border-cyan/50 bg-cyan/15 text-cyan"
          : "border-off-white/15 text-off-white/50 hover:border-off-white/30 hover:text-off-white/80"
      }`}
    >
      {label}
    </Link>
  );
}
