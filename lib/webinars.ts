import type { UserRole, Webinar, WebinarParticipantRole, WebinarStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/rbac";
import { getChatDisplayName } from "@/lib/memberDisplay";

export function webinarRoomName(webinarId: string) {
  return `webinar_${webinarId}`;
}

/**
 * Hub visibility: members see scheduled/live/ended hub webinars.
 * Drafts and outside-network webinars are staff/host only (outsiders use /w/[token]).
 */
export function canViewWebinar(
  webinar: Pick<Webinar, "status" | "hostUserId" | "externalSignupEnabled">,
  userRole: UserRole,
  userId: string
) {
  const isStaffOrHost = isAdminRole(userRole) || webinar.hostUserId === userId;

  // Outside-network webinars are invite-link only — not listed or joinable in the hub.
  if (webinar.externalSignupEnabled && !isStaffOrHost) {
    return false;
  }

  if (webinar.status !== "DRAFT") return true;
  return isStaffOrHost;
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
    select: { role: true, forcedAudience: true, kickedAt: true },
  });

  // Kicked users stay out until cleared (webinar end clears flags).
  if (attendance?.kickedAt) {
    return "AUDIENCE";
  }

  // Host demote / remove-from-stage lock — stay audience until invited again.
  if (attendance?.forcedAudience) {
    return "AUDIENCE";
  }

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
    update: {
      role,
      leftAt: null,
      joinedAt: new Date(),
      // Joining as host/speaker clears a prior kick/demote lock.
      ...(role === "HOST" || role === "SPEAKER"
        ? { forcedAudience: false, kickedAt: null }
        : {}),
    },
  });
}

/** Attendance avatar if set, else null (caller may fall back to profile/TikTok). */
export async function getAttendanceAvatarUrl(
  webinarId: string,
  userId: string
): Promise<string | null> {
  const row = await prisma.webinarAttendance.findUnique({
    where: { webinarId_userId: { webinarId, userId } },
    select: { avatarUrl: true },
  });
  return row?.avatarUrl ?? null;
}

/** Session host (on-stage HOST attendance) or platform webinar manager. */
export async function canModerateWebinar(
  webinar: Pick<Webinar, "id" | "hostUserId">,
  userId: string,
  userRole: UserRole
) {
  if (isWebinarHost(webinar, userId, userRole)) return true;
  const attendance = await prisma.webinarAttendance.findUnique({
    where: { webinarId_userId: { webinarId: webinar.id, userId } },
    select: { role: true },
  });
  return attendance?.role === "HOST";
}

export function isWebinarChatMuted(attendance: {
  chatMutedUntil: Date | null;
} | null) {
  return !!attendance?.chatMutedUntil && attendance.chatMutedUntil.getTime() > Date.now();
}

/** Chat / LiveKit display name — TikTok nickname only. */
export function displayNameForUser(user: {
  name?: string | null;
  email?: string | null;
  profile?: { socialLinks?: unknown; username?: string | null } | null;
  tiktokConnection?: { displayName: string | null; avatarUrl?: string | null } | null;
  tiktokStatsSnapshot?: { nickname: string | null; avatarUrl: string | null; uniqueId?: string } | null;
}) {
  return getChatDisplayName({
    name: user.name ?? null,
    email: user.email,
    profile: user.profile,
    tiktokConnection: user.tiktokConnection
      ? { displayName: user.tiktokConnection.displayName, avatarUrl: user.tiktokConnection.avatarUrl ?? null }
      : null,
    tiktokStatsSnapshot: user.tiktokStatsSnapshot ?? null,
  });
}
