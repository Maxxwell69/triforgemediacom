import { NextRequest, NextResponse } from "next/server";
import type { Prisma, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getApiUserWithProfile, apiAuthErrorResponse } from "@/lib/apiAuth";
import { canAccessChannel, getUserGroupIds } from "@/lib/groups";
import { bindClientHubSkus } from "@/lib/hub/modules";
import { MAX_VOICE_PEERS, VOICE_STALE_MS, isVoiceSignalKind } from "@/lib/voiceConstants";
import { channelVoiceEnabled } from "@/lib/voiceAccess";

async function getVoiceChannel(channelId: string, userId: string, userRole: UserRole) {
  const [channel, userGroupIds] = await Promise.all([
    prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        groups: { select: { id: true, isHome: true, grantsVoiceAccess: true } },
      },
    }),
    getUserGroupIds(userId),
  ]);
  if (!channel) return null;
  if (!canAccessChannel(userRole, channel, userGroupIds)) return null;
  if (!channelVoiceEnabled(channel)) return null;
  return channel;
}

async function expireStale(channelId: string) {
  await prisma.voicePresence.deleteMany({
    where: {
      channelId,
      lastSeenAt: { lt: new Date(Date.now() - VOICE_STALE_MS) },
    },
  });
}

function mapPeer(row: {
  userId: string;
  displayName: string;
  muted: boolean;
  lastSeenAt: Date;
}) {
  return {
    userId: row.userId,
    displayName: row.displayName,
    muted: row.muted,
    lastSeenAt: row.lastSeenAt.toISOString(),
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { channelId: string } }
) {
  await bindClientHubSkus();
  const auth = await getApiUserWithProfile();
  if ("error" in auth) {
    const { status, body } = apiAuthErrorResponse(auth.error);
    return NextResponse.json(body, { status });
  }

  const channel = await getVoiceChannel(params.channelId, auth.user.id, auth.user.role);
  if (!channel) {
    return NextResponse.json({ error: "Voice is not available in this channel." }, { status: 404 });
  }

  await expireStale(channel.id);

  const peers = await prisma.voicePresence.findMany({
    where: { channelId: channel.id },
    orderBy: { joinedAt: "asc" },
    select: { userId: true, displayName: true, muted: true, lastSeenAt: true },
  });

  const inRoom = peers.some((p) => p.userId === auth.user.id);
  let signals: {
    id: string;
    fromUserId: string;
    kind: string;
    payload: Prisma.JsonValue;
  }[] = [];

  if (inRoom) {
    const pending = await prisma.voiceSignal.findMany({
      where: { channelId: channel.id, toUserId: auth.user.id },
      orderBy: { createdAt: "asc" },
      take: 80,
      select: { id: true, fromUserId: true, kind: true, payload: true },
    });
    if (pending.length > 0) {
      await prisma.voiceSignal.deleteMany({
        where: { id: { in: pending.map((s) => s.id) } },
      });
    }
    signals = pending;
  }

  return NextResponse.json({ peers: peers.map(mapPeer), signals });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { channelId: string } }
) {
  await bindClientHubSkus();
  const auth = await getApiUserWithProfile();
  if ("error" in auth) {
    const { status, body } = apiAuthErrorResponse(auth.error);
    return NextResponse.json(body, { status });
  }

  const channel = await getVoiceChannel(params.channelId, auth.user.id, auth.user.role);
  if (!channel) {
    return NextResponse.json({ error: "Voice is not available in this channel." }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const action = typeof body.action === "string" ? body.action : "";
  await expireStale(channel.id);

  if (action === "leave") {
    await prisma.$transaction([
      prisma.voicePresence.deleteMany({
        where: { channelId: channel.id, userId: auth.user.id },
      }),
      prisma.voiceSignal.deleteMany({
        where: {
          channelId: channel.id,
          OR: [{ fromUserId: auth.user.id }, { toUserId: auth.user.id }],
        },
      }),
    ]);
    return NextResponse.json({ ok: true });
  }

  if (action === "heartbeat") {
    const muted = body.muted === true;
    const updated = await prisma.voicePresence.updateMany({
      where: { channelId: channel.id, userId: auth.user.id },
      data: { muted, lastSeenAt: new Date() },
    });
    if (updated.count === 0) {
      return NextResponse.json({ error: "Not in voice." }, { status: 409 });
    }
    return NextResponse.json({ ok: true });
  }

  if (action === "join") {
    const displayName =
      typeof body.displayName === "string" && body.displayName.trim()
        ? body.displayName.trim().slice(0, 60)
        : auth.user.name?.trim() || "Member";
    const muted = body.muted === true;

    const existing = await prisma.voicePresence.findUnique({
      where: { channelId_userId: { channelId: channel.id, userId: auth.user.id } },
    });
    if (!existing) {
      const count = await prisma.voicePresence.count({ where: { channelId: channel.id } });
      if (count >= MAX_VOICE_PEERS) {
        return NextResponse.json(
          { error: `This voice room is full (${MAX_VOICE_PEERS}).` },
          { status: 409 }
        );
      }
    }

    await prisma.voicePresence.upsert({
      where: { channelId_userId: { channelId: channel.id, userId: auth.user.id } },
      create: {
        channelId: channel.id,
        userId: auth.user.id,
        displayName,
        muted,
      },
      update: { displayName, muted, lastSeenAt: new Date() },
    });

    const peers = await prisma.voicePresence.findMany({
      where: { channelId: channel.id },
      orderBy: { joinedAt: "asc" },
      select: { userId: true, displayName: true, muted: true, lastSeenAt: true },
    });
    return NextResponse.json({ ok: true, peers: peers.map(mapPeer) });
  }

  if (action === "signal") {
    const toUserId = typeof body.toUserId === "string" ? body.toUserId : "";
    const kind = typeof body.kind === "string" ? body.kind : "";
    if (!toUserId || toUserId === auth.user.id || !isVoiceSignalKind(kind)) {
      return NextResponse.json({ error: "Invalid signal." }, { status: 400 });
    }
    if (body.payload == null || typeof body.payload !== "object") {
      return NextResponse.json({ error: "Invalid signal payload." }, { status: 400 });
    }
    const encoded = JSON.stringify(body.payload);
    if (encoded.length > 24_000) {
      return NextResponse.json({ error: "Signal too large." }, { status: 413 });
    }

    const [self, peer] = await Promise.all([
      prisma.voicePresence.findUnique({
        where: { channelId_userId: { channelId: channel.id, userId: auth.user.id } },
        select: { userId: true },
      }),
      prisma.voicePresence.findUnique({
        where: { channelId_userId: { channelId: channel.id, userId: toUserId } },
        select: { userId: true },
      }),
    ]);
    if (!self || !peer) {
      return NextResponse.json({ error: "Both people must be in voice." }, { status: 409 });
    }

    await prisma.voiceSignal.create({
      data: {
        channelId: channel.id,
        fromUserId: auth.user.id,
        toUserId,
        kind,
        payload: body.payload as Prisma.InputJsonValue,
      },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
