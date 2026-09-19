import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdminPage } from "@/lib/session";
import { getMemberDisplayName } from "@/lib/memberDisplay";
import { formatChatTime } from "@/lib/formatChatTime";
import { updateDmReportStatus } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminDmsPage() {
  await requireAdminPage();

  const [reports, conversations] = await Promise.all([
    prisma.dmReport.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: { select: { showRealName: true, socialLinks: true, username: true } },
            tiktokConnection: { select: { displayName: true, avatarUrl: true } },
            tiktokStatsSnapshot: { select: { nickname: true, avatarUrl: true, uniqueId: true } },
          },
        },
        conversation: {
          select: {
            id: true,
            archivedAt: true,
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    profile: { select: { showRealName: true, socialLinks: true, username: true } },
                    tiktokConnection: { select: { displayName: true, avatarUrl: true } },
                    tiktokStatsSnapshot: { select: { nickname: true, avatarUrl: true, uniqueId: true } },
                  },
                },
              },
            },
          },
        },
      },
    }),
    prisma.directConversation.findMany({
      where: { archivedAt: null },
      orderBy: { updatedAt: "desc" },
      take: 40,
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                profile: { select: { showRealName: true, socialLinks: true, username: true } },
                tiktokConnection: { select: { displayName: true, avatarUrl: true } },
                tiktokStatsSnapshot: { select: { nickname: true, avatarUrl: true, uniqueId: true } },
              },
            },
          },
        },
        _count: { select: { reports: true } },
      },
    }),
  ]);

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="font-display text-5xl tracking-wide">
        DIRECT <span className="text-gradient">MESSAGES</span>
      </h1>
      <p className="mt-2 font-body text-sm text-off-white/50">
        Member reports and open threads. Archive a DM to hide it from members.
      </p>
      <p className="mt-3 font-body text-sm">
        <Link href="/admin/dms/archive" className="text-cyan hover:underline">
          Open archive →
        </Link>
      </p>

      <section className="mt-10">
        <h2 className="font-display text-2xl tracking-wide">Reports</h2>
        {reports.length === 0 ? (
          <p className="mt-3 font-body text-sm text-off-white/40">No DM reports yet.</p>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            {reports.map((report) => {
              const people = report.conversation.participants
                .map((p) => getMemberDisplayName(p.user))
                .join(", ");
              return (
                <article key={report.id} className="glass rounded-2xl p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-body text-sm text-off-white">
                      {getMemberDisplayName(report.reporter)} reported{" "}
                      <Link href={`/dms/${report.conversation.id}`} className="text-cyan hover:underline">
                        {people || "a conversation"}
                      </Link>
                    </p>
                    <span className="font-body text-[10px] uppercase tracking-wide text-off-white/40">
                      {report.status} · {formatChatTime(report.createdAt)}
                    </span>
                  </div>
                  <p className="mt-2 font-body text-sm text-off-white/70">{report.reason}</p>
                  {report.status === "OPEN" && (
                    <form action={updateDmReportStatus} className="mt-3 flex gap-2">
                      <input type="hidden" name="id" value={report.id} />
                      <button
                        name="status"
                        value="REVIEWED"
                        className="rounded-lg bg-cyan/15 px-3 py-1.5 font-body text-xs font-semibold text-cyan"
                      >
                        Mark reviewed
                      </button>
                      <button
                        name="status"
                        value="DISMISSED"
                        className="rounded-lg bg-off-white/10 px-3 py-1.5 font-body text-xs text-off-white/70"
                      >
                        Dismiss
                      </button>
                    </form>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl tracking-wide">Open threads</h2>
        <div className="mt-4 flex flex-col gap-2">
          {conversations.map((c) => (
            <Link
              key={c.id}
              href={`/dms/${c.id}`}
              className="glass flex items-center justify-between rounded-xl px-4 py-3 font-body text-sm text-off-white/80 hover:border-cyan/40"
            >
              <span>
                {c.participants.map((p) => getMemberDisplayName(p.user)).join(", ") || "Direct message"}
              </span>
              <span className="text-xs text-off-white/35">
                {c._count.reports > 0 ? `${c._count.reports} report${c._count.reports === 1 ? "" : "s"} · ` : ""}
                {formatChatTime(c.updatedAt)}
              </span>
            </Link>
          ))}
          {conversations.length === 0 && (
            <p className="font-body text-sm text-off-white/40">No open DMs.</p>
          )}
        </div>
      </section>
    </main>
  );
}
