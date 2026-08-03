import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUserWithProfile, apiAuthErrorResponse } from "@/lib/apiAuth";
import { isAdminRole } from "@/lib/rbac";
import { canViewWebinar, webinarRoomName } from "@/lib/webinars";
import { createWebinarSchema } from "@/lib/validations/webinar";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await getApiUserWithProfile();
  if ("error" in auth) {
    const { status, body } = apiAuthErrorResponse(auth.error);
    return NextResponse.json(body, { status });
  }

  const webinars = await prisma.webinar.findMany({
    orderBy: { scheduledAt: "desc" },
    include: {
      host: { select: { id: true, name: true, email: true } },
      _count: { select: { attendances: true } },
    },
  });

  const visible = webinars.filter((w) =>
    canViewWebinar(w, auth.user.role, auth.user.id)
  );

  return NextResponse.json({ webinars: visible });
}

export async function POST(req: Request) {
  const auth = await getApiUserWithProfile();
  if ("error" in auth) {
    const { status, body } = apiAuthErrorResponse(auth.error);
    return NextResponse.json(body, { status });
  }
  if (!isAdminRole(auth.user.role)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createWebinarSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid input" },
      { status: 400 }
    );
  }

  const scheduledAt = new Date(parsed.data.scheduledAt);
  if (Number.isNaN(scheduledAt.getTime())) {
    return NextResponse.json({ error: "Invalid scheduled date" }, { status: 400 });
  }

  const webinar = await prisma.webinar.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description || null,
      scheduledAt,
      status: parsed.data.status,
      hostAvatarUrl: parsed.data.hostAvatarUrl || null,
      hostUserId: auth.user.id,
      livekitRoomName: `webinar_pending_${Date.now()}`,
    },
  });

  const updated = await prisma.webinar.update({
    where: { id: webinar.id },
    data: { livekitRoomName: webinarRoomName(webinar.id) },
    include: {
      host: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({ webinar: updated }, { status: 201 });
}
