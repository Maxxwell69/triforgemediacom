import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUserWithProfile, apiAuthErrorResponse } from "@/lib/apiAuth";
import { startOfTodayUTC } from "@/lib/tiktask";
import { SHARE_XP_REWARD } from "@/lib/shareRewards";

// Rewards a member once per day for helping promote the network — clicking
// any share option (a specific network, native share, or copy link) counts,
// since we can't verify follow-through on external platforms. Capped at one
// grant per user per UTC day, enforced here rather than trusting the client.
export async function POST(req: Request) {
  const result = await getApiUserWithProfile();
  if ("error" in result) {
    const { status, body } = apiAuthErrorResponse(result.error);
    return NextResponse.json(body, { status });
  }
  const { user } = result;

  let note: string | undefined;
  try {
    const body = await req.json();
    if (typeof body?.context === "string") note = body.context.slice(0, 200);
  } catch {
    // no body / not JSON — fine, note stays undefined
  }

  const today = startOfTodayUTC();
  const alreadyClaimedToday = await prisma.xPEvent.findFirst({
    where: { userId: user.id, source: "SOCIAL_SHARE", createdAt: { gte: today } },
    select: { id: true },
  });

  if (alreadyClaimedToday) {
    return NextResponse.json({ alreadyClaimed: true, xpAwarded: 0 });
  }

  await prisma.xPEvent.create({
    data: { userId: user.id, amount: SHARE_XP_REWARD, source: "SOCIAL_SHARE", note },
  });

  return NextResponse.json({ alreadyClaimed: false, xpAwarded: SHARE_XP_REWARD });
}
