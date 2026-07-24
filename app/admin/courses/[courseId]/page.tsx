import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createLesson } from "../actions";
import CourseEditForm from "@/components/admin/CourseEditForm";
import LessonRow from "@/components/admin/LessonRow";
import BadgeManager from "@/components/admin/BadgeManager";
import type { QuestionData } from "@/components/admin/QuestionForm";

export const dynamic = "force-dynamic";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60";

export default async function AdminCourseDetailPage({
  params,
}: {
  params: { courseId: string };
}) {
  const course = await prisma.course.findUnique({
    where: { id: params.courseId },
    include: {
      lessons: {
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        include: {
          quiz: { include: { questions: { orderBy: [{ order: "asc" }] } } },
        },
      },
      badges: true,
      enrollments: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { enrolledAt: "desc" },
      },
    },
  });

  if (!course) notFound();

  const lessonIds = course.lessons.map((l) => l.id);
  const enrolledUserIds = course.enrollments.map((e) => e.userId);

  const progressCounts =
    lessonIds.length > 0 && enrolledUserIds.length > 0
      ? await prisma.lessonProgress.groupBy({
          by: ["userId"],
          where: {
            userId: { in: enrolledUserIds },
            lessonId: { in: lessonIds },
            completedAt: { not: null },
          },
          _count: true,
        })
      : [];
  const progressMap = new Map(progressCounts.map((p) => [p.userId, p._count]));

  const badge = course.badges[0] ?? null;

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link
        href="/admin/courses"
        className="font-body text-sm text-off-white/50 transition hover:text-off-white"
      >
        &larr; All courses
      </Link>
      <h1 className="mt-4 font-display text-5xl tracking-wide text-gradient">{course.title}</h1>
      <p className="mt-2 font-body text-sm text-off-white/40">
        {course.isPublished ? "Published" : "Draft"} {" \u00b7 "} {course.lessons.length} lesson
        {course.lessons.length === 1 ? "" : "s"} {" \u00b7 "} {course.enrollments.length} enrolled
      </p>

      <section className="mt-8">
        <CourseEditForm
          course={{
            id: course.id,
            title: course.title,
            description: course.description,
            thumbnailUrl: course.thumbnailUrl,
            category: course.category,
            isPublished: course.isPublished,
            xpReward: course.xpReward,
          }}
        />
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl tracking-wide text-off-white/80">Lessons</h2>
        <p className="mt-1 font-body text-sm text-off-white/50">
          Ordered content the member works through. Each lesson can have a video, text, and an
          optional quiz.
        </p>

        <div className="mt-4 flex flex-col gap-3">
          {course.lessons.length === 0 && (
            <p className="glass rounded-2xl p-6 text-center font-body text-sm text-off-white/40">
              No lessons yet. Add one below.
            </p>
          )}
          {course.lessons.map((lesson, index) => (
            <LessonRow
              key={lesson.id}
              courseId={course.id}
              isFirst={index === 0}
              isLast={index === course.lessons.length - 1}
              lesson={{
                id: lesson.id,
                title: lesson.title,
                videoUrl: lesson.videoUrl,
                content: lesson.content,
                quiz: lesson.quiz
                  ? {
                      id: lesson.quiz.id,
                      title: lesson.quiz.title,
                      passScore: lesson.quiz.passScore,
                      questions: lesson.quiz.questions.map((q) => ({
                        id: q.id,
                        type: q.type,
                        text: q.text,
                        options: q.options as string[],
                        correctAnswer: q.correctAnswer as string | string[],
                      })) satisfies QuestionData[],
                    }
                  : null,
              }}
            />
          ))}
        </div>

        <form
          action={createLesson}
          className="glass mt-4 flex flex-col gap-3 rounded-2xl p-6"
        >
          <input type="hidden" name="courseId" value={course.id} />
          <h3 className="font-display text-lg tracking-wide text-off-white/80">Add lesson</h3>
          <input name="title" required placeholder="Lesson title" className={fieldClass} />
          <input
            name="videoUrl"
            placeholder="YouTube or Vimeo URL (optional)"
            className={fieldClass}
          />
          <textarea
            name="content"
            rows={3}
            placeholder="Lesson text content (optional)"
            className={fieldClass}
          />
          <button
            type="submit"
            className="self-start rounded-lg bg-orange px-6 py-2 font-body font-semibold text-off-white shadow-glow transition hover:brightness-110"
          >
            Add lesson
          </button>
        </form>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl tracking-wide text-off-white/80">Badge</h2>
        <p className="mt-1 font-body text-sm text-off-white/50">
          Auto-awarded to members when they complete this course.
        </p>
        <div className="mt-4">
          <BadgeManager courseId={course.id} badge={badge} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl tracking-wide text-off-white/80">
          Learner progress
        </h2>
        <div className="glass mt-4 overflow-hidden rounded-2xl">
          {course.enrollments.length === 0 ? (
            <p className="p-6 text-center font-body text-sm text-off-white/40">
              No one has viewed this course yet.
            </p>
          ) : (
            <table className="w-full font-body text-sm">
              <thead>
                <tr className="border-b border-off-white/10 text-left text-xs uppercase tracking-wide text-off-white/40">
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {course.enrollments.map((enrollment) => {
                  const completedLessons = progressMap.get(enrollment.userId) ?? 0;
                  return (
                    <tr key={enrollment.id} className="border-b border-off-white/5 last:border-0">
                      <td className="px-4 py-3 text-off-white/90">
                        {enrollment.user.name || enrollment.user.email}
                      </td>
                      <td className="px-4 py-3 text-off-white/60">
                        {enrollment.completedAt ? (
                          <span className="text-cyan">
                            Completed{" "}
                            {enrollment.completedAt.toLocaleDateString([], {
                              dateStyle: "medium",
                            })}
                          </span>
                        ) : (
                          `In progress \u2014 ${completedLessons} of ${course.lessons.length} lessons`
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </main>
  );
}
