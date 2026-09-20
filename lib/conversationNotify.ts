import "server-only";

import { prisma } from "@/lib/prisma";
import { hubHas } from "@/lib/hub/modules";
import { CONVERSATION_PURPOSE } from "@/lib/conversations";
import { resolveOutreachMailer } from "@/lib/hub/resendSettings";
import { sendConversationOutreachEmail } from "@/lib/email";

function previewText(content: string) {
  const plain = content.replace(/\s+/g, " ").trim();
  if (!plain) return "You have a new message.";
  return plain.length > 160 ? `${plain.slice(0, 157)}…` : plain;
}

/** Email the member when staff writes in an outreach thread. Never fails the send. */
export async function notifyConversationEmail(opts: {
  conversationId: string;
  senderId: string;
  content: string;
}) {
  if (!hubHas("conversations")) return;
  try {
    const conversation = await prisma.directConversation.findUnique({
      where: { id: opts.conversationId },
      select: {
        purpose: true,
        participants: {
          where: { leftAt: null },
          select: {
            userId: true,
            user: { select: { id: true, email: true, name: true } },
          },
        },
      },
    });
    if (!conversation || conversation.purpose !== CONVERSATION_PURPOSE) return;

    const others = conversation.participants.filter((p) => p.userId !== opts.senderId);
    const mailer = await resolveOutreachMailer();
    if (mailer.mode === "missing" || !mailer.from) {
      console.warn("conversation email skipped — hub Resend key not set");
      return;
    }

    const url = `${mailer.hubOrigin}/dms/${opts.conversationId}`;
    const preview = previewText(opts.content);

    await Promise.all(
      others.map(async ({ user }) => {
        const to = user.email?.trim();
        if (!to) return;
        await sendConversationOutreachEmail({
          to,
          memberName: user.name?.trim() || "there",
          hubName: mailer.hubName,
          preview,
          url,
          resend: mailer.resend,
          from: mailer.from,
        });
      })
    );
  } catch (err) {
    console.error("notifyConversationEmail failed", err);
  }
}
