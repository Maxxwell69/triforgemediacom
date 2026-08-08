import { NextRequest, NextResponse } from "next/server";
import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getApiUserWithProfile, apiAuthErrorResponse } from "@/lib/apiAuth";
import { canAccessChannel, getUserGroupIds } from "@/lib/groups";
import { isMuted } from "@/lib/moderation";
import { postMessageSchema } from "@/lib/validations/message";
import { summarizeReactions } from "@/lib/dmAccess";
import { chatAuthorSelect } from "@/lib/memberDisplay";
import { toChatAuthor } from "@/lib/chatAuthors";
import { markChannelRead } from "@/lib/channelReads";
import { replyToInclude } from "@/lib/chatReplies";

async function getAccessibleChannel(channelId: string, userId: string, userRole: UserRole) {
  const [channel, userGroupIds] = await Promise.all([
    prisma.channel.findUnique({
      where: { id: channelId },
      include: { groups: { select: { id: true, isHome: true } } },
    }),
    getUserGroupIds(userId),
  ]);
  if (!channel) return null;
  if (!canAccessChannel(userRole, channel, userGroupIds)) return null;
  return channel;
}

function mapMessage(
  message: {
    id: string;
    channelId: string;
    userId: string;
    content: string;
    createdAt: Date;
    replyToId: string | null;
    user: Parameters<typeof toChatAuthor>[0];
    reactions: { emoji: string; userId: string }[];
    replyTo: {
      id: string;
      content: string;
      user: Parameters<typeof toChatAuthor>[0];
    } | null;
  },
  viewerId: string
) {
  const { reactions, user, replyTo, ...rest } = message;
  return {
    ...rest,
    user: toChatAuthor(user),
    reactions: summarizeReactions(reactions, viewerId),
    replyTo: replyTo
      ? {
          id: replyTo.id,
          content: replyTo.content,
          user: toChatAuthor(replyTo.user),
        }
      : null,
  };
}

const messageInclude = {
  user: { select: chatAuthorSelect },
  reactions: { select: { emoji: true, userId: true } },
  replyTo: replyToInclude,
} as const;

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

  const [messages, viewer] = await Promise.all([
    prisma.message.findMany({
      where: {
        channelId: channel.id,
        ...(after ? { createdAt: { gt: new Date(after) } } : {}),
      },
      include: messageInclude,
      orderBy: { createdAt: after ? "asc" : "desc" },
      take: after ? 100 : 50,
    }),
    prisma.user.findUnique({ where: { id: result.user.id }, select: { mutedUntil: true } }),
  ]);

  // Viewing / polling the channel marks it read.
  await markChannelRead(result.user.id, channel.id);

  const ordered = after ? messages : [...messages].reverse();
  const payload = ordered.map((message) => mapMessage(message, result.user.id));

  return NextResponse.json({ messages: payload, mutedUntil: viewer?.mutedUntil ?? null });
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

  const dbUser = await prisma.user.findUnique({
    where: { id: result.user.id },
    select: { mutedUntil: true },
  });
  if (dbUser && isMuted(dbUser)) {
    return NextResponse.json(
      {
        error: `You're muted until ${dbUser.mutedUntil!.toLocaleString()}`,
        mutedUntil: dbUser.mutedUntil,
      },
      { status: 403 }
    );
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

  const replyToId: string | null = parsed.data.replyToId ?? null;
  if (replyToId) {
    const parent = await prisma.message.findFirst({
      where: { id: replyToId, channelId: channel.id },
      select: { id: true },
    });
    if (!parent) {
      return NextResponse.json(
        { error: "Message you're replying to was not found in this channel." },
        { status: 400 }
      );
    }
  }

  const message = await prisma.message.create({
    data: {
      channelId: channel.id,
      userId: result.user.id,
      content: parsed.data.content,
      replyToId,
    },
    include: messageInclude,
  });

  await markChannelRead(result.user.id, channel.id);

  return NextResponse.json({ message: mapMessage(message, result.user.id) }, { status: 201 });
}
