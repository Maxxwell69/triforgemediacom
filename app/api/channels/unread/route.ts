import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUserWithProfile, apiAuthErrorResponse } from "@/lib/apiAuth";
import { canAccessChannel, getUserGroupIds } from "@/lib/groups";
import { getChannelUnreadCounts } from "@/lib/channelReads";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await getApiUserWithProfile();
  if ("error" in auth) {
    const { status, body } = apiAuthErrorResponse(auth.error);
    return NextResponse.json(body, { status });
  }

  const [allChannels, userGroupIds] = await Promise.all([
    prisma.channel.findMany({
      select: { id: true, minRole: true, groups: { select: { id: true, isHome: true } } },
    }),
    getUserGroupIds(auth.user.id),
  ]);

  const channelIds = allChannels
    .filter((c) => canAccessChannel(auth.user.role, c, userGroupIds))
    .map((c) => c.id);

  const counts = await getChannelUnreadCounts(auth.user.id, channelIds);
  return NextResponse.json({ counts });
}
