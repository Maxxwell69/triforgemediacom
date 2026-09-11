import type { Prisma, PrismaClient } from "@prisma/client";
import { PLATFORM_LABELS } from "@/lib/platforms";

type Db = PrismaClient | Prisma.TransactionClient;

export function interviewNetworkLabel(network: string | null | undefined) {
  if (!network) return null;
  return PLATFORM_LABELS[network as keyof typeof PLATFORM_LABELS] ?? network;
}

export async function createInterviewSlotBatch(
  db: Db,
  input: {
    campaignId: string;
    startsAt: Date;
    endsAt: Date;
    network: string;
    count: number;
  }
) {
  const last = await db.hubCampaignSlot.findFirst({
    where: {
      campaignId: input.campaignId,
      startsAt: input.startsAt,
      network: input.network,
    },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  const startPos = (last?.position ?? 0) + 1;

  for (let i = 0; i < input.count; i++) {
    await db.hubCampaignSlot.create({
      data: {
        campaignId: input.campaignId,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        network: input.network,
        position: startPos + i,
      },
    });
  }

  await fillUnassignedInterviewSignups(db, input.campaignId);

  const total = await db.hubCampaignSlot.count({ where: { campaignId: input.campaignId } });
  const campaign = await db.hubCampaign.findUnique({
    where: { id: input.campaignId },
    select: { startsAt: true, endsAt: true },
  });
  await db.hubCampaign.update({
    where: { id: input.campaignId },
    data: {
      capacity: total,
      startsAt:
        !campaign?.startsAt || campaign.startsAt.getTime() > input.startsAt.getTime()
          ? input.startsAt
          : campaign.startsAt,
      endsAt:
        !campaign?.endsAt || campaign.endsAt.getTime() < input.endsAt.getTime()
          ? input.endsAt
          : campaign.endsAt,
    },
  });
}

export async function fillUnassignedInterviewSignups(db: Db, campaignId: string) {
  const unassigned = await db.hubCampaignSignup.findMany({
    where: { campaignId, slotId: null },
    orderBy: { joinedAt: "asc" },
    select: { id: true },
  });
  if (unassigned.length === 0) return;

  const open = await db.hubCampaignSlot.findMany({
    where: { campaignId, signup: { is: null } },
    orderBy: [{ startsAt: "asc" }, { position: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });

  const n = Math.min(unassigned.length, open.length);
  for (let i = 0; i < n; i++) {
    await db.hubCampaignSignup.update({
      where: { id: unassigned[i].id },
      data: { slotId: open[i].id },
    });
  }
}

export async function claimNextOpenInterviewSlot(
  db: Db,
  input: { campaignId: string; userId: string; existingSignupId?: string | null }
) {
  const open = await db.hubCampaignSlot.findFirst({
    where: { campaignId: input.campaignId, signup: { is: null } },
    orderBy: [{ startsAt: "asc" }, { position: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });
  if (!open) {
    const posted = await db.hubCampaignSlot.count({ where: { campaignId: input.campaignId } });
    throw new Error(
      posted === 0
        ? "Interview spots are not posted yet"
        : "All interview spots are booked"
    );
  }

  if (input.existingSignupId) {
    await db.hubCampaignSignup.update({
      where: { id: input.existingSignupId },
      data: { slotId: open.id },
    });
    return;
  }

  await db.hubCampaignSignup.create({
    data: {
      campaignId: input.campaignId,
      userId: input.userId,
      slotId: open.id,
    },
  });
}

export function groupInterviewSlots<
  T extends { startsAt: Date; endsAt: Date; network: string | null },
>(slots: T[]) {
  const groups: { key: string; startsAt: Date; endsAt: Date; network: string | null; slots: T[] }[] =
    [];
  for (const slot of slots) {
    const key = `${slot.startsAt.toISOString()}|${slot.network ?? ""}`;
    const existing = groups.find((g) => g.key === key);
    if (existing) {
      existing.slots.push(slot);
      if (slot.endsAt.getTime() > existing.endsAt.getTime()) existing.endsAt = slot.endsAt;
    } else {
      groups.push({
        key,
        startsAt: slot.startsAt,
        endsAt: slot.endsAt,
        network: slot.network,
        slots: [slot],
      });
    }
  }
  return groups;
}
