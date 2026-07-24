import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUserWithProfile, apiAuthErrorResponse } from "@/lib/apiAuth";
import { canAccessChannel, getUserGroupIds } from "@/lib/groups";

export async function GET() {
  const result = await getApiUserWithProfile();
  if ("error" in result) {
    const { status, body } = apiAuthErrorResponse(result.error);
    return NextResponse.json(body, { status });
  }

  const [channels, userGroupIds] = await Promise.all([
    prisma.channel.findMany({
      orderBy: { createdAt: "asc" },
      include: { groups: { select: { id: true } } },
    }),
    getUserGroupIds(result.user.id),
  ]);
  const visible = channels.filter((c) => canAccessChannel(result.user.role, c, userGroupIds));

  return NextResponse.json({ channels: visible });
}
