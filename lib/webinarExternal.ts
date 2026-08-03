import "server-only";
import { randomBytes } from "crypto";
import type { WebinarParticipantRole } from "@prisma/client";
import type { WebinarTokenRole } from "@/lib/webinarParticipantMeta";

export function generateWebinarExternalToken(): string {
  return randomBytes(32).toString("hex");
}

export function webinarExternalInviteUrl(inviteToken: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${base}/w/${inviteToken}`;
}

export function webinarGuestAccessUrl(inviteToken: string, joinToken: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${base}/w/${inviteToken}/access/${joinToken}`;
}

export function webinarGuestRoomUrl(inviteToken: string, joinToken: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${base}/w/${inviteToken}/room/${joinToken}`;
}

/** LiveKit identity for outside-network guests (not a hub User id). */
export function webinarGuestIdentity(guestId: string): string {
  return `wg_${guestId}`;
}

export function isWebinarGuestIdentity(identity: string): boolean {
  return identity.startsWith("wg_");
}

/** Extract guest id from LiveKit identity `wg_<id>`, or null if not a guest. */
export function parseWebinarGuestId(identity: string): string | null {
  if (!identity.startsWith("wg_")) return null;
  const id = identity.slice(3);
  return id.length > 0 ? id : null;
}

/** Resolve publishable role for an outside guest (never HOST). */
export function resolveWebinarGuestRole(guest: {
  role: WebinarParticipantRole;
  forcedAudience: boolean;
  kickedAt: Date | null;
}): WebinarParticipantRole {
  if (guest.kickedAt || guest.forcedAudience) return "AUDIENCE";
  if (guest.role === "SPEAKER") return "SPEAKER";
  return "AUDIENCE";
}

export function guestRoleToTokenRole(role: WebinarParticipantRole): WebinarTokenRole {
  return role === "SPEAKER" ? "speaker" : "audience";
}
