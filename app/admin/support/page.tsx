import Link from "next/link";
import type { SupportTicketCategory, SupportTicketStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminPage } from "@/lib/session";
import { getMemberDisplayName } from "@/lib/memberDisplay";
import { requireSupportModule, markSupportTicketsRead } from "@/lib/supportReads";
import {
  SUPPORT_CATEGORY_LABELS,
  SUPPORT_STATUS_LABELS_STAFF,
  SUPPORT_STATUS_SORT_ORDER,
  SUPPORT_STATUS_STYLES,
  SUPPORT_TICKET_CATEGORIES,
  SUPPORT_TICKET_STATUSES,
  formatSupportTicket,
} from "@/lib/support";

export const dynamic = "force-dynamic";

export default async function AdminSupportQueuePage({
  searchParams,
}: {
  searchParams?: { status?: string; category?: string; assignee?: string };
}) {
  requireSupportModule();
  const admin = await requireAdminPage();
  await markSupportTicketsRead(admin.id).catch(() => {});

  const status =
    searchParams?.status &&
    (SUPPORT_TICKET_STATUSES as readonly string[]).includes(searchParams.status)
      ? (searchParams.status as SupportTicketStatus)
      : undefined;
  const category =
    searchParams?.category &&
    (SUPPORT_TICKET_CATEGORIES as readonly string[]).includes(searchParams.category)
      ? (searchParams.category as SupportTicketCategory)
      : undefined;
  const assignee = searchParams?.assignee;

  const tickets = await prisma.supportTicket.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(category ? { category } : {}),
      ...(assignee === "me"
        ? { assigneeId: admin.id }
        : assignee === "unassigned"
          ? { assigneeId: null }
          : {}),
    },
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
      assignee: { select: { id: true, name: true, email: true } },
      _count: { select: { messages: true } },
    },
  });

  tickets.sort((a, b) => {
    const statusDiff =
      (SUPPORT_STATUS_SORT_ORDER[a.status] ?? 99) - (SUPPORT_STATUS_SORT_ORDER[b.status] ?? 99);
    if (statusDiff !== 0) return statusDiff;
    return b.lastActivityAt.getTime() - a.lastActivityAt.getTime();
  });

  const openCount = tickets.filter(
    (t) => t.status === "OPEN" || t.status === "WAITING_ON_STAFF"
  ).length;

  const qs = (next: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = {
      status: status ?? "",
      category: category ?? "",
      assignee: assignee ?? "",
      ...next,
    };
    for (const [k, v] of Object.entries(merged)) {
      if (v) params.set(k, v);
    }
    const s = params.toString();
    return s ? `/admin/support?${s}` : "/admin/support";
  };

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-5xl tracking-wide">
        SUPPORT <span className="text-gradient">QUEUE</span>
      </h1>
      <p className="mt-2 font-body text-off-white/60">
        Member tickets. Replies stay in the portal — emails only send them back here. FAQ lives at{" "}
        <Link href="/admin/faq" className="text-cyan hover:underline">
          /admin/faq
        </Link>
        .
      </p>
      <p className="mt-3 font-body text-sm text-off-white/45">
        {openCount} need staff · {tickets.length} shown
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <FilterChip href={qs({ status: "" })} active={!status} label="All statuses" />
        {SUPPORT_TICKET_STATUSES.map((s) => (
          <FilterChip
            key={s}
            href={qs({ status: s })}
            active={status === s}
            label={SUPPORT_STATUS_LABELS_STAFF[s]}
          />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <FilterChip href={qs({ category: "" })} active={!category} label="All categories" />
        {SUPPORT_TICKET_CATEGORIES.map((c) => (
          <FilterChip
            key={c}
            href={qs({ category: c })}
            active={category === c}
            label={SUPPORT_CATEGORY_LABELS[c]}
          />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <FilterChip href={qs({ assignee: "" })} active={!assignee} label="Anyone" />
        <FilterChip href={qs({ assignee: "me" })} active={assignee === "me"} label="Assigned to me" />
        <FilterChip
          href={qs({ assignee: "unassigned" })}
          active={assignee === "unassigned"}
          label="Unassigned"
        />
      </div>

      <div className="mt-8 flex flex-col gap-3">
        {tickets.length === 0 && (
          <p className="glass rounded-2xl p-8 text-center font-body text-off-white/50">
            No tickets match these filters.
          </p>
        )}
        {tickets.map((ticket) => (
          <Link
            key={ticket.id}
            href={`/admin/support/${ticket.id}`}
            className="glass rounded-2xl p-5 transition hover:border-cyan/40"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-body text-xs font-semibold text-cyan">
                {formatSupportTicket(ticket.ticketNumber)}
              </span>
              <span
                className={`rounded-full border px-2 py-0.5 font-body text-[11px] font-semibold ${SUPPORT_STATUS_STYLES[ticket.status]}`}
              >
                {SUPPORT_STATUS_LABELS_STAFF[ticket.status]}
              </span>
              <span className="font-body text-[11px] text-off-white/40">
                {SUPPORT_CATEGORY_LABELS[ticket.category]}
              </span>
            </div>
            <h2 className="mt-2 font-display text-xl tracking-wide">{ticket.subject}</h2>
            <p className="mt-1 font-body text-xs text-off-white/45">
              {getMemberDisplayName(ticket.requester)}
              {ticket.requester.email ? ` · ${ticket.requester.email}` : ""} ·{" "}
              {ticket.assignee
                ? `Assigned ${ticket.assignee.name || ticket.assignee.email}`
                : "Unassigned"}{" "}
              · {ticket._count.messages} message{ticket._count.messages === 1 ? "" : "s"}
            </p>
          </Link>
        ))}
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
