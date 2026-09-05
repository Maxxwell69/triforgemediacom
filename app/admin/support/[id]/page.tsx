import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdminPage } from "@/lib/session";
import { getMemberDisplayName } from "@/lib/memberDisplay";
import { isAdminRole } from "@/lib/rbac";
import { requireSupportModule, markSupportTicketsRead } from "@/lib/supportReads";
import {
  SUPPORT_CATEGORY_LABELS,
  SUPPORT_STATUS_LABELS_STAFF,
  SUPPORT_STATUS_STYLES,
  SUPPORT_TICKET_STATUSES,
  formatSupportTicket,
  ticketIsClosed,
} from "@/lib/support";
import { replySupportTicketAction } from "@/app/(community)/support/actions";
import { assignToMeAction, updateSupportTicketAction } from "../actions";

export const dynamic = "force-dynamic";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60";

export default async function AdminSupportTicketPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { error?: string };
}) {
  requireSupportModule();
  const admin = await requireAdminPage();
  await markSupportTicketsRead(admin.id).catch(() => {});

  const [ticket, staff] = await Promise.all([
    prisma.supportTicket.findUnique({
      where: { id: params.id },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            profile: { select: { socialLinks: true, username: true, showRealName: true } },
            tiktokConnection: { select: { displayName: true, avatarUrl: true } },
            tiktokStatsSnapshot: {
              select: { nickname: true, avatarUrl: true, uniqueId: true },
            },
          },
        },
        assignee: { select: { id: true, name: true, email: true } },
        messages: {
          orderBy: { createdAt: "asc" },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                role: true,
                profile: { select: { socialLinks: true, username: true, showRealName: true } },
                tiktokConnection: { select: { displayName: true, avatarUrl: true } },
                tiktokStatsSnapshot: {
                  select: { nickname: true, avatarUrl: true, uniqueId: true },
                },
              },
            },
          },
        },
      },
    }),
    prisma.user.findMany({
      where: { status: "ACTIVE", role: { in: ["ADMIN", "MOD"] } },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!ticket) notFound();

  const closed = ticketIsClosed(ticket.status);
  const ticketLabel = formatSupportTicket(ticket.ticketNumber);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/admin/support" className="font-body text-sm text-cyan hover:underline">
        ← Queue
      </Link>
      <Link
        href={`/support/tickets/${ticket.id}`}
        className="ml-4 font-body text-sm text-off-white/45 hover:text-cyan"
      >
        Member view
      </Link>

      {searchParams?.error && (
        <p className="mt-4 rounded-lg border border-orange/30 bg-orange/10 px-4 py-3 font-body text-sm text-orange">
          {searchParams.error}
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <span className="font-body text-sm font-semibold text-cyan">{ticketLabel}</span>
        <span
          className={`rounded-full border px-2 py-0.5 font-body text-[11px] font-semibold ${SUPPORT_STATUS_STYLES[ticket.status]}`}
        >
          {SUPPORT_STATUS_LABELS_STAFF[ticket.status]}
        </span>
        <span className="font-body text-xs text-off-white/40">
          {SUPPORT_CATEGORY_LABELS[ticket.category]}
        </span>
      </div>
      <h1 className="mt-2 font-display text-4xl tracking-wide">{ticket.subject}</h1>
      <p className="mt-2 font-body text-sm text-off-white/55">
        {getMemberDisplayName(ticket.requester)}
        {ticket.requester.email ? ` · ${ticket.requester.email}` : ""} ·{" "}
        <Link href={`/admin/users/${ticket.requester.id}`} className="text-cyan hover:underline">
          Profile
        </Link>
      </p>

      <form
        action={updateSupportTicketAction}
        className="glass mt-8 grid gap-3 rounded-2xl p-6 sm:grid-cols-2"
      >
        <input type="hidden" name="ticketId" value={ticket.id} />
        <label className="flex flex-col gap-1 font-body text-xs text-off-white/50">
          Status
          <select name="status" defaultValue={ticket.status} className={fieldClass}>
            {SUPPORT_TICKET_STATUSES.map((s) => (
              <option key={s} value={s}>
                {SUPPORT_STATUS_LABELS_STAFF[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 font-body text-xs text-off-white/50">
          Assignee
          <select name="assigneeId" defaultValue={ticket.assigneeId ?? ""} className={fieldClass}>
            <option value="">Unassigned</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name || s.email}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <button
            type="submit"
            className="rounded-lg bg-orange px-5 py-2 font-body text-sm font-semibold text-off-white shadow-glow transition hover:brightness-110"
          >
            Save
          </button>
        </div>
      </form>
      <form action={assignToMeAction} className="mt-2">
        <input type="hidden" name="ticketId" value={ticket.id} />
        <button
          type="submit"
          className="font-body text-xs text-off-white/45 underline-offset-2 hover:text-cyan hover:underline"
        >
          Assign to me
        </button>
      </form>

      <div className="mt-8 flex flex-col gap-3">
        {ticket.messages.map((message) => {
          const staffMsg = isAdminRole(message.author.role);
          return (
            <article
              key={message.id}
              className={`rounded-2xl border p-4 ${
                staffMsg ? "border-cyan/20 bg-cyan/5" : "border-off-white/10 bg-off-white/5"
              }`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-body text-sm font-semibold text-off-white">
                  {getMemberDisplayName(message.author)}
                  {staffMsg ? (
                    <span className="ml-2 font-body text-[11px] font-medium text-cyan">Staff</span>
                  ) : null}
                </p>
                <p className="font-body text-[11px] text-off-white/40">
                  {message.createdAt.toLocaleString([], {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>
              <p className="mt-2 whitespace-pre-wrap font-body text-sm text-off-white/80">
                {message.body}
              </p>
            </article>
          );
        })}
      </div>

      {!closed && (
        <form action={replySupportTicketAction} className="glass mt-8 flex flex-col gap-3 rounded-2xl p-6">
          <input type="hidden" name="ticketId" value={ticket.id} />
          <label className="font-body text-sm text-off-white/70" htmlFor="admin-ticket-reply">
            Reply as staff
          </label>
          <textarea
            id="admin-ticket-reply"
            name="body"
            required
            minLength={2}
            maxLength={5000}
            rows={4}
            placeholder="Member gets an email to open the portal — they cannot reply by email."
            className={fieldClass}
          />
          <button
            type="submit"
            className="self-start rounded-lg bg-orange px-6 py-2.5 font-body text-sm font-semibold text-off-white shadow-glow transition hover:brightness-110"
          >
            Send reply
          </button>
        </form>
      )}
    </main>
  );
}
