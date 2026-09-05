"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { getMemberDisplayName } from "@/lib/memberDisplay";
import { getAlertableAdminEmails } from "@/lib/adminAlerts";
import { createSuggestionSchema } from "@/lib/validations/suggestion";
import { formatSuggestionTicket, suggestionAdminUrl } from "@/lib/suggestions";
import { requireSupportModule } from "@/lib/supportReads";
import { sendSuggestionAdminAlert } from "@/lib/email";

const authorSelect = {
  name: true,
  email: true,
  profile: { select: { socialLinks: true, username: true, showRealName: true } },
  tiktokConnection: { select: { displayName: true, avatarUrl: true } },
  tiktokStatsSnapshot: { select: { nickname: true, avatarUrl: true, uniqueId: true } },
} as const;

export async function createSuggestionAction(formData: FormData) {
  requireSupportModule();
  const { user } = await requireProfile();

  const parsed = createSuggestionSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
  });
  if (!parsed.success) {
    redirect(
      `/suggestions?error=${encodeURIComponent(parsed.error.issues[0]?.message || "Invalid suggestion")}`
    );
  }

  const suggestion = await prisma.suggestion.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      authorId: user.id,
      status: "NEW",
    },
  });

  try {
    const author = await prisma.user.findUnique({
      where: { id: user.id },
      select: authorSelect,
    });
    const authorName = author ? getMemberDisplayName(author) : user.name || user.email || "Member";
    const admins = await getAlertableAdminEmails();
    await sendSuggestionAdminAlert(admins, {
      ticketLabel: formatSuggestionTicket(suggestion.ticketNumber),
      title: suggestion.title,
      authorName,
      preview: suggestion.description.slice(0, 400),
      adminUrl: suggestionAdminUrl(),
    });
    const adminUsers = await prisma.user.findMany({
      where: { role: "ADMIN", status: "ACTIVE", receivesAdminAlerts: true },
      select: { id: true },
    });
    await Promise.all(
      adminUsers.map((admin) =>
        prisma.hubNotification.create({
          data: {
            userId: admin.id,
            title: `${formatSuggestionTicket(suggestion.ticketNumber)} submitted`,
            body: `${authorName}: ${suggestion.title}`.slice(0, 2000),
            href: "/admin/suggestions",
          },
        })
      )
    );
  } catch (err) {
    console.error("Failed to send suggestion admin alert:", err);
  }

  revalidatePath("/suggestions");
  revalidatePath("/admin/suggestions");
  redirect(
    `/suggestions?submitted=1&ticket=${encodeURIComponent(formatSuggestionTicket(suggestion.ticketNumber))}`
  );
}
