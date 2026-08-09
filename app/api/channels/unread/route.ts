import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUserWithProfile, apiAuthErrorResponse } from "@/lib/apiAuth";
import { canAccessChannel, getHomeGroup, getUserGroupIds } from "@/lib/groups";
import { aggregateUnreadByGroup, getChannelUnreadCounts } from "@/lib/channelReads";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await getApiUserWithProfile();
  if ("error" in auth) {
    const { status, body } = apiAuthErrorResponse(auth.error);
    return NextResponse.json(body, { status });
  }

  const [allChannels, userGroupIds, homeGroup] = await Promise.all([
    prisma.channel.findMany({
      select: { id: true, minRole: true, groups: { select: { id: true, isHome: true } } },
    }),
    getUserGroupIds(auth.user.id),
    getHomeGroup(),
  ]);

  const accessible = allChannels.filter((c) =>
    canAccessChannel(auth.user.role, c, userGroupIds)
  );
  const channelIds = accessible.map((c) => c.id);

  const counts = await getChannelUnreadCounts(auth.user.id, channelIds);
  const byGroup = aggregateUnreadByGroup(accessible, counts, homeGroup?.id ?? null);

  return NextResponse.json({
    counts,
    byGroup,
    homeGroupId: homeGroup?.id ?? null,
  });
}
