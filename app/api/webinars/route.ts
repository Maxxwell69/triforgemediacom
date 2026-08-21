import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUserWithProfile, apiAuthErrorResponse } from "@/lib/apiAuth";
import { isAdminRole } from "@/lib/rbac";
import { getUserNetworkTrack } from "@/lib/mnCn";
import { canViewWebinar, isWebinarOnHubList, webinarRoomName } from "@/lib/webinars";
import { createWebinarSchema } from "@/lib/validations/webinar";
import { generateWebinarExternalToken } from "@/lib/webinarExternal";
import { parseZonedDateTime } from "@/lib/time";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await getApiUserWithProfile();
  if ("error" in auth) {
    const { status, body } = apiAuthErrorResponse(auth.error);
    return NextResponse.json(body, { status });
  }

  const networkTrack = await getUserNetworkTrack(auth.user.id);

  const webinars = await prisma.webinar.findMany({
    orderBy: { scheduledAt: "desc" },
    include: {
      host: { select: { id: true, name: true, email: true } },
      _count: { select: { attendances: true } },
    },
  });

  const visible = webinars.filter(
    (w) =>
      canViewWebinar(w, auth.user.role, auth.user.id, networkTrack) &&
      (isAdminRole(auth.user.role) || isWebinarOnHubList(w))
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

  const timeZone =
    parsed.data && typeof json === "object" && json && "timeZone" in json
      ? String((json as { timeZone?: string }).timeZone || "")
      : "";
  let scheduledAt: Date;
  try {
    scheduledAt = parseZonedDateTime(parsed.data.scheduledAt, timeZone || null, "scheduled date");
  } catch {
    return NextResponse.json({ error: "Invalid scheduled date" }, { status: 400 });
  }

  const externalSignupEnabled = parsed.data.externalSignupEnabled;

  const webinar = await prisma.webinar.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description || null,
      scheduledAt,
      status: parsed.data.status,
      audience: parsed.data.audience,
      hostAvatarUrl: parsed.data.hostAvatarUrl || null,
      hostUserId: auth.user.id,
      livekitRoomName: `webinar_pending_${Date.now()}`,
      externalSignupEnabled,
      externalInviteToken: externalSignupEnabled ? generateWebinarExternalToken() : null,
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
