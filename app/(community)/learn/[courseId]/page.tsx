import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { getOrCreateEnrollment } from "@/lib/learning";

export const dynamic = "force-dynamic";

export default async function CourseDetailPage({
  params,
}: {
  params: { courseId: string };
}) {
  const { user } = await requireProfile();

  const course = await prisma.course.findUnique({
    where: { id: params.courseId },
    include: {
      lessons: {
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        include: { quiz: { select: { id: true } } },
      },
    },
  });

  if (!course || !course.isPublished) notFound();

  await getOrCreateEnrollment(user.id, course.id);

  const lessonIds = course.lessons.map((l) => l.id);
  const completedProgress =
    lessonIds.length > 0
      ? await prisma.lessonProgress.findMany({
          where: { userId: user.id, lessonId: { in: lessonIds }, completedAt: { not: null } },
          select: { lessonId: true },
        })
      : [];
  const completedLessonIds = new Set(completedProgress.map((p) => p.lessonId));

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/learn"
          className="font-body text-sm text-off-white/50 transition hover:text-off-white"
        >
          &larr; Learning Center
        </Link>
        <h1 className="mt-4 font-display text-5xl tracking-wide text-gradient">{course.title}</h1>
        {course.description && (
          <p className="mt-2 font-body text-off-white/60">{course.description}</p>
        )}
        {course.xpReward > 0 && (
          <p className="mt-2 font-body text-sm text-orange">
            Complete this course for +{course.xpReward} XP
          </p>
        )}

        <div className="mt-8 flex flex-col gap-2">
          {course.lessons.length === 0 && (
            <p className="glass rounded-2xl p-8 text-center font-body text-off-white/50">
              No lessons yet. Check back soon.
            </p>
          )}
          {course.lessons.map((lesson, index) => {
            const isDone = completedLessonIds.has(lesson.id);
            return (
              <Link
                key={lesson.id}
                href={`/learn/${course.id}/lessons/${lesson.id}`}
                className="glass flex items-center justify-between gap-4 rounded-xl p-4 transition hover:border-cyan/40"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border font-body text-xs ${
                      isDone
                        ? "border-cyan bg-cyan/10 text-cyan"
                        : "border-off-white/20 text-off-white/50"
                    }`}
                  >
                    {isDone ? "✓" : index + 1}
                  </span>
                  <div>
                    <p className="font-body text-sm font-medium text-off-white">{lesson.title}</p>
                    {lesson.quiz && (
                      <p className="mt-0.5 font-body text-xs text-off-white/40">Includes quiz</p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
