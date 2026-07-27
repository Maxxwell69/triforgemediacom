import { randomBytes } from "crypto";

export function generateResetToken(): string {
  return randomBytes(32).toString("hex");
}

export function resetPasswordUrl(token: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${base}/reset-password?token=${token}`;
}

export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
