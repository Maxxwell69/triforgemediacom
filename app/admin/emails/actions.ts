"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/rbac";
import { getTemplateDef } from "@/lib/emailTemplates";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    throw new Error("Not authorized");
  }
  return session;
}

export async function saveEmailTemplate(formData: FormData) {
  const session = await requireAdmin();
  const key = String(formData.get("key") || "");
  const def = getTemplateDef(key);
  if (!def) throw new Error("Unknown template");

  const subject = String(formData.get("subject") || "").trim();
  const bodyHtml = String(formData.get("bodyHtml") || "").trim();
  if (!subject) throw new Error("Subject is required");
  if (!bodyHtml) throw new Error("Body HTML is required");
  if (subject.length > 300) throw new Error("Subject is too long");
  if (bodyHtml.length > 100_000) throw new Error("Body is too long");

  await prisma.emailTemplate.upsert({
    where: { key },
    update: {
      subject,
      bodyHtml,
      wrapsInLayout: def.wrapsInLayout,
      updatedByName: session.user.name || session.user.email || "Admin",
    },
    create: {
      key,
      subject,
      bodyHtml,
      wrapsInLayout: def.wrapsInLayout,
      updatedByName: session.user.name || session.user.email || "Admin",
    },
  });

  revalidatePath("/admin/emails");
  revalidatePath(`/admin/emails/${key}`);
}

export async function resetEmailTemplate(formData: FormData) {
  await requireAdmin();
  const key = String(formData.get("key") || "");
  if (!getTemplateDef(key)) throw new Error("Unknown template");
  await prisma.emailTemplate.deleteMany({ where: { key } });
  revalidatePath("/admin/emails");
  revalidatePath(`/admin/emails/${key}`);
}
