import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { getMemberDisplayName } from "@/lib/memberDisplay";
import { isAdminRole } from "@/lib/rbac";
import { requireSupportModule, markSupportTicketsRead } from "@/lib/supportReads";
import {
  SUPPORT_CATEGORY_LABELS,
  SUPPORT_STATUS_LABELS,
  SUPPORT_STATUS_STYLES,
  canViewSupportTicket,
  formatSupportTicket,
  ticketIsClosed,
} from "@/lib/support";
import {
  closeSupportTicketAction,
  reopenSupportTicketAction,
  replySupportTicketAction,
} from "../../actions";

export const dynamic = "force-dynamic";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60";

export default async function SupportTicketDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { submitted?: string; error?: string };
}) {
  requireSupportModule();
  const { user } = await requireProfile();
  await markSupportTicketsRead(user.id).catch(() => {});

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: params.id },
    include: {
      requester: {
        select: {
          id: true,
          name: true,
          email: true,
          profile: { select: { socialLinks: true, username: true, showRealName: true } },
          tiktokConnection: { select: { displayName: true, avatarUrl: true } },
          tiktokStatsSnapshot: { select: { nickname: true, avatarUrl: true, uniqueId: true } },
        },
      },
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
  });

  if (!ticket || !canViewSupportTicket(user.role, ticket.requesterId, user.id)) {
    notFound();
  }

  const closed = ticketIsClosed(ticket.status);
  const isOwner = ticket.requesterId === user.id;
  const ticketLabel = formatSupportTicket(ticket.ticketNumber);

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <Link href="/support/tickets" className="font-body text-sm text-cyan hover:underline">
          ← My tickets
        </Link>
        {isAdminRole(user.role) && (
          <Link
            href={`/admin/support/${ticket.id}`}
            className="ml-4 font-body text-sm text-off-white/45 hover:text-cyan"
          >
            Admin view
          </Link>
        )}

        {searchParams?.submitted === "1" && (
          <p className="mt-4 rounded-lg border border-cyan/30 bg-cyan/10 px-4 py-3 font-body text-sm text-cyan">
            Ticket {ticketLabel} is open. We emailed you a link back here — reply in this portal.
          </p>
        )}
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
            {SUPPORT_STATUS_LABELS[ticket.status]}
          </span>
          <span className="font-body text-xs text-off-white/40">
            {SUPPORT_CATEGORY_LABELS[ticket.category]}
          </span>
        </div>
        <h1 className="mt-2 font-display text-4xl tracking-wide">{ticket.subject}</h1>
        <p className="mt-2 font-body text-xs text-off-white/45">
          Opened by {getMemberDisplayName(ticket.requester)} ·{" "}
          {ticket.createdAt.toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
        </p>

        <div className="mt-8 flex flex-col gap-3">
          {ticket.messages.map((message) => {
            const staff = isAdminRole(message.author.role);
            return (
              <article
                key={message.id}
                className={`rounded-2xl border p-4 ${
                  staff
                    ? "border-cyan/20 bg-cyan/5"
                    : "border-off-white/10 bg-off-white/5"
                }`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-body text-sm font-semibold text-off-white">
                    {getMemberDisplayName(message.author)}
                    {staff ? (
                      <span className="ml-2 font-body text-[11px] font-medium text-cyan">
                        Staff
                      </span>
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
            <label className="font-body text-sm text-off-white/70" htmlFor="ticket-reply">
              Reply
            </label>
            <textarea
              id="ticket-reply"
              name="body"
              required
              minLength={2}
              maxLength={5000}
              rows={4}
              placeholder="Write your reply here — not in email."
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

        {isOwner && !closed && (
          <form action={closeSupportTicketAction} className="mt-4">
            <input type="hidden" name="ticketId" value={ticket.id} />
            <button
              type="submit"
              className="font-body text-xs text-off-white/45 underline-offset-2 hover:text-off-white/80 hover:underline"
            >
              Close this ticket
            </button>
          </form>
        )}

        {isOwner && ticket.status === "CLOSED" && (
          <form action={reopenSupportTicketAction} className="mt-6">
            <input type="hidden" name="ticketId" value={ticket.id} />
            <button
              type="submit"
              className="rounded-lg border border-off-white/20 px-5 py-2 font-body text-sm text-off-white/80 transition hover:border-cyan/40 hover:text-cyan"
            >
              Reopen ticket
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
