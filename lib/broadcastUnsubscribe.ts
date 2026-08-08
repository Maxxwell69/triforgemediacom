import { createHmac, timingSafeEqual } from "crypto";
import { SAMPLE_APP_URL } from "@/lib/emailLayout";

type TokenPayload = {
  u: string; // userId
  p: "broadcast";
};

function signingSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET is required for unsubscribe tokens");
  }
  return secret;
}

function sign(payloadB64: string): string {
  return createHmac("sha256", signingSecret()).update(payloadB64).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/** Stable signed token — no expiry so old emails keep working. */
export function createBroadcastUnsubscribeToken(userId: string): string {
  const payload: TokenPayload = { u: userId, p: "broadcast" };
  const payloadB64 = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${payloadB64}.${sign(payloadB64)}`;
}

export function verifyBroadcastUnsubscribeToken(token: string): { userId: string } | null {
  if (!token || token.length > 512) return null;
  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig) return null;

  try {
    const expected = sign(payloadB64);
    if (!safeEqual(sig, expected)) return null;

    const parsed = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8")) as TokenPayload;
    if (parsed.p !== "broadcast" || typeof parsed.u !== "string" || parsed.u.length < 8) {
      return null;
    }
    return { userId: parsed.u };
  } catch {
    return null;
  }
}

/** Human page (footer link). */
export function broadcastUnsubscribePageUrl(userId: string): string {
  const token = createBroadcastUnsubscribeToken(userId);
  return `${SAMPLE_APP_URL}/unsubscribe?token=${encodeURIComponent(token)}`;
}

/** One-click / List-Unsubscribe target (accepts POST). */
export function broadcastUnsubscribeApiUrl(userId: string): string {
  const token = createBroadcastUnsubscribeToken(userId);
  return `${SAMPLE_APP_URL}/api/unsubscribe?token=${encodeURIComponent(token)}`;
}
