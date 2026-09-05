import { NextResponse } from "next/server";
import { getApiUserWithProfile, apiAuthErrorResponse } from "@/lib/apiAuth";
import { getSuggestionUnreadCount } from "@/lib/suggestionReads";
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

  const count = await getSuggestionUnreadCount(auth.user.id);
  return NextResponse.json({ count });
}
