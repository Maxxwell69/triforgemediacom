"use server";

import { revalidatePath } from "next/cache";
import type { DmReportStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminPage } from "@/lib/session";

export async function updateDmReportStatus(formData: FormData) {
  const admin = await requireAdminPage();
  const id = String(formData.get("id") || "").trim();
  const status = String(formData.get("status") || "") as DmReportStatus;
  if (!id || !["OPEN", "REVIEWED", "DISMISSED"].includes(status)) {
    throw new Error("Invalid report update");
  }
  await prisma.dmReport.update({
    where: { id },
    data: {
      status,
      reviewedAt: new Date(),
      reviewedById: admin.id,
    },
  });
  revalidatePath("/admin/dms");
}
