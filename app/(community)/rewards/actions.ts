"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export async function redeemReward(rewardId: string) {
  const user = await requireUser();

  await prisma.$transaction(async (tx) => {
    // Serialize concurrent redemptions from the same user so two in-flight
    // requests can't both pass the balance check before either commits.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${user.id}))`;

    const reward = await tx.reward.findUnique({ where: { id: rewardId } });
    if (!reward || !reward.isActive) {
      throw new Error("This reward isn't available anymore.");
    }

    const pointsAgg = await tx.xPEvent.aggregate({
      where: { userId: user.id },
      _sum: { amount: true },
    });
    const balance = pointsAgg._sum.amount ?? 0;
    if (balance < reward.costPoints) {
      throw new Error("You don't have enough points for this reward.");
    }

    if (reward.stock !== null) {
      // Atomic conditional decrement — stays race-safe across concurrent
      // redemptions from different users even without the advisory lock.
      const stockUpdate = await tx.reward.updateMany({
        where: { id: reward.id, stock: { gt: 0 } },
        data: { stock: { decrement: 1 } },
      });
      if (stockUpdate.count === 0) {
        throw new Error("This reward just sold out.");
      }
    }

    const redemption = await tx.rewardRedemption.create({
      data: {
        userId: user.id,
        rewardId: reward.id,
        pointsSpent: reward.costPoints,
        status: "PENDING",
      },
    });

    await tx.xPEvent.create({
      data: {
        userId: user.id,
        amount: -reward.costPoints,
        source: "REWARD_REDEMPTION",
        refId: redemption.id,
      },
    });
  });

  revalidatePath("/rewards");
}
