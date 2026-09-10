import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getFreshSessionUser } from "@/lib/session";
import { isAdminRole } from "@/lib/rbac";
import { socialPlannerEnabled } from "@/lib/socialPlanner/module";
import { createPresignedSocialPlannerUpload } from "@/lib/r2";

const bodySchema = z.object({
  contentType: z.enum(["video/mp4", "video/webm", "video/quicktime"]),
  fileSize: z.number().int().positive(),
});

export async function POST(request: NextRequest) {
  const user = await getFreshSessionUser();
  if (!user || !isAdminRole(user.role)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }
  if (!socialPlannerEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
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

  try {
    const signed = await createPresignedSocialPlannerUpload(parsed.data);
    return NextResponse.json(signed);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create upload URL";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
