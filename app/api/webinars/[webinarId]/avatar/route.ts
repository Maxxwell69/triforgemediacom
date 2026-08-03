import { NextRequest, NextResponse } from "next/server";
import type { UserRole } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getApiUserWithProfile, apiAuthErrorResponse } from "@/lib/apiAuth";
import {
  buildWebinarParticipantMeta,
  isLiveKitConfigured,
  setParticipantMetadata,
} from "@/lib/livekit";
import { uploadImage } from "@/lib/r2";
import { ALLOWED_IMAGE_MIME_TYPES } from "@/lib/uploadConstraints";
import { canJoinWebinar, canViewWebinar, roleToTokenRole } from "@/lib/webinars";

export const dynamic = "force-dynamic";

const urlBodySchema = z.object({
  avatarUrl: z
    .string()
    .trim()
    .max(2000)
    .refine((v) => v === "" || /^https?:\/\//i.test(v), "Must be a valid image URL"),
});

async function requireJoinedParticipant(
  webinarId: string,
  userId: string,
  userRole: UserRole
) {
  const webinar = await prisma.webinar.findUnique({ where: { id: webinarId } });
  if (!webinar) return { error: NextResponse.json({ error: "Webinar not found" }, { status: 404 }) };
  if (!canViewWebinar(webinar, userRole, userId)) {
    return { error: NextResponse.json({ error: "Webinar not found" }, { status: 404 }) };
  }
  if (!canJoinWebinar(webinar.status)) {
    return { error: NextResponse.json({ error: "Webinar is not open." }, { status: 403 }) };
  }

  const attendance = await prisma.webinarAttendance.findUnique({
    where: { webinarId_userId: { webinarId, userId } },
  });
  if (!attendance || attendance.kickedAt) {
    return {
      error: NextResponse.json(
        { error: "Join the webinar room before setting an avatar." },
        { status: 403 }
      ),
    };
  }

  return { webinar, attendance };
}

async function pushLiveKitAvatar(
  webinar: { id: string; livekitRoomName: string },
  userId: string,
  role: "HOST" | "SPEAKER" | "AUDIENCE",
  avatarUrl: string | null
) {
  if (!isLiveKitConfigured()) return;
  try {
    await setParticipantMetadata({
      roomName: webinar.livekitRoomName,
      identity: userId,
      metadata: buildWebinarParticipantMeta({
        role: roleToTokenRole(role),
        avatarUrl,
      }),
    });
  } catch {
    // Offline / not connected — next token mint will include the avatar.
  }
}

/** Upload a file as this participant's webinar avatar. */
export async function POST(
  req: NextRequest,
  { params }: { params: { webinarId: string } }
) {
  const auth = await getApiUserWithProfile();
  if ("error" in auth) {
    const { status, body } = apiAuthErrorResponse(auth.error);
    return NextResponse.json(body, { status });
  }

  const gate = await requireJoinedParticipant(
    params.webinarId,
    auth.user.id,
    auth.user.role
  );
  if ("error" in gate) return gate.error;

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (
    !ALLOWED_IMAGE_MIME_TYPES.includes(
      file.type as (typeof ALLOWED_IMAGE_MIME_TYPES)[number]
    )
  ) {
    return NextResponse.json(
      { error: "Unsupported file type. Use JPG, PNG, WEBP, or GIF." },
      { status: 400 }
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const avatarUrl = await uploadImage("webinar-avatars", {
      buffer,
      type: file.type,
      size: file.size,
    });

    await prisma.webinarAttendance.update({
      where: {
        webinarId_userId: { webinarId: gate.webinar.id, userId: auth.user.id },
      },
      data: { avatarUrl },
    });

    await pushLiveKitAvatar(
      gate.webinar,
      auth.user.id,
      gate.attendance.role,
      avatarUrl
    );

    return NextResponse.json({ avatarUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

/** Set or clear avatar via URL (empty string clears custom URL; TikTok may still apply on next join). */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { webinarId: string } }
) {
  const auth = await getApiUserWithProfile();
  if ("error" in auth) {
    const { status, body } = apiAuthErrorResponse(auth.error);
    return NextResponse.json(body, { status });
  }

  const gate = await requireJoinedParticipant(
    params.webinarId,
    auth.user.id,
    auth.user.role
  );
  if ("error" in gate) return gate.error;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = urlBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid input" },
      { status: 400 }
    );
  }

  const avatarUrl = parsed.data.avatarUrl || null;

  await prisma.webinarAttendance.update({
    where: {
      webinarId_userId: { webinarId: gate.webinar.id, userId: auth.user.id },
    },
    data: { avatarUrl },
  });

  await pushLiveKitAvatar(
    gate.webinar,
    auth.user.id,
    gate.attendance.role,
    avatarUrl
  );

  return NextResponse.json({ avatarUrl });
}
