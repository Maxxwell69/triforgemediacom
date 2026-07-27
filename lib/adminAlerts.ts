import { prisma } from "@/lib/prisma";

/**
 * Emails for admins who should receive operational notifications (new
 * applications, etc). Excludes admins who've opted out via
 * User.receivesAdminAlerts — e.g. figurehead/shared accounts that shouldn't
 * get a flood of alert emails.
 */
export async function getAlertableAdminEmails(): Promise<string[]> {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", status: "ACTIVE", receivesAdminAlerts: true },
    select: { email: true },
  });
  return admins.map((a) => a.email);
}
