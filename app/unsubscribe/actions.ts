"use server";

import { prisma } from "@/lib/prisma";
import { verifyBroadcastUnsubscribeToken } from "@/lib/broadcastUnsubscribe";

export async function unsubscribeBroadcastAction(
  token: string
): Promise<{ error: string | null }> {
  const verified = verifyBroadcastUnsubscribeToken(token);
  if (!verified) return { error: "Invalid unsubscribe link." };

  await prisma.user.update({
    where: { id: verified.userId },
    data: { broadcastEmailsOptIn: false },
  });
  return { error: null };
}

export async function resubscribeBroadcastAction(
  token: string
): Promise<{ error: string | null }> {
  const verified = verifyBroadcastUnsubscribeToken(token);
  if (!verified) return { error: "Invalid link." };

  await prisma.user.update({
    where: { id: verified.userId },
    data: { broadcastEmailsOptIn: true },
  });
  return { error: null };
}
