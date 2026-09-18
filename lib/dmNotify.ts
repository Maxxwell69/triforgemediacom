import { prisma } from "@/lib/prisma";
import { parseMentionSegments } from "@/lib/chatMentions";

function previewText(content: string) {
  const plain = parseMentionSegments(content)
    .map((s) => (s.type === "mention" ? `@${s.name}` : s.value))
    .join("")
    .replace(/\s+/g, " ")
    .trim();
  if (!plain) return "You have a new message.";
  return plain.length > 140 ? `${plain.slice(0, 137)}…` : plain;
}

/** Bell + /notifications for everyone else in the thread. Never fails the DM send. */
export async function notifyDmRecipients(opts: {
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
}) {
  try {
    const others = await prisma.directConversationParticipant.findMany({
      where: { conversationId: opts.conversationId, userId: { not: opts.senderId } },
      select: { userId: true },
    });
    if (others.length === 0) return;

    const href = `/dms/${opts.conversationId}`;
    const title = "You have a new message";
    const from = opts.senderName.trim() || "Someone";
    const preview = previewText(opts.content);
    const body = (preview === "You have a new message." ? `${from} sent you a direct message.` : `${from}: ${preview}`).slice(
      0,
      2000
    );

    await Promise.all(
      others.map(async ({ userId }) => {
        const existing = await prisma.hubNotification.findFirst({
          where: { userId, href, readAt: null },
          select: { id: true },
        });
        if (existing) {
          await prisma.hubNotification.update({
            where: { id: existing.id },
            data: { title, body, createdAt: new Date() },
          });
          return;
        }
        await prisma.hubNotification.create({
          data: { userId, title, body, href },
        });
      })
    );
  } catch (err) {
    console.error("notifyDmRecipients failed", err);
  }
}
