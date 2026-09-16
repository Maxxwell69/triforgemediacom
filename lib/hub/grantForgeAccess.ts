import "server-only";

import { prisma } from "@/lib/prisma";
import { sendInviteEmail } from "@/lib/email";
import { ensureUserInHomeGroup } from "@/lib/groups";
import {
  generateInviteToken,
  hub0SignInUrl,
  inviteTokenExpiry,
  inviteUrl,
} from "@/lib/invite";

/**
 * A Create Hub invite is not a Forge Hub invite.
 * Call this when Hub 0 actually invites the person (approve, add member, admin grant).
 */
export async function grantForgeHubAccess(userId: string): Promise<{ error: string | null }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { application: true },
  });
  if (!user) return { error: "User not found." };
  if (user.status === "BANNED") return { error: "That account is banned." };
  if (user.platformAccess) {
    return { error: "They already have TriForge Hub access." };
  }

  if (user.passwordHash) {
    await prisma.user.update({
      where: { id: user.id },
      data: { platformAccess: true, status: "ACTIVE" },
    });
    await ensureUserInHomeGroup(user.id);
    try {
      await sendInviteEmail(user.email, user.name || "there", hub0SignInUrl());
    } catch (err) {
      console.error("Forge access email failed", user.email, err);
      return {
        error: `Forge access was granted, but the email failed (${
          err instanceof Error ? err.message : "unknown error"
        }). They can sign in at hub.triforgemedia.com.`,
      };
    }
    return { error: null };
  }

  const token = generateInviteToken();
  const expiresAt = inviteTokenExpiry();
  await prisma.user.update({
    where: { id: user.id },
    data: { platformAccess: true, status: "INVITED" },
  });
  if (user.application) {
    await prisma.application.update({
      where: { id: user.application.id },
      data: {
        status: "APPROVED",
        inviteToken: token,
        inviteTokenExpiresAt: expiresAt,
        reviewedAt: new Date(),
      },
    });
  } else {
    await prisma.application.create({
      data: {
        userId: user.id,
        answers: { name: user.name, addedDirectlyByAdmin: true },
        status: "APPROVED",
        inviteToken: token,
        inviteTokenExpiresAt: expiresAt,
        reviewedAt: new Date(),
      },
    });
  }

  try {
    await sendInviteEmail(user.email, user.name || "there", inviteUrl(token));
  } catch (err) {
    console.error("Forge invite email failed", user.email, err);
    return {
      error: `Forge access was saved, but the email failed (${
        err instanceof Error ? err.message : "unknown error"
      }). Resend from Users.`,
    };
  }
  return { error: null };
}
