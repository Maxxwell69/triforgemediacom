"use client";

import type { BugReportStatus } from "@prisma/client";
import {
  BUG_REPORT_STATUSES,
  BUG_STATUS_LABELS,
  BUG_STATUS_STYLES,
  formatBugFixDuration,
  toDateTimeLocalValue,
} from "@/lib/bugs";
import { deleteBugReportAction, updateBugReportAction } from "@/app/admin/bugs/actions";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white outline-none transition focus:border-cyan/60";

type Props = {
  report: {
    id: string;
    title: string;
    description: string;
    status: BugReportStatus;
    reportedAt: Date | string;
    fixedAt: Date | string | null;
    adminNotes: string | null;
    reporterName: string;
  };
};

function asDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

/** Convert datetime-local (browser local) to ISO for the server. */
function localInputToIso(value: string): string {
  if (!value.trim()) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toISOString();
}

export default function BugReportAdminRow({ report }: Props) {
  const reportedAt = asDate(report.reportedAt);
  const fixedAt = report.fixedAt ? asDate(report.fixedAt) : null;
  const duration = formatBugFixDuration(reportedAt, fixedAt);

  async function onUpdate(formData: FormData) {
    formData.set("reportedAt", localInputToIso(String(formData.get("reportedAt") || "")));
    formData.set("fixedAt", localInputToIso(String(formData.get("fixedAt") || "")));
    await updateBugReportAction(formData);
  }

  return (
    <div className="glass flex flex-col gap-4 rounded-2xl p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <span
            className={`inline-block rounded-full border px-2.5 py-0.5 font-body text-[11px] font-semibold uppercase tracking-wide ${BUG_STATUS_STYLES[report.status]}`}
          >
            {BUG_STATUS_LABELS[report.status]}
          </span>
          <h3 className="mt-2 font-display text-xl tracking-wide text-off-white">
            {report.title}
          </h3>
          <p className="mt-1 font-body text-xs text-off-white/45">
            Found by <span className="text-cyan">{report.reporterName}</span>
            {duration ? ` · Time to fix: ${duration}` : ""}
          </p>
        </div>
        <form action={deleteBugReportAction}>
          <input type="hidden" name="id" value={report.id} />
          <button
            type="submit"
            className="rounded-lg border border-orange/30 px-3 py-1.5 font-body text-xs text-orange transition hover:bg-orange/10"
          >
            Delete
          </button>
        </form>
      </div>

      <p className="whitespace-pre-wrap font-body text-sm text-off-white/70">
        {report.description}
      </p>

      <form action={onUpdate} className="grid gap-3 border-t border-off-white/10 pt-4 sm:grid-cols-2">
        <input type="hidden" name="id" value={report.id} />
        <label className="flex flex-col gap-1 font-body text-xs text-off-white/50">
          Status
          <select name="status" defaultValue={report.status} className={fieldClass}>
            {BUG_REPORT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {BUG_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 font-body text-xs text-off-white/50">
          Entered
          <input
            type="datetime-local"
            name="reportedAt"
            required
            defaultValue={toDateTimeLocalValue(reportedAt)}
            className={fieldClass}
          />
        </label>
        <label className="flex flex-col gap-1 font-body text-xs text-off-white/50">
          Fixed
          <input
            type="datetime-local"
            name="fixedAt"
            defaultValue={fixedAt ? toDateTimeLocalValue(fixedAt) : ""}
            className={fieldClass}
          />
        </label>
        <label className="flex flex-col gap-1 font-body text-xs text-off-white/50 sm:col-span-2">
          Admin notes (internal)
          <textarea
            name="adminNotes"
            rows={2}
            defaultValue={report.adminNotes ?? ""}
            className={fieldClass}
          />
        </label>
        <button
          type="submit"
          className="rounded-lg bg-cyan/90 px-4 py-2 font-body text-sm font-semibold text-charcoal transition hover:brightness-110 sm:col-span-2 sm:justify-self-start"
        >
          Save changes
        </button>
      </form>
    </div>
  );
}
