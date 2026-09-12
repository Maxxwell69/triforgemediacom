"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/rbac";
import { hubHas } from "@/lib/hub/modules";
import { assignOnboardingProgress } from "@/lib/onboarding/engine";

export async function assignMemberOnboarding(formData: FormData) {
  if (!hubHas("onboardingChecklist")) {
    throw new Error("Onboarding is not enabled");
  }
  const session = await auth();
  if (!session || !isAdminRole(session.user.role)) {
    throw new Error("Not authorized");
  }
  const admin = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, status: true },
  });
  if (!admin || admin.status !== "ACTIVE" || !isAdminRole(admin.role)) {
    throw new Error("Not authorized");
  }
  const userId = String(formData.get("userId") || "");
  if (!userId) throw new Error("User is required");
  await assignOnboardingProgress(userId, admin.id);
  revalidatePath("/admin/onboarding");
  revalidatePath("/admin/users");
  revalidatePath("/home");
  revalidatePath("/account");
  revalidatePath(`/admin/users/${userId}`);
}
