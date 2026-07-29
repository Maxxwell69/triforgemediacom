import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getFreshSessionUser } from "@/lib/session";
import { isAdminRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { createPresignedVideoUpload } from "@/lib/r2";
const bodySchema = z.object({
  webinarId: z.string().min(1),
  contentType: z.enum(["video/mp4", "video/webm", "video/quicktime"]),
  fileSize: z.number().int().positive(),
});

export async function POST(request: NextRequest) {
  const user = await getFreshSessionUser();
  if (!user || !isAdminRole(user.role)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid input" },
      { status: 400 }
    );
  }

  const webinar = await prisma.webinar.findUnique({
    where: { id: parsed.data.webinarId },
    select: { id: true },
  });
  if (!webinar) {
    return NextResponse.json({ error: "Webinar not found" }, { status: 404 });
  }

  try {
    const signed = await createPresignedVideoUpload({
      webinarId: parsed.data.webinarId,
      contentType: parsed.data.contentType,
      fileSize: parsed.data.fileSize,
    });
    return NextResponse.json(signed);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create upload URL";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
