import "server-only";
import { randomBytes } from "crypto";

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
