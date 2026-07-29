import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUserWithProfile, apiAuthErrorResponse } from "@/lib/apiAuth";
import { isWebinarHost } from "@/lib/webinars";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  { params }: { params: { webinarId: string } }
) {
  const auth = await getApiUserWithProfile();
  if ("error" in auth) {
    const { status, body } = apiAuthErrorResponse(auth.error);
    return NextResponse.json(body, { status });
  }

  const webinar = await prisma.webinar.findUnique({ where: { id: params.webinarId } });
  if (!webinar) {
    return NextResponse.json({ error: "Webinar not found" }, { status: 404 });
  }

  if (!isWebinarHost(webinar, auth.user.id, auth.user.role)) {
    return NextResponse.json({ error: "Only the host can start this webinar." }, { status: 403 });
  }

  if (webinar.status === "ENDED") {
    return NextResponse.json({ error: "This webinar has already ended." }, { status: 400 });
  }

  const updated = await prisma.webinar.update({
    where: { id: webinar.id },
    data: {
      status: "LIVE",
      startedAt: webinar.startedAt ?? new Date(),
    },
  });

  return NextResponse.json({ webinar: updated });
}
