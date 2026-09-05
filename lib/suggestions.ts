import type { SuggestionStatus } from "@prisma/client";
import { SAMPLE_APP_URL } from "@/lib/emailLayout";

export const SUGGESTION_STATUSES = [
  "NEW",
  "ACCEPTED",
  "WORKING_ON_IT",
  "APPLIED",
  "REJECTED",
] as const satisfies readonly SuggestionStatus[];

export const SUGGESTION_STATUS_LABELS: Record<SuggestionStatus, string> = {
  NEW: "New",
  ACCEPTED: "Accepted",
  WORKING_ON_IT: "Working on it",
  APPLIED: "Applied",
  REJECTED: "Rejected",
};

export const SUGGESTION_STATUS_STYLES: Record<SuggestionStatus, string> = {
  NEW: "border-orange/40 bg-orange/10 text-orange",
  ACCEPTED: "border-cyan/40 bg-cyan/10 text-cyan",
  WORKING_ON_IT: "border-amber-400/40 bg-amber-400/10 text-amber-300",
  APPLIED: "border-emerald-400/40 bg-emerald-400/10 text-emerald-400",
  REJECTED: "border-off-white/20 bg-off-white/5 text-off-white/50",
};

export const SUGGESTION_STATUS_SORT_ORDER: Record<SuggestionStatus, number> = {
  NEW: 0,
  ACCEPTED: 1,
  WORKING_ON_IT: 2,
  APPLIED: 3,
  REJECTED: 4,
};

export function formatSuggestionTicket(ticketNumber: number): string {
  return `SG-${String(ticketNumber).padStart(4, "0")}`;
}

export function suggestionAppUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || SAMPLE_APP_URL).replace(/\/$/, "");
}

export function suggestionBoardUrl(): string {
  return `${suggestionAppUrl()}/suggestions`;
}

export function suggestionAdminUrl(): string {
  return `${suggestionAppUrl()}/admin/suggestions`;
}
