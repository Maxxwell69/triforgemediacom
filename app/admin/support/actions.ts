"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { SupportTicketStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminPage } from "@/lib/session";
import { isAdminRole } from "@/lib/rbac";
import { getMemberDisplayName } from "@/lib/memberDisplay";
import { updateSupportTicketSchema } from "@/lib/validations/support";
import {
  SUPPORT_STATUS_LABELS,
  formatSupportTicket,
  supportTicketPortalUrl,
} from "@/lib/support";
import { requireSupportModule } from "@/lib/supportReads";
import {
  sendSupportTicketClosedEmail,
  sendSupportTicketStatusEmail,
} from "@/lib/email";

export async function updateSupportTicketAction(formData: FormData) {
  requireSupportModule();
  await requireAdminPage();

  const parsed = updateSupportTicketSchema.safeParse({
    ticketId: formData.get("ticketId"),
    status: formData.get("status"),
    assigneeId: formData.get("assigneeId") ?? "",
  });
  if (!parsed.success) {
    redirect(
      `/admin/support/${String(formData.get("ticketId") || "")}?error=${encodeURIComponent(parsed.error.issues[0]?.message || "Invalid update")}`
    );
  }

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: parsed.data.ticketId },
    include: {
      requester: { select: { id: true, email: true, name: true } },
    },
  });
  if (!ticket) {
    redirect("/admin/support");
  }

  const assigneeId = parsed.data.assigneeId?.trim() || null;
  if (assigneeId) {
    const assignee = await prisma.user.findUnique({
      where: { id: assigneeId },
      select: { role: true, status: true },
    });
    if (!assignee || assignee.status !== "ACTIVE" || !isAdminRole(assignee.role)) {
      redirect(
        `/admin/support/${ticket.id}?error=${encodeURIComponent("Assignee must be an active admin or mod.")}`
      );
    }
  }

  const statusChanged = ticket.status !== parsed.data.status;
  const nextStatus = parsed.data.status as SupportTicketStatus;

  await prisma.supportTicket.update({
    where: { id: ticket.id },
    data: {
      status: nextStatus,
      assigneeId,
      lastActivityAt: statusChanged ? new Date() : ticket.lastActivityAt,
    },
  });

  if (statusChanged && ticket.requester.email) {
    const ticketLabel = formatSupportTicket(ticket.ticketNumber);
    const url = supportTicketPortalUrl(ticket.id);
    const name = ticket.requester.name || ticket.requester.email;
    try {
      if (nextStatus === "CLOSED" || nextStatus === "RESOLVED") {
        await sendSupportTicketClosedEmail(ticket.requester.email, {
          name,
          ticketLabel,
          subject: ticket.subject,
          url,
        });
      } else {
        await sendSupportTicketStatusEmail(ticket.requester.email, {
          name,
          ticketLabel,
          subject: ticket.subject,
          url,
          statusLabel: SUPPORT_STATUS_LABELS[nextStatus],
        });
      }
      await prisma.hubNotification.create({
        data: {
          userId: ticket.requesterId,
          title: `${ticketLabel} ${SUPPORT_STATUS_LABELS[nextStatus]}`,
          body: "Open the support portal to see the update. Don't reply by email.",
          href: `/support/tickets/${ticket.id}`,
        },
      });
    } catch (err) {
      console.error("Failed to notify member of support status change:", err);
    }
  }

  revalidatePath("/admin/support");
  revalidatePath(`/admin/support/${ticket.id}`);
  revalidatePath("/support/tickets");
  revalidatePath(`/support/tickets/${ticket.id}`);
  redirect(`/admin/support/${ticket.id}`);
}

export async function assignToMeAction(formData: FormData) {
  requireSupportModule();
  const admin = await requireAdminPage();
  const ticketId = String(formData.get("ticketId") || "");
  if (!ticketId) redirect("/admin/support");

  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { assigneeId: admin.id },
  });

  revalidatePath("/admin/support");
  revalidatePath(`/admin/support/${ticketId}`);
  redirect(`/admin/support/${ticketId}`);
}
