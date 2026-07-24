import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUserWithProfile, apiAuthErrorResponse } from "@/lib/apiAuth";
import { startOfTodayUTC } from "@/lib/tiktask";
import { hasTikTaskAccess } from "@/lib/groups";

export async function POST(
  _req: Request,
  { params }: { params: { dailyTaskId: string } }
) {
  const result = await getApiUserWithProfile();
  if ("error" in result) {
    const { status, body } = apiAuthErrorResponse(result.error);
    return NextResponse.json(body, { status });
  }
  const { user } = result;

  if (!(await hasTikTaskAccess(user.id))) {
    return NextResponse.json({ error: "TikTask isn't available for your group." }, { status: 403 });
  }

  const dailyTask = await prisma.dailyTask.findUnique({
    where: { id: params.dailyTaskId },
    include: { template: true },
  });

  if (!dailyTask || dailyTask.userId !== user.id) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }
  if (dailyTask.status === "DONE") {
    return NextResponse.json({ error: "Task already completed" }, { status: 409 });
  }

  const today = startOfTodayUTC();
  const alreadyCompletedToday = await prisma.dailyTask.findFirst({
    where: { userId: user.id, date: today, status: "DONE" },
    select: { id: true },
  });

  const [updatedTask] = await prisma.$transaction([
    prisma.dailyTask.update({
      where: { id: dailyTask.id },
      data: { status: "DONE", completedAt: new Date() },
      include: { template: true },
    }),
    prisma.xPEvent.create({
      data: {
        userId: user.id,
        amount: dailyTask.template.xpValue,
        source: "TASK_COMPLETION",
        refId: dailyTask.id,
      },
    }),
    prisma.profile.update({
      where: { userId: user.id },
      data: {
        lastActiveAt: new Date(),
        ...(alreadyCompletedToday ? {} : { streakCount: { increment: 1 } }),
      },
    }),
  ]);

  return NextResponse.json({ task: updatedTask, xpAwarded: dailyTask.template.xpValue });
}
