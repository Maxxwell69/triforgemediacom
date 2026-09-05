import Link from "next/link";
import type { SupportTicketStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { requireSupportModule, markSupportTicketsRead } from "@/lib/supportReads";
import {
  SUPPORT_CATEGORY_LABELS,
  SUPPORT_STATUS_LABELS,
  SUPPORT_STATUS_SORT_ORDER,
  SUPPORT_STATUS_STYLES,
  SUPPORT_TICKET_STATUSES,
  formatSupportTicket,
} from "@/lib/support";
import TicketForm from "@/components/support/TicketForm";
import { createSupportTicketAction } from "../actions";
import { hubHas } from "@/lib/hub/modules";

export const dynamic = "force-dynamic";

const FILTERS = ["ALL", "OPEN_ACTIVE", ...SUPPORT_TICKET_STATUSES] as const;

function parseFilter(raw: string | undefined): (typeof FILTERS)[number] {
  if (raw && (FILTERS as readonly string[]).includes(raw)) {
    return raw as (typeof FILTERS)[number];
  }
  return "OPEN_ACTIVE";
}

export default async function SupportTicketsPage({
  searchParams,
}: {
  searchParams?: { filter?: string; error?: string };
}) {
  requireSupportModule();
  const { user } = await requireProfile();
  await markSupportTicketsRead(user.id).catch(() => {});
  const filter = parseFilter(searchParams?.filter);

  const where =
    filter === "ALL"
      ? { requesterId: user.id }
      : filter === "OPEN_ACTIVE"
        ? {
            requesterId: user.id,
            status: { in: ["OPEN", "WAITING_ON_MEMBER", "WAITING_ON_STAFF"] as SupportTicketStatus[] },
          }
        : { requesterId: user.id, status: filter as SupportTicketStatus };

  const tickets = await prisma.supportTicket.findMany({
    where,
    orderBy: { lastActivityAt: "desc" },
    include: { _count: { select: { messages: true } } },
  });

  tickets.sort((a, b) => {
    const statusDiff =
      (SUPPORT_STATUS_SORT_ORDER[a.status] ?? 99) - (SUPPORT_STATUS_SORT_ORDER[b.status] ?? 99);
    if (statusDiff !== 0) return statusDiff;
    return b.lastActivityAt.getTime() - a.lastActivityAt.getTime();
  });

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <Link href="/support" className="font-body text-sm text-cyan hover:underline">
          ← Support
        </Link>
        <h1 className="mt-4 font-display text-5xl tracking-wide">
          MY <span className="text-gradient">TICKETS</span>
        </h1>
        <p className="mt-2 font-body text-off-white/60">
          Conversation lives here. Emails only tell you to come back to this portal.
        </p>

        <div id="new" className="mt-8 scroll-mt-24">
          <TicketForm
            action={createSupportTicketAction}
            error={searchParams?.error}
            showHubBugLink={hubHas("hubBug")}
          />
        </div>

        <div className="mt-10 flex flex-wrap gap-2">
          <FilterChip
            href="/support/tickets"
            active={filter === "OPEN_ACTIVE"}
            label="Active"
          />
          <FilterChip href="/support/tickets?filter=ALL" active={filter === "ALL"} label="All" />
          {SUPPORT_TICKET_STATUSES.map((status) => (
            <FilterChip
              key={status}
              href={`/support/tickets?filter=${status}`}
              active={filter === status}
              label={SUPPORT_STATUS_LABELS[status]}
            />
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-3">
          {tickets.length === 0 && (
            <p className="glass rounded-2xl p-8 text-center font-body text-off-white/50">
              No tickets{filter === "ALL" ? " yet" : " in this filter"}.
            </p>
          )}
          {tickets.map((ticket) => (
            <Link
              key={ticket.id}
              href={`/support/tickets/${ticket.id}`}
              className="glass rounded-2xl p-5 transition hover:border-cyan/40"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-body text-xs font-semibold text-cyan">
                  {formatSupportTicket(ticket.ticketNumber)}
                </span>
                <span
                  className={`rounded-full border px-2 py-0.5 font-body text-[11px] font-semibold ${SUPPORT_STATUS_STYLES[ticket.status]}`}
                >
                  {SUPPORT_STATUS_LABELS[ticket.status]}
                </span>
                <span className="font-body text-[11px] text-off-white/40">
                  {SUPPORT_CATEGORY_LABELS[ticket.category]}
                </span>
              </div>
              <h2 className="mt-2 font-display text-xl tracking-wide">{ticket.subject}</h2>
              <p className="mt-1 font-body text-xs text-off-white/45">
                {ticket._count.messages} message{ticket._count.messages === 1 ? "" : "s"} ·{" "}
                {ticket.lastActivityAt.toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
              </p>
            </Link>
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
