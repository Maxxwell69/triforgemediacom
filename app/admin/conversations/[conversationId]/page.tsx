import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdminPage } from "@/lib/session";
import { isTrueAdmin, summarizeReactions } from "@/lib/dmAccess";
import { chatAuthorSelect, getMemberDisplayName } from "@/lib/memberDisplay";
import { toChatAuthor } from "@/lib/chatAuthors";
import { markDmNotificationsRead } from "@/lib/dmSidebar";
import {
  getOutreachConversation,
  requireConversationsModule,
} from "@/lib/conversations";
import DmChatView from "@/components/chat/DmChatView";
import { setConversationClosedAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminConversationThreadPage({
  params,
}: {
  params: { conversationId: string };
}) {
  requireConversationsModule();
  const user = await requireAdminPage();
  const conversation = await getOutreachConversation(params.conversationId);
  if (!conversation) notFound();

  await markDmNotificationsRead(user.id, conversation.id);

  const [dbUser, messages] = await Promise.all([
    prisma.user.findUnique({ where: { id: user.id }, select: { mutedUntil: true } }),
    prisma.directMessage.findMany({
      where: { conversationId: conversation.id },
      include: {
        user: { select: chatAuthorSelect },
        reactions: { select: { emoji: true, userId: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 80,
    }),
  ]);

  const others = conversation.participants.map((p) => p.user).filter((u) => u.id !== user.id);
  const title =
    others.length > 0 ? others.map((u) => getMemberDisplayName(u)).join(", ") : "Conversation";

  const initialMessages = [...messages].reverse().map(({ reactions, user: author, ...message }) => ({
    id: message.id,
    content: message.content,
    createdAt: message.createdAt,
    user: toChatAuthor(author),
    reactions: summarizeReactions(reactions, user.id),
    staffSenderId: message.staffSenderId,
  }));

  const staffLog = messages
    .filter((m) => m.staffSenderId)
    .map((m) => ({
      id: m.id,
      at: m.createdAt,
      name: getMemberDisplayName(m.user),
      preview: m.content,
    }));

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col">
      <div className="mx-auto w-full max-w-4xl px-6 pt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-body text-xs text-off-white/40">
            {conversation.closedAt
              ? `Closed${conversation.closedBy ? ` by ${conversation.closedBy.name || conversation.closedBy.email}` : ""}`
              : "Open · emails ask them to reply here"}
          </p>
          <form action={setConversationClosedAction}>
            <input type="hidden" name="conversationId" value={conversation.id} />
            <input type="hidden" name="closed" value={conversation.closedAt ? "0" : "1"} />
            <button
              type="submit"
              className="rounded-lg border border-off-white/15 px-3 py-1.5 font-body text-xs text-off-white/70 hover:text-off-white"
            >
              {conversation.closedAt ? "Reopen" : "Close"}
            </button>
          </form>
        </div>
        {staffLog.length > 0 ? (
          <details className="mt-4 rounded-xl border border-off-white/10 bg-off-white/[0.03] px-4 py-3">
            <summary className="cursor-pointer font-body text-xs uppercase tracking-wide text-off-white/45">
              Staff history ({staffLog.length})
            </summary>
            <ul className="mt-3 flex flex-col gap-2">
              {staffLog.map((row) => (
                <li key={row.id} className="font-body text-xs text-off-white/60">
                  <span className="text-off-white/80">{row.name}</span>
                  {" · "}
                  {row.at.toLocaleString()}
                  {" — "}
                  <span className="text-off-white/50">{row.preview.slice(0, 140)}</span>
                </li>
              ))}
            </ul>
          </details>
        ) : null}
        <p className="mt-3 font-body text-xs">
          <Link href={`/dms/${conversation.id}`} className="text-cyan hover:underline">
            Open as member DM →
          </Link>
        </p>
      </div>
      <DmChatView
        conversationId={conversation.id}
        title={title}
        currentUserId={user.id}
        initialMessages={initialMessages}
        initialMutedUntil={dbUser?.mutedUntil ?? null}
        isAdmin={isTrueAdmin(user.role)}
        backHref="/admin/conversations"
        backLabel="Conversations"
        subtitle="They get an email with a button. Reply stays on this hub."
      />
    </div>
  );
}
