import { prisma } from "@/lib/prisma";

export async function getUserPointsTotal(userId: string): Promise<number> {
  const result = await prisma.xPEvent.aggregate({
    _sum: { amount: true },
    where: { userId },
  });
  return result._sum.amount ?? 0;
}

/**
 * Bulk variant for list pages (users table, members directory) so we don't
 * run one aggregate query per row.
 */
export async function getUserPointsTotals(userIds: string[]): Promise<Record<string, number>> {
  const totals: Record<string, number> = {};
  for (const id of userIds) totals[id] = 0;
  if (userIds.length === 0) return totals;

  const grouped = await prisma.xPEvent.groupBy({
    by: ["userId"],
    _sum: { amount: true },
    where: { userId: { in: userIds } },
  });

  for (const row of grouped) {
    totals[row.userId] = row._sum.amount ?? 0;
  }
  return totals;
}
