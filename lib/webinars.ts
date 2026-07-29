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
  userRole: UserRole
): Promise<WebinarParticipantRole> {
  if (webinar.hostUserId === userId || isAdminRole(userRole)) {
    return "HOST";
  }

  const attendance = await prisma.webinarAttendance.findUnique({
    where: { webinarId_userId: { webinarId: webinar.id, userId } },
    select: { role: true },
  });

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
