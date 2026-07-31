import { NextRequest, NextResponse } from "next/server";
import { getFreshSessionUser } from "@/lib/session";
import { getOnlineUserIds, touchPresence } from "@/lib/presence";

/** Heartbeat — call while the hub is open so others see you as online. */
export async function POST() {
  const user = await getFreshSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await touchPresence(user.id);
  return NextResponse.json({ ok: true });
}

/** Which of the given user ids are currently online? `?ids=a,b,c` */
export async function GET(req: NextRequest) {
  const user = await getFreshSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const raw = req.nextUrl.searchParams.get("ids") || "";
  const ids = Array.from(
    new Set(
      raw
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
        .slice(0, 100)
    )
  );

  const online = await getOnlineUserIds(ids);
  return NextResponse.json({ onlineIds: Array.from(online) });
}
