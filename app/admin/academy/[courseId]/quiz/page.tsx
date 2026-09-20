import Link from "next/link";
import { notFound } from "next/navigation";
import { academyDb, canAuthorAcademy, requireAcademyLearner } from "@/lib/academy";
import { submitAcademyQuiz } from "@/app/admin/academy/actions";
import QuizPlayer from "@/components/QuizPlayer";

export const dynamic = "force-dynamic";

export default async function AcademyQuizPage({
  params,
}: {
  params: { courseId: string };
}) {
  const user = await requireAcademyLearner();
  const author = await canAuthorAcademy();
  const db = academyDb();
  const course = await db.course.findFirst({
    where: { id: params.courseId, hubOwnerOnly: true },
    include: {
      quiz: { include: { questions: { orderBy: [{ order: "asc" }, { id: "asc" }] } } },
      lessons: { select: { id: true } },
    },
  });
  if (!course?.quiz || (!course.isPublished && !author)) notFound();

  const completedCount =
    course.lessons.length > 0
      ? await db.lessonProgress.count({
          where: {
            userId: user.id,
            lessonId: { in: course.lessons.map((lesson) => lesson.id) },
            completedAt: { not: null },
          },
        })
      : 0;
  const unlocked = completedCount >= course.lessons.length;
  const passed = await db.quizAttempt.findFirst({
    where: { userId: user.id, quizId: course.quiz.id, passed: true },
    select: { id: true },
  });

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link
        href={`/admin/academy/${course.id}`}
        className="font-body text-sm text-off-white/50 hover:text-off-white"
      >
        &larr; {course.title}
      </Link>
      <h1 className="mt-4 font-display text-4xl tracking-wide text-off-white">Course quiz</h1>
      <div className="mt-8">
        {!unlocked ? (
          <div className="glass rounded-2xl p-6">
            <p className="font-body text-sm text-off-white/70">
              Finish every lesson before taking the quiz.
            </p>
            <Link
              href={`/admin/academy/${course.id}`}
              className="mt-4 inline-block font-body text-sm text-cyan hover:underline"
            >
              Back to lessons
            </Link>
          </div>
        ) : (
          <QuizPlayer
            courseId={course.id}
            completed={Boolean(passed)}
            submitAction={submitAcademyQuiz}
            quiz={{
              id: course.quiz.id,
              title: course.quiz.title,
              passScore: course.quiz.passScore,
              questions: course.quiz.questions.map((question) => ({
                id: question.id,
                type: question.type,
                text: question.text,
                options: question.options as string[],
              })),
            }}
          />
        )}
      </div>
    </main>
  );
}
