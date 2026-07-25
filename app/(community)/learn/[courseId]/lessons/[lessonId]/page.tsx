import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { getOrCreateEnrollment, isLessonUnlocked } from "@/lib/learning";
import { canAccessCourse, getUserGroupIds } from "@/lib/groups";
import { isAdminRole } from "@/lib/rbac";
import VideoEmbed from "@/components/VideoEmbed";
import HtmlEmbed from "@/components/HtmlEmbed";
import LessonCompleteButton from "@/components/LessonCompleteButton";
import QuizPlayer from "@/components/QuizPlayer";

export const dynamic = "force-dynamic";

export default async function LessonPage({
  params,
}: {
  params: { courseId: string; lessonId: string };
}) {
  const { user } = await requireProfile();
  const userGroupIds = await getUserGroupIds(user.id);

  const lesson = await prisma.lesson.findUnique({
    where: { id: params.lessonId },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          isPublished: true,
          groups: { select: { id: true } },
        },
      },
      quiz: { include: { questions: { orderBy: [{ order: "asc" }] } } },
    },
  });

  if (!lesson || lesson.courseId !== params.courseId || !lesson.course.isPublished) {
    notFound();
  }

  if (!canAccessCourse(user.role, lesson.course, userGroupIds)) {
    redirect("/learn");
  }

  const enrollment = await getOrCreateEnrollment(user.id, lesson.courseId);
  const bypassDrip = isAdminRole(user.role);
  if (!bypassDrip && !isLessonUnlocked(lesson, enrollment)) {
    redirect(`/learn/${lesson.courseId}`);
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

        {lesson.audioUrl && (
          <div className="glass mt-6 rounded-2xl p-4">
            <audio controls src={lesson.audioUrl} className="w-full" preload="metadata">
              Your browser does not support the audio element.
            </audio>
          </div>
        )}

        {lesson.htmlEmbed && (
          <div className="mt-6">
            <HtmlEmbed html={lesson.htmlEmbed} />
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
