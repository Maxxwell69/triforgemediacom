"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/rbac";
import { rewardSchema, parseStockField } from "@/lib/validations/reward";

async function requireAdmin() {
  const session = await auth();
  if (!session || !isAdminRole(session.user.role)) {
    throw new Error("Not authorized");
  }
  return session;
}

function parseRewardForm(formData: FormData) {
  const parsed = rewardSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    costPoints: formData.get("costPoints"),
    imageUrl: formData.get("imageUrl"),
    stock: formData.get("stock"),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Invalid reward");
  }
  return parsed.data;
}

export async function createReward(formData: FormData) {
  await requireAdmin();
  const data = parseRewardForm(formData);
  const stock = parseStockField(formData.get("stock"));

  await prisma.reward.create({
    data: {
      name: data.name,
      description: data.description || null,
      costPoints: data.costPoints,
      imageUrl: data.imageUrl || null,
      stock,
    },
  });

  revalidatePath("/admin/rewards");
}

export async function updateReward(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const data = parseRewardForm(formData);
  const stock = parseStockField(formData.get("stock"));

  await prisma.reward.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description || null,
      costPoints: data.costPoints,
      imageUrl: data.imageUrl || null,
      stock,
    },
  });

  revalidatePath("/admin/rewards");
  revalidatePath("/rewards");
}

export async function setRewardActive(id: string, isActive: boolean) {
  await requireAdmin();
  await prisma.reward.update({ where: { id }, data: { isActive } });
  revalidatePath("/admin/rewards");
  revalidatePath("/rewards");
}

export async function fulfillRedemption(redemptionId: string) {
  await requireAdmin();

  const redemption = await prisma.rewardRedemption.findUnique({ where: { id: redemptionId } });
  if (!redemption || redemption.status !== "PENDING") {
    throw new Error("Only pending redemptions can be fulfilled");
  }

  await prisma.rewardRedemption.update({
    where: { id: redemptionId },
    data: { status: "FULFILLED", fulfilledAt: new Date() },
  });

  revalidatePath("/admin/rewards");
}

export async function cancelRedemption(redemptionId: string) {
  await requireAdmin();

  await prisma.$transaction(async (tx) => {
    const redemption = await tx.rewardRedemption.findUnique({ where: { id: redemptionId } });
    if (!redemption || redemption.status !== "PENDING") {
      throw new Error("Only pending redemptions can be cancelled");
    }

    await tx.rewardRedemption.update({
      where: { id: redemptionId },
      data: { status: "CANCELLED" },
    });

    await tx.xPEvent.create({
      data: {
        userId: redemption.userId,
        amount: redemption.pointsSpent,
        source: "REWARD_REFUND",
        refId: redemption.id,
      },
    });

    const reward = await tx.reward.findUnique({ where: { id: redemption.rewardId } });
    if (reward && reward.stock !== null) {
      await tx.reward.update({ where: { id: reward.id }, data: { stock: { increment: 1 } } });
    }
  });

  revalidatePath("/admin/rewards");
  revalidatePath("/rewards");
}
