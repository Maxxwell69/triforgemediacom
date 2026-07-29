import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { getOrCreateEnrollment, getOrderedLessonSequence, isLessonUnlocked } from "@/lib/learning";
import { canAccessCourse, getUserGroupIds } from "@/lib/groups";
import { isAdminRole } from "@/lib/rbac";
import { canViewCourse } from "@/lib/courseAccess";
import VideoEmbed from "@/components/VideoEmbed";
import HtmlEmbed from "@/components/HtmlEmbed";
import { sanitizeLessonHtml } from "@/lib/sanitizeHtml";
import { LESSON_CONTENT_CLASSES } from "@/lib/lessonContentClasses";
import LessonCompleteButton from "@/components/LessonCompleteButton";
import AssignmentSubmissionForm from "@/components/AssignmentSubmissionForm";
import DraftPreviewBanner from "@/components/learn/DraftPreviewBanner";

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
      assignment: true,
    },
  });

  if (!lesson || lesson.courseId !== params.courseId || !canViewCourse(lesson.course, user.role)) {
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

  const isDraftPreview = !lesson.course.isPublished;

  const [progress, modules, siblingLessons, mySubmission] = await Promise.all([
    prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId: user.id, lessonId: lesson.id } },
    }),
    prisma.module.findMany({
      where: { courseId: lesson.courseId },
      select: { id: true, order: true },
    }),
    prisma.lesson.findMany({
      where: { courseId: lesson.courseId },
      select: { id: true, title: true, moduleId: true, order: true },
    }),
    lesson.assignment
      ? prisma.assignmentSubmission.findUnique({
          where: { assignmentId_userId: { assignmentId: lesson.assignment.id, userId: user.id } },
        })
      : Promise.resolve(null),
  ]);
  const isComplete = !!progress?.completedAt;

  const sequence = getOrderedLessonSequence(modules, siblingLessons);
  const currentIndex = sequence.findIndex((l) => l.id === lesson.id);
  const prevLesson = currentIndex > 0 ? sequence[currentIndex - 1] : null;
  const nextLesson =
    currentIndex >= 0 && currentIndex < sequence.length - 1 ? sequence[currentIndex + 1] : null;

  return (
    <>
      {isDraftPreview && (
        <DraftPreviewBanner courseId={lesson.course.id} courseTitle={lesson.course.title} />
      )}
      <main className="flex-1 px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <Link
          href={`/learn/${lesson.course.id}`}
          className="font-body text-sm text-off-white/50 transition hover:text-off-white"
        >
          &larr; {lesson.course.title}
        </Link>
        {currentIndex >= 0 && (
          <p className="mt-4 font-body text-xs font-semibold uppercase tracking-wide text-cyan/70">
            Lesson {currentIndex + 1} of {sequence.length}
          </p>
        )}
        <h1 className="mt-1 font-display text-4xl tracking-wide text-off-white">{lesson.title}</h1>

        {lesson.thumbnailUrl && (
          <div className="relative mt-6 w-full overflow-hidden rounded-2xl bg-charcoal/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lesson.thumbnailUrl}
              alt=""
              className="block h-auto w-full object-contain"
            />
          </div>
        )}

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
          <div
            className={`mt-6 overflow-hidden rounded-2xl bg-off-white ${LESSON_CONTENT_CLASSES}`}
            dangerouslySetInnerHTML={{ __html: sanitizeLessonHtml(lesson.content) }}
          />
        )}

        <div className="mt-8">
          {lesson.assignment ? (
            <AssignmentSubmissionForm
              lessonId={lesson.id}
              title={lesson.assignment.title}
              instructions={lesson.assignment.instructions}
              submission={mySubmission}
            />
          ) : (
            <LessonCompleteButton lessonId={lesson.id} completed={isComplete} />
          )}
        </div>

        <div className="mt-10 flex items-center justify-between gap-4 border-t border-off-white/10 pt-6">
          {prevLesson ? (
            <Link
              href={`/learn/${lesson.courseId}/lessons/${prevLesson.id}`}
              className="glass flex min-w-0 flex-1 flex-col rounded-xl px-4 py-3 transition hover:border-cyan/40 sm:flex-none sm:max-w-[45%]"
            >
              <span className="font-body text-[10px] font-semibold uppercase tracking-wide text-off-white/40">
                &larr; Previous
              </span>
              <span className="truncate font-body text-sm text-off-white/80">{prevLesson.title}</span>
            </Link>
          ) : (
            <span />
          )}
          {nextLesson && (
            <Link
              href={`/learn/${lesson.courseId}/lessons/${nextLesson.id}`}
              className="glass flex min-w-0 flex-1 flex-col rounded-xl px-4 py-3 text-right transition hover:border-cyan/40 sm:flex-none sm:max-w-[45%]"
            >
              <span className="font-body text-[10px] font-semibold uppercase tracking-wide text-off-white/40">
                Next &rarr;
              </span>
              <span className="truncate font-body text-sm text-off-white/80">{nextLesson.title}</span>
            </Link>
          )}
        </div>
      </div>
    </main>
    </>
  );
}
