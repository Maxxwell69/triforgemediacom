import { prisma } from "@/lib/prisma";
import { sendInviteEmail } from "@/lib/email";
import { generateInviteToken, inviteTokenExpiry, inviteUrl } from "@/lib/invite";

/**
 * Approves a still-PENDING application and sends the invite email without
 * waiting on a human admin to click "approve" — used for tracks where we
 * want applicants straight into the Hub (MN applicants at submission time,
 * CN applicants when they click through on the TikTok Creator Network CTA).
 *
 * No-ops (returns false) if the application isn't still PENDING, so it can
 * never clobber a decision an admin already made in the meantime.
 */
export async function autoApproveApplication(applicationId: string): Promise<boolean> {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { user: true },
  });
  if (!application || application.status !== "PENDING") return false;

  const token = generateInviteToken();
  await prisma.$transaction([
    prisma.application.update({
      where: { id: application.id },
      data: {
        status: "APPROVED",
        reviewedAt: new Date(),
        inviteToken: token,
        inviteTokenExpiresAt: inviteTokenExpiry(),
      },
    }),
    prisma.user.update({
      where: { id: application.userId },
      data: { status: "INVITED" },
    }),
  ]);

  await sendInviteEmail(application.user.email, application.user.name || "there", inviteUrl(token));
  return true;
}
