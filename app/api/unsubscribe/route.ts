import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyBroadcastUnsubscribeToken } from "@/lib/broadcastUnsubscribe";

async function optOut(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { broadcastEmailsOptIn: false },
  });
}

/**
 * RFC 8058 one-click unsubscribe. Mail clients POST
 * `List-Unsubscribe=One-Click` to the List-Unsubscribe URL.
 */
export async function POST(req: NextRequest) {
  let token = req.nextUrl.searchParams.get("token");
  if (!token) {
    try {
      const form = await req.formData();
      token = form.get("token")?.toString() || null;
    } catch {
      token = null;
    }
  }

  const verified = token ? verifyBroadcastUnsubscribeToken(token) : null;
  if (!verified) {
    return NextResponse.json({ error: "Invalid unsubscribe link" }, { status: 400 });
  }

  await optOut(verified.userId);
  return new NextResponse(null, { status: 200 });
}

/** GET fallback when a client opens the List-Unsubscribe URL in a browser. */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const verified = token ? verifyBroadcastUnsubscribeToken(token) : null;
  if (!verified || !token) {
    return NextResponse.redirect(new URL("/unsubscribe?error=invalid", req.nextUrl.origin));
  }

  await optOut(verified.userId);
  return NextResponse.redirect(
    new URL(`/unsubscribe?token=${encodeURIComponent(token)}&done=1`, req.nextUrl.origin)
  );
}
