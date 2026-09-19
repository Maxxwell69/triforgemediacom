import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdminPage } from "@/lib/session";
import { getMemberDisplayName } from "@/lib/memberDisplay";
import { formatChatTime } from "@/lib/formatChatTime";

export const dynamic = "force-dynamic";

export default async function AdminDmArchivePage() {
  await requireAdminPage();

  const conversations = await prisma.directConversation.findMany({
    where: { archivedAt: { not: null } },
    orderBy: { archivedAt: "desc" },
    take: 80,
    include: {
      archivedBy: {
        select: {
          name: true,
          profile: { select: { showRealName: true, socialLinks: true, username: true } },
          tiktokConnection: { select: { displayName: true, avatarUrl: true } },
          tiktokStatsSnapshot: { select: { nickname: true, avatarUrl: true, uniqueId: true } },
        },
      },
      participants: {
        include: {
          user: {
            select: {
              name: true,
              profile: { select: { showRealName: true, socialLinks: true, username: true } },
              tiktokConnection: { select: { displayName: true, avatarUrl: true } },
              tiktokStatsSnapshot: { select: { nickname: true, avatarUrl: true, uniqueId: true } },
            },
          },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { content: true },
      },
    },
  });

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <p className="font-body text-sm">
        <Link href="/admin/dms" className="text-off-white/50 hover:text-off-white">
          ← DM reports
        </Link>
      </p>
      <h1 className="mt-4 font-display text-5xl tracking-wide">
        DM <span className="text-gradient">ARCHIVE</span>
      </h1>
      <p className="mt-2 font-body text-sm text-off-white/50">
        Threads admins removed from member view. Open one to read the history.
      </p>

      <div className="mt-8 flex flex-col gap-2">
        {conversations.map((c) => (
          <Link
            key={c.id}
            href={`/dms/${c.id}`}
            className="glass rounded-xl px-4 py-3 transition hover:border-cyan/40"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="font-body text-sm font-semibold text-off-white">
                {c.participants.map((p) => getMemberDisplayName(p.user)).join(", ") || "Direct message"}
              </p>
              <span className="font-body text-[10px] text-off-white/35">
                Archived {c.archivedAt ? formatChatTime(c.archivedAt) : ""}
                {c.archivedBy ? ` by ${getMemberDisplayName(c.archivedBy)}` : ""}
              </span>
            </div>
            {c.messages[0] && (
              <p className="mt-1 truncate font-body text-xs text-off-white/45">{c.messages[0].content}</p>
            )}
          </Link>
        ))}
        {conversations.length === 0 && (
          <p className="font-body text-sm text-off-white/40">Archive is empty.</p>
        )}
      </div>
    </main>
  );
}
