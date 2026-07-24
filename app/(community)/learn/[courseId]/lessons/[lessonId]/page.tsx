import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import VideoEmbed from "@/components/VideoEmbed";
import LessonCompleteButton from "@/components/LessonCompleteButton";
import QuizPlayer from "@/components/QuizPlayer";

export const dynamic = "force-dynamic";

export default async function LessonPage({
  params,
}: {
  params: { courseId: string; lessonId: string };
}) {
  const { user } = await requireProfile();

  const lesson = await prisma.lesson.findUnique({
    where: { id: params.lessonId },
    include: {
      course: { select: { id: true, title: true, isPublished: true } },
      quiz: { include: { questions: { orderBy: [{ order: "asc" }] } } },
    },
  });

  if (!lesson || lesson.courseId !== params.courseId || !lesson.course.isPublished) {
    notFound();
  }

  const progress = await prisma.lessonProgress.findUnique({
    where: { userId_lessonId: { userId: user.id, lessonId: lesson.id } },
  });
  const isComplete = !!progress?.completedAt;

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <Link
          href={`/learn/${lesson.course.id}`}
          className="font-body text-sm text-off-white/50 transition hover:text-off-white"
        >
          &larr; {lesson.course.title}
        </Link>
        <h1 className="mt-4 font-display text-4xl tracking-wide text-off-white">{lesson.title}</h1>

        {lesson.videoUrl && (
          <div className="mt-6">
            <VideoEmbed url={lesson.videoUrl} />
          </div>
        )}

        {lesson.content && (
          <div className="glass mt-6 whitespace-pre-wrap rounded-2xl p-6 font-body text-sm leading-relaxed text-off-white/80">
            {lesson.content}
          </div>
        )}

        <div className="mt-8">
          {lesson.quiz ? (
            <QuizPlayer
              lessonId={lesson.id}
              completed={isComplete}
              quiz={{
                id: lesson.quiz.id,
                title: lesson.quiz.title,
                passScore: lesson.quiz.passScore,
                questions: lesson.quiz.questions.map((q) => ({
                  id: q.id,
                  type: q.type,
                  text: q.text,
                  options: q.options as string[],
                })),
              }}
            />
          ) : (
            <LessonCompleteButton lessonId={lesson.id} completed={isComplete} />
          )}
        </div>
      </div>
    </main>
  );
}
