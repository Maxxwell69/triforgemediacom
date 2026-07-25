import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createLesson, createModule } from "../actions";
import CourseEditForm from "@/components/admin/CourseEditForm";
import CourseGroupsForm from "@/components/admin/CourseGroupsForm";
import LessonRow from "@/components/admin/LessonRow";
import ModuleRow from "@/components/admin/ModuleRow";
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
  const [course, allGroups] = await Promise.all([
    prisma.course.findUnique({
      where: { id: params.courseId },
      include: {
        modules: {
          orderBy: [{ order: "asc" }, { createdAt: "asc" }],
          include: { _count: { select: { lessons: true } } },
        },
        lessons: {
          orderBy: [{ order: "asc" }, { createdAt: "asc" }],
          include: {
            quiz: { include: { questions: { orderBy: [{ order: "asc" }] } } },
          },
        },
        badges: true,
        groups: { select: { id: true } },
        enrollments: {
          include: { user: { select: { id: true, name: true, email: true } } },
          orderBy: { enrolledAt: "desc" },
        },
      },
    }),
    prisma.group.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, color: true },
    }),
  ]);

  if (!course) notFound();

  const detail = course;
  const lessonIds = detail.lessons.map((l) => l.id);
  const enrolledUserIds = detail.enrollments.map((e) => e.userId);

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

  const badge = detail.badges[0] ?? null;
  const moduleOptions = detail.modules.map((m) => ({ id: m.id, title: m.title }));

  type LessonItem = (typeof detail.lessons)[number];
  const unsortedLessons = detail.lessons.filter((l) => !l.moduleId);
  const lessonsByModule = new Map<string, LessonItem[]>();
  for (const mod of detail.modules) {
    lessonsByModule.set(
      mod.id,
      detail.lessons.filter((l) => l.moduleId === mod.id)
    );
  }

  function renderLessonRow(lesson: LessonItem, index: number, group: LessonItem[]) {
    return (
      <LessonRow
        key={lesson.id}
        courseId={detail.id}
        modules={moduleOptions}
        isFirst={index === 0}
        isLast={index === group.length - 1}
        lesson={{
          id: lesson.id,
          title: lesson.title,
          moduleId: lesson.moduleId,
          videoUrl: lesson.videoUrl,
          audioUrl: lesson.audioUrl,
          htmlEmbed: lesson.htmlEmbed,
          content: lesson.content,
          dripDaysAfterEnroll: lesson.dripDaysAfterEnroll,
          dripUnlockAt: lesson.dripUnlockAt,
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
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link
        href="/admin/courses"
        className="font-body text-sm text-off-white/50 transition hover:text-off-white"
      >
        &larr; All courses
      </Link>
      <h1 className="mt-4 font-display text-5xl tracking-wide text-gradient">{detail.title}</h1>
      <p className="mt-2 font-body text-sm text-off-white/40">
        {detail.isPublished ? "Published" : "Draft"} {" \u00b7 "} {detail.lessons.length} lesson
        {detail.lessons.length === 1 ? "" : "s"} {" \u00b7 "} {detail.modules.length} module
        {detail.modules.length === 1 ? "" : "s"} {" \u00b7 "} {detail.enrollments.length} enrolled
      </p>

      <section className="mt-8">
        <CourseEditForm
          course={{
            id: detail.id,
            title: detail.title,
            description: detail.description,
            thumbnailUrl: detail.thumbnailUrl,
            category: detail.category,
            isPublished: detail.isPublished,
            xpReward: detail.xpReward,
            completionGroupId: detail.completionGroupId,
          }}
          groups={allGroups.map((g) => ({ id: g.id, name: g.name }))}
        />
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl tracking-wide text-off-white/80">Access groups</h2>
        <div className="glass mt-4 rounded-2xl p-6">
          <CourseGroupsForm
            courseId={detail.id}
            allGroups={allGroups}
            selectedGroupIds={detail.groups.map((g) => g.id)}
          />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl tracking-wide text-off-white/80">Modules</h2>
        <p className="mt-1 font-body text-sm text-off-white/50">
          Optional groupings for lessons inside this course.
        </p>

        <div className="mt-4 flex flex-col gap-3">
          {detail.modules.length === 0 && (
            <p className="glass rounded-2xl p-6 text-center font-body text-sm text-off-white/40">
              No modules yet. Lessons can stay unsorted, or add a module below.
            </p>
          )}
          {detail.modules.map((mod, index) => (
            <ModuleRow
              key={mod.id}
              courseId={detail.id}
              isFirst={index === 0}
              isLast={index === detail.modules.length - 1}
              module={{
                id: mod.id,
                title: mod.title,
                description: mod.description,
                lessonCount: mod._count.lessons,
              }}
            />
          ))}
        </div>

        <form
          action={createModule}
          className="glass mt-4 flex flex-col gap-3 rounded-2xl p-6"
        >
          <input type="hidden" name="courseId" value={detail.id} />
          <h3 className="font-display text-lg tracking-wide text-off-white/80">Add module</h3>
          <input name="title" required placeholder="Module title" className={fieldClass} />
          <textarea
            name="description"
            rows={2}
            placeholder="Description (optional)"
            className={fieldClass}
          />
          <button
            type="submit"
            className="self-start rounded-lg bg-orange px-6 py-2 font-body font-semibold text-off-white shadow-glow transition hover:brightness-110"
          >
            Add module
          </button>
        </form>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl tracking-wide text-off-white/80">Lessons</h2>
        <p className="mt-1 font-body text-sm text-off-white/50">
          Ordered content the member works through. Each lesson can have video, audio, an HTML
          embed, text, drip scheduling, and an optional quiz.
        </p>

        <div className="mt-4 flex flex-col gap-6">
          {detail.lessons.length === 0 && (
            <p className="glass rounded-2xl p-6 text-center font-body text-sm text-off-white/40">
              No lessons yet. Add one below.
            </p>
          )}

          {unsortedLessons.length > 0 && (
            <div>
              <h3 className="mb-2 font-body text-xs font-semibold uppercase tracking-wide text-off-white/40">
                No module
              </h3>
              <div className="flex flex-col gap-3">
                {unsortedLessons.map((lesson, index) =>
                  renderLessonRow(lesson, index, unsortedLessons)
                )}
              </div>
            </div>
          )}

          {detail.modules.map((mod) => {
            const group = lessonsByModule.get(mod.id) ?? [];
            if (group.length === 0) return null;
            return (
              <div key={mod.id}>
                <h3 className="mb-2 font-body text-xs font-semibold uppercase tracking-wide text-cyan/70">
                  {mod.title}
                </h3>
                <div className="flex flex-col gap-3">
                  {group.map((lesson, index) => renderLessonRow(lesson, index, group))}
                </div>
              </div>
            );
          })}
        </div>

        <form
          action={createLesson}
          className="glass mt-4 flex flex-col gap-3 rounded-2xl p-6"
        >
          <input type="hidden" name="courseId" value={detail.id} />
          <h3 className="font-display text-lg tracking-wide text-off-white/80">Add lesson</h3>
          <input name="title" required placeholder="Lesson title" className={fieldClass} />
          <label className="flex flex-col gap-1 font-body text-xs text-off-white/60">
            Module
            <select name="moduleId" defaultValue="" className={fieldClass}>
              <option value="">No module / Unsorted</option>
              {moduleOptions.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
          </label>
          <input
            name="videoUrl"
            placeholder="YouTube or Vimeo URL (optional)"
            className={fieldClass}
          />
          <input
            name="audioUrl"
            placeholder="Audio file URL (optional)"
            className={fieldClass}
          />
          <textarea
            name="htmlEmbed"
            rows={2}
            placeholder="HTML iframe embed (optional)"
            className={fieldClass}
          />
          <textarea
            name="content"
            rows={3}
            placeholder="Lesson text content (optional)"
            className={fieldClass}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 font-body text-xs text-off-white/60">
              Days after enrollment
              <input
                type="number"
                name="dripDaysAfterEnroll"
                min={0}
                max={3650}
                placeholder="Optional"
                className={fieldClass}
              />
            </label>
            <label className="flex flex-col gap-1 font-body text-xs text-off-white/60">
              Unlock at
              <input type="datetime-local" name="dripUnlockAt" className={fieldClass} />
            </label>
          </div>
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
          <BadgeManager courseId={detail.id} badge={badge} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl tracking-wide text-off-white/80">
          Learner progress
        </h2>
        <div className="glass mt-4 overflow-hidden rounded-2xl">
          {detail.enrollments.length === 0 ? (
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
                {detail.enrollments.map((enrollment) => {
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
                          `In progress \u2014 ${completedLessons} of ${detail.lessons.length} lessons`
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
