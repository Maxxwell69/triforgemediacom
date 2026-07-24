import { NextRequest, NextResponse } from "next/server";
import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getApiUserWithProfile, apiAuthErrorResponse } from "@/lib/apiAuth";
import { canAccessChannel, getUserGroupIds } from "@/lib/groups";
import { postMessageSchema } from "@/lib/validations/message";

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

export async function GET(
  req: NextRequest,
  { params }: { params: { channelId: string } }
) {
  const result = await getApiUserWithProfile();
  if ("error" in result) {
    const { status, body } = apiAuthErrorResponse(result.error);
    return NextResponse.json(body, { status });
  }

  const channel = await getAccessibleChannel(params.channelId, result.user.id, result.user.role);
  if (!channel) {
    return NextResponse.json({ error: "Channel not found" }, { status: 404 });
  }

  const after = req.nextUrl.searchParams.get("after");

  const messages = await prisma.message.findMany({
    where: {
      channelId: channel.id,
      ...(after ? { createdAt: { gt: new Date(after) } } : {}),
    },
    include: { user: { select: { id: true, name: true, image: true, role: true } } },
    // Polling for new messages (`after` set) reads oldest-first; the initial
    // load reads newest-first (then gets reversed) so we grab the most
    // recent N messages rather than the oldest N.
    orderBy: { createdAt: after ? "asc" : "desc" },
    take: after ? 100 : 50,
  });

  const ordered = after ? messages : [...messages].reverse();

  return NextResponse.json({ messages: ordered });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { channelId: string } }
) {
  const result = await getApiUserWithProfile();
  if ("error" in result) {
    const { status, body } = apiAuthErrorResponse(result.error);
    return NextResponse.json(body, { status });
  }

  const channel = await getAccessibleChannel(params.channelId, result.user.id, result.user.role);
  if (!channel) {
    return NextResponse.json({ error: "Channel not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = postMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid message" },
      { status: 400 }
    );
  }

  const message = await prisma.message.create({
    data: {
      channelId: channel.id,
      userId: result.user.id,
      content: parsed.data.content,
    },
    include: { user: { select: { id: true, name: true, image: true, role: true } } },
  });

  return NextResponse.json({ message }, { status: 201 });
}
