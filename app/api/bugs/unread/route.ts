import { NextResponse } from "next/server";
import { getApiUserWithProfile, apiAuthErrorResponse } from "@/lib/apiAuth";
import { getBugReportUnreadCount } from "@/lib/bugReads";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await getApiUserWithProfile();
  if ("error" in auth) {
    const { status, body } = apiAuthErrorResponse(auth.error);
    return NextResponse.json(body, { status });
  }

  const count = await getBugReportUnreadCount(auth.user.id);
  return NextResponse.json({ count });
}
