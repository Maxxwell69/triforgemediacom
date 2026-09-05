"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { SupportTicketStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { isAdminRole } from "@/lib/rbac";
import { getMemberDisplayName } from "@/lib/memberDisplay";
import { getAlertableAdminEmails } from "@/lib/adminAlerts";
import {
  createSupportTicketSchema,
  supportTicketReplySchema,
} from "@/lib/validations/support";
import {
  SUPPORT_CATEGORY_LABELS,
  canViewSupportTicket,
  formatSupportTicket,
  supportTicketAdminUrl,
  supportTicketPortalUrl,
  ticketIsClosed,
} from "@/lib/support";
import { requireSupportModule } from "@/lib/supportReads";
import {
  sendSupportTicketAdminAlert,
  sendSupportTicketClosedEmail,
  sendSupportTicketOpenedEmail,
  sendSupportTicketReplyEmail,
  sendSupportTicketStaffReplyAlert,
} from "@/lib/email";

const memberSelect = {
  id: true,
  name: true,
  email: true,
  profile: { select: { socialLinks: true, username: true, showRealName: true } },
  tiktokConnection: { select: { displayName: true, avatarUrl: true } },
  tiktokStatsSnapshot: { select: { nickname: true, avatarUrl: true, uniqueId: true } },
} as const;

async function notifyHub(userId: string, title: string, body: string, href: string) {
  await prisma.hubNotification.create({
    data: {
      userId,
      title: title.slice(0, 160),
      body: body.slice(0, 2000),
      href,
    },
  });
}

export async function createSupportTicketAction(formData: FormData) {
  requireSupportModule();
  const { user } = await requireProfile();

  const parsed = createSupportTicketSchema.safeParse({
    subject: formData.get("subject"),
    category: formData.get("category"),
    body: formData.get("body"),
  });
  if (!parsed.success) {
    redirect(
      `/support/tickets?error=${encodeURIComponent(parsed.error.issues[0]?.message || "Invalid ticket")}`
    );
  }

  const ticket = await prisma.supportTicket.create({
    data: {
      subject: parsed.data.subject,
      category: parsed.data.category,
      status: "OPEN",
      requesterId: user.id,
      lastActivityAt: new Date(),
      messages: {
        create: {
          authorId: user.id,
          body: parsed.data.body,
        },
      },
    },
  });

  const ticketLabel = formatSupportTicket(ticket.ticketNumber);
  const portalUrl = supportTicketPortalUrl(ticket.id);
  const requesterName = user.name || user.email || "Member";

  try {
    if (user.email) {
      await sendSupportTicketOpenedEmail(user.email, {
        name: requesterName,
        ticketLabel,
        subject: ticket.subject,
        url: portalUrl,
      });
    }
  } catch (err) {
    console.error("Failed to send support ticket opened email:", err);
  }

  try {
    const admins = await getAlertableAdminEmails();
    await sendSupportTicketAdminAlert(admins, {
      ticketLabel,
      subject: ticket.subject,
      requesterName,
      categoryLabel: SUPPORT_CATEGORY_LABELS[ticket.category],
      preview: parsed.data.body.slice(0, 400),
      adminUrl: supportTicketAdminUrl(ticket.id),
    });
    const adminUsers = await prisma.user.findMany({
      where: { role: "ADMIN", status: "ACTIVE", receivesAdminAlerts: true },
      select: { id: true },
    });
    await Promise.all(
      adminUsers.map((admin) =>
        notifyHub(
          admin.id,
          `${ticketLabel} opened`,
          `${requesterName}: ${ticket.subject}`,
          `/admin/support/${ticket.id}`
        )
      )
    );
  } catch (err) {
    console.error("Failed to send support ticket admin alert:", err);
  }

  revalidatePath("/support/tickets");
  revalidatePath("/admin/support");
  redirect(`/support/tickets/${ticket.id}?submitted=1`);
}

export async function replySupportTicketAction(formData: FormData) {
  requireSupportModule();
  const { user } = await requireProfile();

  const parsed = supportTicketReplySchema.safeParse({
    ticketId: formData.get("ticketId"),
    body: formData.get("body"),
  });
  if (!parsed.success) {
    redirect(
      `/support/tickets/${String(formData.get("ticketId") || "")}?error=${encodeURIComponent(parsed.error.issues[0]?.message || "Invalid reply")}`
    );
  }

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: parsed.data.ticketId },
    include: {
      requester: { select: memberSelect },
      assignee: { select: { id: true, email: true, name: true, role: true } },
    },
  });
  if (!ticket || !canViewSupportTicket(user.role, ticket.requesterId, user.id)) {
    redirect("/support/tickets");
  }
  if (ticketIsClosed(ticket.status)) {
    redirect(`/support/tickets/${ticket.id}?error=${encodeURIComponent("This ticket is closed.")}`);
  }

  const staffReply = isAdminRole(user.role) && ticket.requesterId !== user.id;
  const nextStatus: SupportTicketStatus = staffReply ? "WAITING_ON_MEMBER" : "WAITING_ON_STAFF";

  await prisma.supportTicket.update({
    where: { id: ticket.id },
    data: {
      status: nextStatus,
      lastActivityAt: new Date(),
      messages: {
        create: {
          authorId: user.id,
          body: parsed.data.body,
        },
      },
    },
  });

  const ticketLabel = formatSupportTicket(ticket.ticketNumber);
  const portalUrl = supportTicketPortalUrl(ticket.id);
  const authorName =
    getMemberDisplayName(
      staffReply
        ? { name: user.name ?? null, email: user.email ?? null, profile: null }
        : ticket.requester
    ) ||
    user.name ||
    "Member";

  if (staffReply) {
    try {
      const memberEmail = ticket.requester.email;
      if (memberEmail) {
        await sendSupportTicketReplyEmail(memberEmail, {
          name: getMemberDisplayName(ticket.requester),
          ticketLabel,
          subject: ticket.subject,
          url: portalUrl,
        });
      }
      await notifyHub(
        ticket.requesterId,
        `Reply on ${ticketLabel}`,
        "The team replied — open the support portal (don't reply by email).",
        `/support/tickets/${ticket.id}`
      );
    } catch (err) {
      console.error("Failed to notify member of support reply:", err);
    }
  } else {
    try {
      const staffEmails = ticket.assignee?.email
        ? [ticket.assignee.email]
        : await getAlertableAdminEmails();
      await sendSupportTicketStaffReplyAlert(staffEmails, {
        ticketLabel,
        subject: ticket.subject,
        requesterName: authorName,
        categoryLabel: SUPPORT_CATEGORY_LABELS[ticket.category],
        preview: parsed.data.body.slice(0, 400),
        adminUrl: supportTicketAdminUrl(ticket.id),
      });
      if (ticket.assigneeId) {
        await notifyHub(
          ticket.assigneeId,
          `Reply on ${ticketLabel}`,
          `${authorName} replied.`,
          `/admin/support/${ticket.id}`
        );
      } else {
        const admins = await prisma.user.findMany({
          where: { role: "ADMIN", status: "ACTIVE", receivesAdminAlerts: true },
          select: { id: true },
        });
        await Promise.all(
          admins.map((admin) =>
            notifyHub(
              admin.id,
              `Reply on ${ticketLabel}`,
              `${authorName} replied.`,
              `/admin/support/${ticket.id}`
            )
          )
        );
      }
    } catch (err) {
      console.error("Failed to notify staff of support reply:", err);
    }
  }

  revalidatePath(`/support/tickets/${ticket.id}`);
  revalidatePath("/support/tickets");
  revalidatePath("/admin/support");
  revalidatePath(`/admin/support/${ticket.id}`);
  redirect(staffReply && isAdminRole(user.role) ? `/admin/support/${ticket.id}` : `/support/tickets/${ticket.id}`);
}

export async function closeSupportTicketAction(formData: FormData) {
  requireSupportModule();
  const { user } = await requireProfile();
  const ticketId = String(formData.get("ticketId") || "");
  if (!ticketId) redirect("/support/tickets");

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: { requester: { select: { id: true, email: true, name: true } } },
  });
  if (!ticket || ticket.requesterId !== user.id) {
    redirect("/support/tickets");
  }
  if (ticket.status === "CLOSED") {
    redirect(`/support/tickets/${ticket.id}`);
  }

  await prisma.supportTicket.update({
    where: { id: ticket.id },
    data: { status: "CLOSED", lastActivityAt: new Date() },
  });

  try {
    if (ticket.requester.email) {
      await sendSupportTicketClosedEmail(ticket.requester.email, {
        name: ticket.requester.name || ticket.requester.email,
        ticketLabel: formatSupportTicket(ticket.ticketNumber),
        subject: ticket.subject,
        url: supportTicketPortalUrl(ticket.id),
      });
    }
  } catch (err) {
    console.error("Failed to send ticket closed email:", err);
  }

  revalidatePath(`/support/tickets/${ticket.id}`);
  revalidatePath("/support/tickets");
  revalidatePath("/admin/support");
  redirect(`/support/tickets/${ticket.id}`);
}

export async function reopenSupportTicketAction(formData: FormData) {
  requireSupportModule();
  const { user } = await requireProfile();
  const ticketId = String(formData.get("ticketId") || "");
  if (!ticketId) redirect("/support/tickets");

  const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
  if (!ticket || ticket.requesterId !== user.id) {
    redirect("/support/tickets");
  }

  await prisma.supportTicket.update({
    where: { id: ticket.id },
    data: { status: "WAITING_ON_STAFF", lastActivityAt: new Date() },
  });

  revalidatePath(`/support/tickets/${ticket.id}`);
  revalidatePath("/support/tickets");
  revalidatePath("/admin/support");
  redirect(`/support/tickets/${ticket.id}`);
}
