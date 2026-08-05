import type { BugReportStatus } from "@prisma/client";

export const BUG_REPORT_STATUSES = [
  "REPORTED",
  "IN_PROGRESS",
  "FIXED",
  "COULD_NOT_REPRODUCE",
] as const satisfies readonly BugReportStatus[];

export const BUG_STATUS_LABELS: Record<BugReportStatus, string> = {
  REPORTED: "Reported",
  IN_PROGRESS: "Being worked on",
  FIXED: "Fixed",
  COULD_NOT_REPRODUCE: "Couldn't reproduce",
};

export const BUG_STATUS_STYLES: Record<BugReportStatus, string> = {
  REPORTED: "border-orange/40 bg-orange/10 text-orange",
  IN_PROGRESS: "border-cyan/40 bg-cyan/10 text-cyan",
  FIXED: "border-emerald-400/40 bg-emerald-400/10 text-emerald-400",
  COULD_NOT_REPRODUCE: "border-off-white/20 bg-off-white/5 text-off-white/50",
};

/** Old free-form chat channels that the Bug Reports board replaces. */
export function isLegacyBugChannelName(name: string): boolean {
  const n = name.trim().toLowerCase().replace(/^#/, "");
  return n === "bugs" || n === "bug" || n === "bug-reports" || n === "bugreports";
}

/** Human duration between reported and fixed (or null if not fixed). */
export function formatBugFixDuration(
  reportedAt: Date,
  fixedAt: Date | null | undefined
): string | null {
  if (!fixedAt) return null;
  const ms = fixedAt.getTime() - reportedAt.getTime();
  if (ms < 0) return null;

  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return "< 1 min";
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const remMin = minutes % 60;
  if (hours < 48) {
    return remMin > 0 ? `${hours}h ${remMin}m` : `${hours}h`;
  }

  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return remHours > 0 ? `${days}d ${remHours}h` : `${days}d`;
}

export function formatBugDateTime(date: Date): string {
  return date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

/** Value for `<input type="datetime-local">` in the viewer's local timezone. */
export function toDateTimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export const BUG_STATUS_SORT_ORDER: Record<BugReportStatus, number> = {
  REPORTED: 0,
  IN_PROGRESS: 1,
  FIXED: 2,
  COULD_NOT_REPRODUCE: 3,
};
