import Link from "next/link";
import { notFound } from "next/navigation";
import {
  canAuthorAcademy,
  ensureAcademyEnrollment,
  getAcademyCourse,
  getOrderedLessonSequence,
  requireAcademyLearner,
  academyDb,
} from "@/lib/academy";

export const dynamic = "force-dynamic";

export default async function AcademyCoursePage({
  params,
}: {
  params: { courseId: string };
}) {
  const user = await requireAcademyLearner();
  const author = await canAuthorAcademy();
  const course = await getAcademyCourse(params.courseId);
  if (!course) notFound();
  if (!course.isPublished && !author) notFound();

  await ensureAcademyEnrollment(user.id, course.id);
  const db = academyDb();
  const [progress, enrollment] = await Promise.all([
    db.lessonProgress.findMany({
      where: {
        userId: user.id,
        lessonId: { in: course.lessons.map((lesson) => lesson.id) },
        completedAt: { not: null },
      },
      select: { lessonId: true },
    }),
    db.enrollment.findUnique({
      where: { userId_courseId: { userId: user.id, courseId: course.id } },
      select: { completedAt: true },
    }),
  ]);
  const done = new Set(progress.map((row) => row.lessonId));
  const sequence = getOrderedLessonSequence(course.modules, course.lessons);
  const nextLesson = sequence.find((lesson) => !done.has(lesson.id)) ?? sequence[0];
  const allDone = course.lessons.length > 0 && done.size >= course.lessons.length;
  const unsortedLessons = course.lessons.filter((lesson) => !lesson.moduleId);
  const lessonsByModule = new Map(
    course.modules.map((mod) => [
      mod.id,
      course.lessons.filter((lesson) => lesson.moduleId === mod.id),
    ])
  );

  let lessonNumber = 0;
  function renderLesson(lesson: (typeof course.lessons)[number]) {
    lessonNumber += 1;
    const isDone = done.has(lesson.id);
    return (
      <Link
        key={lesson.id}
        href={`/admin/academy/${course.id}/lessons/${lesson.id}`}
        className="glass flex items-center gap-3 rounded-xl p-4 transition hover:border-cyan/40"
      >
        {lesson.thumbnailUrl ? (
          <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lesson.thumbnailUrl} alt="" className="h-full w-full object-cover" />
            {isDone ? (
              <span className="absolute inset-0 flex items-center justify-center bg-charcoal/55 font-body text-sm text-cyan">
                ✓
              </span>
            ) : null}
          </div>
        ) : (
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border font-body text-xs ${
              isDone ? "border-cyan bg-cyan/10 text-cyan" : "border-off-white/20 text-off-white/50"
            }`}
          >
            {isDone ? "✓" : lessonNumber}
          </span>
        )}
        <span className="font-body text-sm text-off-white">{lesson.title}</span>
      </Link>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/admin/academy" className="font-body text-sm text-off-white/50 hover:text-off-white">
        &larr; Hub Zero Academy
      </Link>
      {!course.isPublished ? (
        <p className="mt-4 font-body text-xs text-orange">Draft — only Hub 0 admins can see this.</p>
      ) : null}
      <h1 className="mt-4 font-display text-4xl tracking-wide text-gradient">{course.title}</h1>
      {course.description ? (
        <p className="mt-2 font-body text-off-white/60">{course.description}</p>
      ) : null}
      {enrollment?.completedAt ? (
        <p className="mt-3 font-body text-sm font-semibold text-cyan">✓ Completed</p>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        {nextLesson ? (
          <Link
            href={`/admin/academy/${course.id}/lessons/${nextLesson.id}`}
            className="rounded-lg bg-orange px-6 py-2.5 font-body font-semibold text-off-white shadow-glow transition hover:brightness-110"
          >
            {done.size > 0 ? "Continue" : "Start course"}
          </Link>
        ) : null}
        {course.quiz ? (
          <Link
            href={`/admin/academy/${course.id}/quiz`}
            className={`rounded-lg border px-6 py-2.5 font-body font-semibold ${
              allDone ? "border-cyan/40 text-cyan hover:bg-cyan/10" : "border-off-white/15 text-off-white/40"
            }`}
          >
            Course quiz
          </Link>
        ) : null}
        {author ? (
          <Link
            href={`/admin/courses/${course.id}`}
            className="rounded-lg border border-off-white/15 px-6 py-2.5 font-body text-sm text-off-white/70 hover:border-cyan/40 hover:text-cyan"
          >
            Edit on Hub 0
          </Link>
        ) : null}
      </div>

      <div className="mt-8 flex flex-col gap-6">
        {unsortedLessons.length > 0 ? (
          <div className="flex flex-col gap-2">
            {unsortedLessons.map((lesson) => renderLesson(lesson))}
          </div>
        ) : null}
        {course.modules.map((mod) => {
          const group = lessonsByModule.get(mod.id) ?? [];
          if (group.length === 0) return null;
          return (
            <div key={mod.id}>
              {mod.thumbnailUrl ? (
                <div className="mb-3 overflow-hidden rounded-2xl bg-charcoal">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={mod.thumbnailUrl}
                    alt=""
                    className="block h-auto max-h-48 w-full object-cover object-center"
                  />
                </div>
              ) : null}
              <h2 className="mb-1 font-display text-xl tracking-wide text-off-white/80">
                {mod.title}
              </h2>
              {mod.description ? (
                <p className="mb-2 font-body text-sm text-off-white/50">{mod.description}</p>
              ) : null}
              <div className="flex flex-col gap-2">{group.map((lesson) => renderLesson(lesson))}</div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
