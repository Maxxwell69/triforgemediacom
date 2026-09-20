import Link from "next/link";
import { notFound } from "next/navigation";
import {
  academyDb,
  canAuthorAcademy,
  ensureAcademyEnrollment,
  getOrderedLessonSequence,
  requireAcademyLearner,
} from "@/lib/academy";
import { markAcademyLessonComplete } from "@/app/admin/academy/actions";
import VideoEmbed from "@/components/VideoEmbed";
import HtmlEmbed from "@/components/HtmlEmbed";
import { sanitizeLessonHtml } from "@/lib/sanitizeHtml";
import { LESSON_CONTENT_CLASSES } from "@/lib/lessonContentClasses";
import LessonCompleteButton from "@/components/LessonCompleteButton";

export const dynamic = "force-dynamic";

export default async function AcademyLessonPage({
  params,
}: {
  params: { courseId: string; lessonId: string };
}) {
  const user = await requireAcademyLearner();
  const author = await canAuthorAcademy();
  const db = academyDb();
  const lesson = await db.lesson.findUnique({
    where: { id: params.lessonId },
    include: {
      course: { select: { id: true, title: true, hubOwnerOnly: true, isPublished: true } },
    },
  });
  if (
    !lesson ||
    lesson.courseId !== params.courseId ||
    !lesson.course.hubOwnerOnly ||
    (!lesson.course.isPublished && !author)
  ) {
    notFound();
  }

  await ensureAcademyEnrollment(user.id, lesson.courseId);
  const [progress, modules, siblings] = await Promise.all([
    db.lessonProgress.findUnique({
      where: { userId_lessonId: { userId: user.id, lessonId: lesson.id } },
    }),
    db.module.findMany({
      where: { courseId: lesson.courseId },
      select: { id: true, order: true },
    }),
    db.lesson.findMany({
      where: { courseId: lesson.courseId },
      select: { id: true, title: true, moduleId: true, order: true },
    }),
  ]);
  const sequence = getOrderedLessonSequence(modules, siblings);
  const index = sequence.findIndex((row) => row.id === lesson.id);
  const prev = index > 0 ? sequence[index - 1] : null;
  const next = index >= 0 && index < sequence.length - 1 ? sequence[index + 1] : null;

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link
        href={`/admin/academy/${lesson.courseId}`}
        className="font-body text-sm text-off-white/50 hover:text-off-white"
      >
        &larr; {lesson.course.title}
      </Link>
      {index >= 0 ? (
        <p className="mt-4 font-body text-xs font-semibold uppercase tracking-wide text-cyan/70">
          Lesson {index + 1} of {sequence.length}
        </p>
      ) : null}
      <h1 className="mt-2 font-display text-4xl tracking-wide text-off-white">{lesson.title}</h1>

      {lesson.videoUrl ? (
        <div className="mt-6">
          <VideoEmbed url={lesson.videoUrl} />
        </div>
      ) : null}
      {lesson.audioUrl ? (
        <div className="glass mt-6 rounded-2xl p-4">
          <audio controls src={lesson.audioUrl} className="w-full" preload="metadata">
            Your browser does not support the audio element.
          </audio>
        </div>
      ) : null}
      {lesson.htmlEmbed ? (
        <div className="mt-6">
          <HtmlEmbed html={lesson.htmlEmbed} />
        </div>
      ) : null}
      {lesson.content ? (
        <div
          className={`lesson-canvas mt-6 overflow-hidden rounded-2xl bg-off-white ${LESSON_CONTENT_CLASSES}`}
          dangerouslySetInnerHTML={{ __html: sanitizeLessonHtml(lesson.content) }}
        />
      ) : null}

      <div className="mt-8">
        <LessonCompleteButton
          lessonId={lesson.id}
          completed={Boolean(progress?.completedAt)}
          completeAction={markAcademyLessonComplete}
        />
      </div>

      <div className="mt-10 flex items-center justify-between gap-4 border-t border-off-white/10 pt-6">
        {prev ? (
          <Link
            href={`/admin/academy/${lesson.courseId}/lessons/${prev.id}`}
            className="glass rounded-xl px-4 py-3 font-body text-sm text-off-white/80"
          >
            ← {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/admin/academy/${lesson.courseId}/lessons/${next.id}`}
            className="glass rounded-xl px-4 py-3 text-right font-body text-sm text-off-white/80"
          >
            {next.title} →
          </Link>
        ) : null}
      </div>
    </main>
  );
}
