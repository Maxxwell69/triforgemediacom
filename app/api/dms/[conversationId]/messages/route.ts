import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUserWithProfile, apiAuthErrorResponse } from "@/lib/apiAuth";
import { canAccessConversation, summarizeReactions } from "@/lib/dmAccess";
import { isMuted } from "@/lib/moderation";
import { postMessageSchema } from "@/lib/validations/message";

export async function GET(
  req: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  const result = await getApiUserWithProfile();
  if ("error" in result) {
    const { status, body } = apiAuthErrorResponse(result.error);
    return NextResponse.json(body, { status });
  }

  if (!(await canAccessConversation(result.user.id, result.user.role, params.conversationId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const after = req.nextUrl.searchParams.get("after");
  const messages = await prisma.directMessage.findMany({
    where: {
      conversationId: params.conversationId,
      ...(after ? { createdAt: { gt: new Date(after) } } : {}),
    },
    include: {
      user: { select: { id: true, name: true, image: true, role: true, mutedUntil: true } },
      reactions: { select: { emoji: true, userId: true } },
    },
    orderBy: { createdAt: after ? "asc" : "desc" },
    take: after ? 100 : 50,
  });

  const ordered = after ? messages : [...messages].reverse();
  const payload = ordered.map(({ reactions, ...message }) => ({
    ...message,
    reactions: summarizeReactions(reactions, result.user.id),
  }));

  const viewer = await prisma.user.findUnique({
    where: { id: result.user.id },
    select: { mutedUntil: true },
  });

  return NextResponse.json({ messages: payload, mutedUntil: viewer?.mutedUntil ?? null });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  const result = await getApiUserWithProfile();
  if ("error" in result) {
    const { status, body } = apiAuthErrorResponse(result.error);
    return NextResponse.json(body, { status });
  }

  if (!(await canAccessConversation(result.user.id, result.user.role, params.conversationId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
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

  const message = await prisma.$transaction(async (tx) => {
    const created = await tx.directMessage.create({
      data: {
        conversationId: params.conversationId,
        userId: result.user.id,
        content: parsed.data.content,
      },
      include: {
        user: { select: { id: true, name: true, image: true, role: true, mutedUntil: true } },
        reactions: { select: { emoji: true, userId: true } },
      },
    });
    await tx.directConversation.update({
      where: { id: params.conversationId },
      data: { updatedAt: new Date() },
    });
    return created;
  });

  const { reactions, ...rest } = message;
  return NextResponse.json(
    {
      message: {
        ...rest,
        reactions: summarizeReactions(reactions, result.user.id),
      },
    },
    { status: 201 }
  );
}
