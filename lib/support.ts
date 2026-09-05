import type { SupportTicketCategory, SupportTicketStatus, UserRole } from "@prisma/client";
import { SAMPLE_APP_URL } from "@/lib/emailLayout";
import { isAdminRole } from "@/lib/rbac";

export const SUPPORT_TICKET_STATUSES = [
  "OPEN",
  "WAITING_ON_MEMBER",
  "WAITING_ON_STAFF",
  "RESOLVED",
  "CLOSED",
] as const satisfies readonly SupportTicketStatus[];

export const SUPPORT_TICKET_CATEGORIES = [
  "ACCOUNT",
  "BILLING",
  "MEMBERSHIP",
  "CONTENT",
  "OTHER",
] as const satisfies readonly SupportTicketCategory[];

export const SUPPORT_STATUS_LABELS: Record<SupportTicketStatus, string> = {
  OPEN: "Open",
  WAITING_ON_MEMBER: "Waiting on you",
  WAITING_ON_STAFF: "Waiting on staff",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

export const SUPPORT_STATUS_LABELS_STAFF: Record<SupportTicketStatus, string> = {
  OPEN: "Open",
  WAITING_ON_MEMBER: "Waiting on member",
  WAITING_ON_STAFF: "Waiting on staff",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

export const SUPPORT_CATEGORY_LABELS: Record<SupportTicketCategory, string> = {
  ACCOUNT: "Account",
  BILLING: "Billing",
  MEMBERSHIP: "Membership",
  CONTENT: "Content / TikTask",
  OTHER: "Other",
};

export const SUPPORT_STATUS_STYLES: Record<SupportTicketStatus, string> = {
  OPEN: "border-orange/40 bg-orange/10 text-orange",
  WAITING_ON_MEMBER: "border-cyan/40 bg-cyan/10 text-cyan",
  WAITING_ON_STAFF: "border-amber-400/40 bg-amber-400/10 text-amber-300",
  RESOLVED: "border-emerald-400/40 bg-emerald-400/10 text-emerald-400",
  CLOSED: "border-off-white/20 bg-off-white/5 text-off-white/50",
};

export const SUPPORT_STATUS_SORT_ORDER: Record<SupportTicketStatus, number> = {
  OPEN: 0,
  WAITING_ON_STAFF: 1,
  WAITING_ON_MEMBER: 2,
  RESOLVED: 3,
  CLOSED: 4,
};

/** Public trackable ticket label, e.g. TF-0007. */
export function formatSupportTicket(ticketNumber: number): string {
  return `TF-${String(ticketNumber).padStart(4, "0")}`;
}

export function supportAppUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || SAMPLE_APP_URL).replace(/\/$/, "");
}

export function supportTicketPortalUrl(ticketId: string): string {
  return `${supportAppUrl()}/support/tickets/${ticketId}`;
}

export function supportTicketAdminUrl(ticketId: string): string {
  return `${supportAppUrl()}/admin/support/${ticketId}`;
}

export function canViewSupportTicket(
  role: UserRole,
  requesterId: string,
  userId: string
): boolean {
  return isAdminRole(role) || requesterId === userId;
}

export function ticketIsClosed(status: SupportTicketStatus): boolean {
  return status === "CLOSED" || status === "RESOLVED";
}
