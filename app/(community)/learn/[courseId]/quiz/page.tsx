import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { canAccessCourse, getUserGroupIds } from "@/lib/groups";
import { canViewCourse } from "@/lib/courseAccess";
import { isAdminRole } from "@/lib/rbac";
import QuizPlayer from "@/components/QuizPlayer";

export const dynamic = "force-dynamic";

export default async function CourseQuizPage({
  params,
}: {
  params: { courseId: string };
}) {
  const { user } = await requireProfile();
  const userGroupIds = await getUserGroupIds(user.id);

  const course = await prisma.course.findUnique({
    where: { id: params.courseId },
    include: {
      groups: { select: { id: true } },
      quiz: {
        include: {
          questions: { orderBy: [{ order: "asc" }, { id: "asc" }] },
        },
      },
      lessons: { select: { id: true } },
      enrollments: {
        where: { userId: user.id },
        select: { completedAt: true },
        take: 1,
      },
    },
  });

  if (!course || !canViewCourse(course, user.role)) notFound();
  if (!canAccessCourse(user.role, course, userGroupIds)) redirect("/learn");
  if (!course.quiz) redirect(`/learn/${course.id}`);

  const lessonIds = course.lessons.map((l) => l.id);
  const completedCount =
    lessonIds.length > 0
      ? await prisma.lessonProgress.count({
          where: {
            userId: user.id,
            lessonId: { in: lessonIds },
            completedAt: { not: null },
          },
        })
      : 0;
  const allLessonsDone = lessonIds.length === 0 || completedCount >= lessonIds.length;
  const bypass = isAdminRole(user.role);
  const quizUnlocked = bypass || allLessonsDone;

  const passedAttempt = await prisma.quizAttempt.findFirst({
    where: { userId: user.id, quizId: course.quiz.id, passed: true },
    select: { id: true },
  });
  const quizPassed = Boolean(passedAttempt) || Boolean(course.enrollments[0]?.completedAt);

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <Link
          href={`/learn/${course.id}`}
          className="font-body text-sm text-off-white/50 transition hover:text-off-white"
        >
          &larr; {course.title}
        </Link>
        <h1 className="mt-4 font-display text-4xl tracking-wide text-off-white">Course quiz</h1>
        <p className="mt-2 font-body text-sm text-off-white/50">
          Pass this quiz to complete the course
          {course.quiz.passScore ? ` (need ${course.quiz.passScore}%)` : ""}.
        </p>

        <div className="mt-8">
          {!quizUnlocked ? (
            <div className="glass rounded-2xl p-6">
              <p className="font-body text-sm text-off-white/70">
                Finish all {lessonIds.length} lesson{lessonIds.length === 1 ? "" : "s"} before
                taking the course quiz. You&apos;ve completed {completedCount} so far.
              </p>
              <Link
                href={`/learn/${course.id}`}
                className="mt-4 inline-block rounded-lg border border-cyan/40 px-4 py-2 font-body text-sm font-semibold text-cyan transition hover:bg-cyan/10"
              >
                Back to lessons
              </Link>
            </div>
          ) : (
            <QuizPlayer
              courseId={course.id}
              completed={quizPassed}
              quiz={{
                id: course.quiz.id,
                title: course.quiz.title,
                passScore: course.quiz.passScore,
                questions: course.quiz.questions.map((q) => ({
                  id: q.id,
                  type: q.type,
                  text: q.text,
                  options: q.options as string[],
                })),
              }}
            />
          )}
        </div>
      </div>
    </main>
  );
}
