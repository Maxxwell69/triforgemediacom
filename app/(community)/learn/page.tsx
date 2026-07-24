import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function LearnPage() {
  const { user } = await requireProfile();

  const courses = await prisma.course.findMany({
    where: { isPublished: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: { lessons: { select: { id: true } } },
  });

  const courseIds = courses.map((c) => c.id);
  const allLessonIds = courses.flatMap((c) => c.lessons.map((l) => l.id));

  const [enrollments, completedProgress] = await Promise.all([
    prisma.enrollment.findMany({ where: { userId: user.id, courseId: { in: courseIds } } }),
    allLessonIds.length > 0
      ? prisma.lessonProgress.findMany({
          where: { userId: user.id, lessonId: { in: allLessonIds }, completedAt: { not: null } },
          select: { lessonId: true },
        })
      : Promise.resolve([]),
  ]);

  const enrollmentMap = new Map(enrollments.map((e) => [e.courseId, e]));
  const completedLessonIds = new Set(completedProgress.map((p) => p.lessonId));

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="font-display text-5xl tracking-wide">
          LEARNING <span className="text-gradient">CENTER</span>
        </h1>
        <p className="mt-2 font-body text-off-white/60">
          Courses to help you grow as a creator. Complete lessons and quizzes to earn XP and
          badges.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.length === 0 && (
            <p className="glass col-span-full rounded-2xl p-8 text-center font-body text-off-white/50">
              No courses available yet. Check back soon.
            </p>
          )}
          {courses.map((course) => {
            const totalLessons = course.lessons.length;
            const completedCount = course.lessons.filter((l) =>
              completedLessonIds.has(l.id)
            ).length;
            const enrollment = enrollmentMap.get(course.id);
            const isComplete = !!enrollment?.completedAt;
            const statusLabel = isComplete
              ? "Completed"
              : completedCount > 0
                ? `${completedCount} of ${totalLessons} lessons`
                : "Not started";

            return (
              <Link
                key={course.id}
                href={`/learn/${course.id}`}
                className="glass flex flex-col gap-3 rounded-2xl p-5 transition hover:border-cyan/40"
              >
                <div className="flex h-32 w-full items-center justify-center overflow-hidden rounded-xl bg-off-white/5">
                  {course.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={course.thumbnailUrl}
                      alt={course.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl">🎓</span>
                  )}
                </div>
                <div>
                  <p className="font-body font-semibold text-off-white">{course.title}</p>
                  {course.category && (
                    <p className="mt-0.5 font-body text-xs uppercase tracking-wide text-cyan/70">
                      {course.category}
                    </p>
                  )}
                  {course.description && (
                    <p className="mt-1 truncate font-body text-sm text-off-white/50">
                      {course.description}
                    </p>
                  )}
                </div>
                <div className="mt-auto flex items-center justify-between gap-3">
                  <span
                    className={`font-body text-xs font-semibold uppercase tracking-wide ${
                      isComplete ? "text-cyan" : "text-off-white/50"
                    }`}
                  >
                    {statusLabel}
                  </span>
                  {course.xpReward > 0 && (
                    <span className="font-body text-xs text-orange">+{course.xpReward} XP</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
