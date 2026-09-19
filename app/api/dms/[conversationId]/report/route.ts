import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUserWithProfile, apiAuthErrorResponse } from "@/lib/apiAuth";
import { canAccessConversation } from "@/lib/dmAccess";
import { z } from "zod";

const reportSchema = z.object({
  reason: z.string().trim().min(8, "Tell us what happened (at least 8 characters).").max(1000),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  const auth = await getApiUserWithProfile();
  if ("error" in auth) {
    const { status, body } = apiAuthErrorResponse(auth.error);
    return NextResponse.json(body, { status });
  }

  if (!(await canAccessConversation(auth.user.id, auth.user.role, params.conversationId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid report" },
      { status: 400 }
    );
  }

  const report = await prisma.dmReport.create({
    data: {
      conversationId: params.conversationId,
      reporterId: auth.user.id,
      reason: parsed.data.reason,
    },
    select: { id: true },
  });

  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", status: "ACTIVE" },
    select: { id: true },
  });
  await Promise.all(
    admins.map((admin) =>
      prisma.hubNotification.create({
        data: {
          userId: admin.id,
          title: "A DM was reported",
          body: parsed.data.reason.slice(0, 200),
          href: `/admin/dms?report=${report.id}`,
        },
      })
    )
  );

  return NextResponse.json({ ok: true, reportId: report.id }, { status: 201 });
}
