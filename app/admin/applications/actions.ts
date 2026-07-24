"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/rbac";
import { generateInviteToken, inviteUrl } from "@/lib/invite";
import { sendInviteEmail, sendRejectionEmail } from "@/lib/email";

async function requireAdmin() {
  const session = await auth();
  if (!session || !isAdminRole(session.user.role)) {
    throw new Error("Not authorized");
  }
  return session;
}

export async function approveApplication(formData: FormData) {
  const applicationId = String(formData.get("applicationId"));
  const notes = String(formData.get("notes") || "");
  const session = await requireAdmin();

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { user: true },
  });
  if (!application) throw new Error("Application not found");

  const token = generateInviteToken();

  await prisma.application.update({
    where: { id: applicationId },
    data: {
      status: "APPROVED",
      reviewNotes: notes || null,
      reviewedById: session.user.id,
      reviewedAt: new Date(),
      inviteToken: token,
    },
  });

  await prisma.user.update({
    where: { id: application.userId },
    data: { status: "INVITED" },
  });

  await sendInviteEmail(
    application.user.email,
    application.user.name || "there",
    inviteUrl(token)
  );

  revalidatePath("/admin/applications");
}

export async function rejectApplication(formData: FormData) {
  const applicationId = String(formData.get("applicationId"));
  const notes = String(formData.get("notes") || "");
  const session = await requireAdmin();

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { user: true },
  });
  if (!application) throw new Error("Application not found");

  await prisma.application.update({
    where: { id: applicationId },
    data: {
      status: "REJECTED",
      reviewNotes: notes || null,
      reviewedById: session.user.id,
      reviewedAt: new Date(),
    },
  });

  await sendRejectionEmail(application.user.email, application.user.name || "there", notes);

  revalidatePath("/admin/applications");
}
