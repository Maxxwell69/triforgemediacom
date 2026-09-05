import { NextResponse } from "next/server";
import { getApiUserWithProfile, apiAuthErrorResponse } from "@/lib/apiAuth";
import { getSupportTicketUnreadCount } from "@/lib/supportReads";
import { hubHas } from "@/lib/hub/modules";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!hubHas("support")) {
    return NextResponse.json({ count: 0 });
  }

  const auth = await getApiUserWithProfile();
  if ("error" in auth) {
    const { status, body } = apiAuthErrorResponse(auth.error);
    return NextResponse.json(body, { status });
  }

  const count = await getSupportTicketUnreadCount(auth.user.id, auth.user.role);
  return NextResponse.json({ count });
}
