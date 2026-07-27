import { randomBytes } from "crypto";

const INVITE_TOKEN_TTL_DAYS = 7;

export function generateInviteToken(): string {
  return randomBytes(32).toString("hex");
}

export function inviteTokenExpiry(): Date {
  return new Date(Date.now() + INVITE_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
}

export function inviteUrl(token: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${base}/signup?token=${token}`;
}
