import Link from "next/link";
import type { BugReportPlatform, BugReportStatus } from "@prisma/client";
import {
  BUG_PLATFORM_LABELS,
  BUG_STATUS_LABELS,
  BUG_STATUS_STYLES,
  formatBugDateTime,
  formatBugFixDuration,
} from "@/lib/bugs";

export type BugReportCardData = {
  id: string;
  title: string;
  description: string;
  status: BugReportStatus;
  platform: BugReportPlatform;
  pageUrl: string | null;
  screenshotUrl: string | null;
  reportedAt: Date;
  fixedAt: Date | null;
  reporterName: string;
  reporterId: string;
  adminNotes?: string | null;
  showAdminNotes?: boolean;
};

export default function BugReportCard({ report }: { report: BugReportCardData }) {
  const duration = formatBugFixDuration(report.reportedAt, report.fixedAt);
  const isFixed = report.status === "FIXED";
  const isClosed =
    report.status === "FIXED" || report.status === "COULD_NOT_REPRODUCE";

  return (
    <article
      className={`glass rounded-2xl p-5 transition ${
        isClosed ? "opacity-90" : ""
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-2.5 py-0.5 font-body text-[11px] font-semibold uppercase tracking-wide ${BUG_STATUS_STYLES[report.status]}`}
            >
              {BUG_STATUS_LABELS[report.status]}
            </span>
            <span className="rounded-full border border-off-white/15 px-2.5 py-0.5 font-body text-[11px] text-off-white/55">
              {BUG_PLATFORM_LABELS[report.platform]}
            </span>
            {isFixed && (
              <span className="font-body text-[11px] font-semibold text-emerald-400/80">
                ✓ Fixed
              </span>
            )}
            {report.status === "REPORTED" && (
              <span className="font-body text-[11px] text-orange/70">✓ Logged</span>
            )}
          </div>
          <h3
            className={`mt-2 font-display text-xl tracking-wide text-off-white ${
              isFixed ? "line-through decoration-off-white/30" : ""
            }`}
          >
            {report.title}
          </h3>
        </div>
      </div>

      <p className="mt-3 whitespace-pre-wrap font-body text-sm leading-relaxed text-off-white/70">
        {report.description}
      </p>

      {(report.pageUrl || report.screenshotUrl) && (
        <div className="mt-3 flex flex-col gap-2">
          {report.pageUrl && (
            <p className="font-body text-xs text-off-white/45">
              URL:{" "}
              <a
                href={
                  report.pageUrl.startsWith("http")
                    ? report.pageUrl
                    : report.pageUrl.startsWith("/")
                      ? report.pageUrl
                      : `https://${report.pageUrl}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="break-all text-cyan hover:underline"
              >
                {report.pageUrl}
              </a>
            </p>
          )}
          {report.screenshotUrl && (
            <a
              href={report.screenshotUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block max-w-md overflow-hidden rounded-xl border border-off-white/10"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={report.screenshotUrl}
                alt="Bug screenshot"
                className="max-h-64 w-full object-contain bg-black/40"
              />
            </a>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-off-white/10 pt-3 font-body text-xs text-off-white/45">
        <p>
          Found by{" "}
          <Link
            href={`/members/${report.reporterId}`}
            className="font-semibold text-cyan transition hover:text-cyan/80"
          >
            {report.reporterName}
          </Link>
        </p>
        <p>Reported {formatBugDateTime(report.reportedAt)}</p>
        {report.fixedAt && <p>Fixed {formatBugDateTime(report.fixedAt)}</p>}
        {duration && (
          <p className="font-semibold text-off-white/70">
            Time to fix: <span className="text-cyan">{duration}</span>
          </p>
        )}
      </div>

      {report.showAdminNotes && report.adminNotes && (
        <p className="mt-3 rounded-lg border border-off-white/10 bg-off-white/[0.03] px-3 py-2 font-body text-xs text-off-white/50">
          <span className="font-semibold text-off-white/60">Admin notes: </span>
          {report.adminNotes}
        </p>
      )}
    </article>
  );
}
