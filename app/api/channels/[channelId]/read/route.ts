import { NextResponse } from "next/server";
import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getApiUserWithProfile, apiAuthErrorResponse } from "@/lib/apiAuth";
import { canAccessChannel, getUserGroupIds } from "@/lib/groups";
import { markChannelRead } from "@/lib/channelReads";

export const dynamic = "force-dynamic";

async function getAccessibleChannel(channelId: string, userId: string, userRole: UserRole) {
  const [channel, userGroupIds] = await Promise.all([
    prisma.channel.findUnique({
      where: { id: channelId },
      include: { groups: { select: { id: true } } },
    }),
    getUserGroupIds(userId),
  ]);
  if (!channel) return null;
  if (!canAccessChannel(userRole, channel, userGroupIds)) return null;
  return channel;
}

export async function POST(
  _req: Request,
  { params }: { params: { channelId: string } }
) {
  const auth = await getApiUserWithProfile();
  if ("error" in auth) {
    const { status, body } = apiAuthErrorResponse(auth.error);
    return NextResponse.json(body, { status });
  }

  const channel = await getAccessibleChannel(
    params.channelId,
    auth.user.id,
    auth.user.role
  );
  if (!channel) {
    return NextResponse.json({ error: "Channel not found" }, { status: 404 });
  }

  await markChannelRead(auth.user.id, channel.id);
  return NextResponse.json({ ok: true });
}
