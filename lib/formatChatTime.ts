/** Safari/iOS throws RangeError on empty locale arrays and some hour/dateStyle combos. */

function asDate(value: string | Date | null | undefined): Date | null {
  if (value == null || value === "") return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function fallbackTime(date: Date) {
  const hours = date.getHours();
  const hour12 = hours % 12 || 12;
  const ampm = hours >= 12 ? "PM" : "AM";
  return `${hour12}:${pad2(date.getMinutes())} ${ampm}`;
}

/** 3/3/26 — no leading zeros, two-digit year. */
function shortDate(date: Date) {
  const yy = String(date.getFullYear()).slice(-2);
  return `${date.getMonth() + 1}/${date.getDate()}/${yy}`;
}

export function formatChatTime(value: string | Date | null | undefined): string {
  const date = asDate(value);
  if (!date) return "";
  let time: string;
  try {
    time = date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  } catch {
    time = fallbackTime(date);
  }
  return `${time} ${shortDate(date)}`;
}

export function formatChatDateTime(value: string | Date | null | undefined): string {
  const date = asDate(value);
  if (!date) return "";
  try {
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return `${date.toDateString()} ${fallbackTime(date)}`;
  }
}
