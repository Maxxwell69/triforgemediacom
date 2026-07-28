import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type DmAccessMode = "ADMIN" | "ADMIN_AND_MOD" | "ALLOWLIST";

export const DM_ACCESS_MODES: DmAccessMode[] = ["ADMIN", "ADMIN_AND_MOD", "ALLOWLIST"];

export function isTrueAdmin(role: UserRole | undefined | null): boolean {
  return role === "ADMIN";
}

export async function getChatSettings() {
  return prisma.chatSettings.upsert({
    where: { id: "global" },
    update: {},
    create: { id: "global", dmAccessMode: "ADMIN" },
  });
}

/** Who may open / start a new DM (ADMIN always). */
export async function canInitiateDm(userId: string, role: UserRole): Promise<boolean> {
  if (role === "ADMIN") return true;
  const settings = await getChatSettings();
  if (settings.dmAccessMode === "ADMIN_AND_MOD" && role === "MOD") return true;
  if (settings.dmAccessMode === "ALLOWLIST") {
    const row = await prisma.dmAllowedUser.findUnique({ where: { userId } });
    return !!row;
  }
  return false;
}

/** Read/write access to an existing conversation. */
export async function canAccessConversation(
  userId: string,
  role: UserRole,
  conversationId: string
): Promise<boolean> {
  if (isTrueAdmin(role)) return true;
  const participant = await prisma.directConversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  return !!participant;
}

export type ReactionSummary = {
  emoji: string;
  count: number;
  reactedByMe: boolean;
};

export function summarizeReactions(
  reactions: { emoji: string; userId: string }[],
  currentUserId: string
): ReactionSummary[] {
  const map = new Map<string, { count: number; reactedByMe: boolean }>();
  for (const r of reactions) {
    const entry = map.get(r.emoji) ?? { count: 0, reactedByMe: false };
    entry.count += 1;
    if (r.userId === currentUserId) entry.reactedByMe = true;
    map.set(r.emoji, entry);
  }
  return Array.from(map.entries())
    .map(([emoji, v]) => ({ emoji, ...v }))
    .sort((a, b) => b.count - a.count || a.emoji.localeCompare(b.emoji));
}
