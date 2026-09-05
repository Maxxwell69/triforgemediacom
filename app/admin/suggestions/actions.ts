"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminPage } from "@/lib/session";
import { getMemberDisplayName } from "@/lib/memberDisplay";
import { updateSuggestionSchema } from "@/lib/validations/suggestion";
import {
  SUGGESTION_STATUS_LABELS,
  formatSuggestionTicket,
  suggestionBoardUrl,
} from "@/lib/suggestions";
import { requireSupportModule } from "@/lib/supportReads";
import { sendSuggestionStatusEmail } from "@/lib/email";

export async function updateSuggestionAction(formData: FormData) {
  requireSupportModule();
  await requireAdminPage();

  const parsed = updateSuggestionSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
    adminNotes: formData.get("adminNotes") ?? "",
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Invalid update");
  }

  const existing = await prisma.suggestion.findUnique({
    where: { id: parsed.data.id },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          profile: { select: { socialLinks: true, username: true, showRealName: true } },
          tiktokConnection: { select: { displayName: true, avatarUrl: true } },
          tiktokStatsSnapshot: { select: { nickname: true, avatarUrl: true, uniqueId: true } },
        },
      },
    },
  });
  if (!existing) throw new Error("Suggestion not found");

  const statusChanged = existing.status !== parsed.data.status;
  const notes = parsed.data.adminNotes?.trim() || null;

  await prisma.suggestion.update({
    where: { id: existing.id },
    data: {
      status: parsed.data.status,
      adminNotes: notes,
    },
  });

  if (statusChanged) {
    const ticketLabel = formatSuggestionTicket(existing.ticketNumber);
    const statusLabel = SUGGESTION_STATUS_LABELS[parsed.data.status];
    const name = getMemberDisplayName(existing.author);
    try {
      if (existing.author.email) {
        await sendSuggestionStatusEmail(existing.author.email, {
          name,
          ticketLabel,
          title: existing.title,
          statusLabel,
          url: suggestionBoardUrl(),
        });
      }
      await prisma.hubNotification.create({
        data: {
          userId: existing.authorId,
          title: `${ticketLabel} ${statusLabel}`,
          body: "Your suggestion was tagged. Open the board in the Hub — don't reply by email.",
          href: "/suggestions",
        },
      });
    } catch (err) {
      console.error("Failed to notify member of suggestion status:", err);
    }
  }

  revalidatePath("/suggestions");
  revalidatePath("/admin/suggestions");
}
