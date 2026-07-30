import type { UserRole, Webinar, WebinarParticipantRole, WebinarStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/rbac";

export function webinarRoomName(webinarId: string) {
  return `webinar_${webinarId}`;
}

/** Members see scheduled/live/ended; admins also see drafts. */
export function canViewWebinar(
  status: WebinarStatus,
  userRole: UserRole,
  hostUserId: string,
  userId: string
) {
  if (status !== "DRAFT") return true;
  return isAdminRole(userRole) || hostUserId === userId;
}

export function canJoinWebinar(status: WebinarStatus) {
  return status === "SCHEDULED" || status === "LIVE";
}

export type WebinarJoinMode = "host" | "watch";

/** Staff can choose host vs watch-only before entering a live room. */
export function canChooseWebinarJoinMode(userRole: UserRole) {
  return isAdminRole(userRole);
}

/** Can start/end webinars and use admin host APIs (not the same as joining as host on stage). */
export function isWebinarHost(
  webinar: Pick<Webinar, "hostUserId">,
  userId: string,
  userRole: UserRole
) {
  return webinar.hostUserId === userId || isAdminRole(userRole);
}

export function roleToTokenRole(
  role: WebinarParticipantRole
): "host" | "speaker" | "audience" {
  if (role === "HOST") return "host";
  if (role === "SPEAKER") return "speaker";
  return "audience";
}

export async function resolveParticipantRole(
  webinar: Pick<Webinar, "id" | "hostUserId">,
  userId: string,
  userRole: UserRole,
  joinMode?: WebinarJoinMode | null
): Promise<WebinarParticipantRole> {
  const attendance = await prisma.webinarAttendance.findUnique({
    where: { webinarId_userId: { webinarId: webinar.id, userId } },
    select: { role: true },
  });

  // Staff watching: never auto-host; allow SPEAKER if already invited on stage.
  if (joinMode === "watch" && canChooseWebinarJoinMode(userRole)) {
    return attendance?.role === "SPEAKER" ? "SPEAKER" : "AUDIENCE";
  }

  // Explicit host join for staff / designated host.
  if (joinMode === "host" && isWebinarHost(webinar, userId, userRole)) {
    return "HOST";
  }

  // Designated host always hosts when no mode is sent.
  if (!joinMode && webinar.hostUserId === userId) {
    return "HOST";
  }

  // Staff without a mode default to watch (chooser should set mode).
  if (!joinMode && canChooseWebinarJoinMode(userRole)) {
    return attendance?.role === "SPEAKER" ? "SPEAKER" : "AUDIENCE";
  }

  return attendance?.role ?? "AUDIENCE";
}

export async function upsertAttendance(
  webinarId: string,
  userId: string,
  role: WebinarParticipantRole
) {
  return prisma.webinarAttendance.upsert({
    where: { webinarId_userId: { webinarId, userId } },
    create: { webinarId, userId, role },
    update: { role, leftAt: null, joinedAt: new Date() },
  });
}

export function displayNameForUser(user: { name?: string | null; email?: string | null }) {
  return user.name?.trim() || user.email?.split("@")[0] || "Member";
}
