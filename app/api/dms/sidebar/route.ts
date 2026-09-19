import { NextResponse } from "next/server";
import { getApiUserWithProfile, apiAuthErrorResponse } from "@/lib/apiAuth";
import { bindClientHubSkus } from "@/lib/hub/modules";
import { hubDmAvailable, listDmSidebarRows } from "@/lib/dmSidebar";

export async function GET() {
  await bindClientHubSkus();
  const result = await getApiUserWithProfile();
  if ("error" in result) {
    const { status, body } = apiAuthErrorResponse(result.error);
    return NextResponse.json(body, { status });
  }

  if (!hubDmAvailable()) {
    return NextResponse.json({ conversations: [] });
  }

  const conversations = await listDmSidebarRows(result.user.id);
  return NextResponse.json({ conversations });
}
