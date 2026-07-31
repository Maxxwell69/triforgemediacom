import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUserWithProfile, apiAuthErrorResponse } from "@/lib/apiAuth";
import { canInitiateDm, isTrueAdmin } from "@/lib/dmAccess";
import { getMemberDisplayName } from "@/lib/memberDisplay";
import { z } from "zod";

const startSchema = z.object({
  userId: z.string().trim().min(1),
});

export async function GET() {
  const result = await getApiUserWithProfile();
  if ("error" in result) {
    const { status, body } = apiAuthErrorResponse(result.error);
    return NextResponse.json(body, { status });
  }

  const { user } = result;
  const conversations = isTrueAdmin(user.role)
    ? await prisma.directConversation.findMany({
        orderBy: { updatedAt: "desc" },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                  profile: { select: { platform: true, showRealName: true, socialLinks: true } },
                  tiktokConnection: { select: { displayName: true, avatarUrl: true } },
                  tiktokStatsSnapshot: { select: { nickname: true, avatarUrl: true, uniqueId: true } },
                },
              },
            },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { content: true, createdAt: true },
          },
        },
      })
    : await prisma.directConversation.findMany({
        where: { participants: { some: { userId: user.id } } },
        orderBy: { updatedAt: "desc" },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                  profile: { select: { platform: true, showRealName: true, socialLinks: true } },
                  tiktokConnection: { select: { displayName: true, avatarUrl: true } },
                  tiktokStatsSnapshot: { select: { nickname: true, avatarUrl: true, uniqueId: true } },
                },
              },
            },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { content: true, createdAt: true },
          },
        },
      });

  const payload = conversations.map((c) => {
    const others = c.participants
      .map((p) => p.user)
      .filter((u) => u.id !== user.id);
    const title =
      others.length > 0
        ? others.map((u) => getMemberDisplayName(u)).join(", ")
        : "Direct message";
    return {
      id: c.id,
      title,
      updatedAt: c.updatedAt,
      lastMessage: c.messages[0]
        ? { content: c.messages[0].content, createdAt: c.messages[0].createdAt }
        : null,
      participants: c.participants.map((p) => ({
        id: p.user.id,
        name: getMemberDisplayName(p.user),
        role: p.user.role,
      })),
    };
  });

  return NextResponse.json({
    conversations: payload,
    canInitiate: await canInitiateDm(user.id, user.role),
  });
}

export async function POST(req: NextRequest) {
  const result = await getApiUserWithProfile();
  if ("error" in result) {
    const { status, body } = apiAuthErrorResponse(result.error);
    return NextResponse.json(body, { status });
  }

  if (!(await canInitiateDm(result.user.id, result.user.role))) {
    return NextResponse.json({ error: "Not allowed to start DMs" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const parsed = startSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const targetId = parsed.data.userId;
  if (targetId === result.user.id) {
    return NextResponse.json({ error: "Can't DM yourself" }, { status: 400 });
  }

  const target = await prisma.user.findFirst({
    where: { id: targetId, status: "ACTIVE" },
    select: { id: true },
  });
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Reuse an existing 1:1 between these two participants if present.
  const existing = await prisma.directConversation.findFirst({
    where: {
      AND: [
        { participants: { some: { userId: result.user.id } } },
        { participants: { some: { userId: targetId } } },
      ],
    },
    select: { id: true, participants: { select: { userId: true } } },
  });
  if (existing && existing.participants.length === 2) {
    return NextResponse.json({ conversationId: existing.id });
  }

  const conversation = await prisma.directConversation.create({
    data: {
      createdById: result.user.id,
      participants: {
        create: [{ userId: result.user.id }, { userId: targetId }],
      },
    },
    select: { id: true },
  });

  return NextResponse.json({ conversationId: conversation.id }, { status: 201 });
}
