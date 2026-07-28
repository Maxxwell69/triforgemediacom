import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import {
  getLessonUnlockAt,
  getOrCreateEnrollment,
  getOrderedLessonSequence,
  isLessonUnlocked,
} from "@/lib/learning";
import { canAccessCourse, getUserGroupIds } from "@/lib/groups";
import { isAdminRole } from "@/lib/rbac";

export const dynamic = "force-dynamic";

function formatUnlockLabel(unlockAt: Date, now: Date): string {
  const ms = unlockAt.getTime() - now.getTime();
  if (ms <= 0) return "Available now";
  const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
  if (days <= 1) {
    return `Unlocks on ${unlockAt.toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}`;
  }
  return `Unlocks in ${days} days · ${unlockAt.toLocaleDateString([], { dateStyle: "medium" })}`;
}

export default async function CourseDetailPage({
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
      badges: { select: { id: true, name: true, icon: true } },
      modules: {
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      },
      lessons: {
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        include: { quiz: { select: { id: true } }, assignment: { select: { id: true } } },
      },
    },
  });

  if (!course || !course.isPublished) notFound();
  if (!canAccessCourse(user.role, course, userGroupIds)) {
    redirect("/learn");
  }

  const published = course;
  const enrollment = await getOrCreateEnrollment(user.id, published.id);
  const bypassDrip = isAdminRole(user.role);
  const now = new Date();

  const lessonIds = published.lessons.map((l) => l.id);
  const completedProgress =
    lessonIds.length > 0
      ? await prisma.lessonProgress.findMany({
          where: { userId: user.id, lessonId: { in: lessonIds }, completedAt: { not: null } },
          select: { lessonId: true },
        })
      : [];
  const completedLessonIds = new Set(completedProgress.map((p) => p.lessonId));

  const totalLessons = published.lessons.length;
  const completedCount = completedLessonIds.size;
  const progressPct =
    totalLessons === 0 ? 0 : Math.round((completedCount / totalLessons) * 100);
  const isCourseComplete = !!enrollment.completedAt;

  const orderedSequence = getOrderedLessonSequence(published.modules, published.lessons);
  const nextUpLesson = orderedSequence.find((l) => {
    if (completedLessonIds.has(l.id)) return false;
    return bypassDrip || isLessonUnlocked(l, enrollment, now);
  });
  const ctaLesson = nextUpLesson ?? orderedSequence[0];
  const ctaLabel = isCourseComplete
    ? "Review course"
    : completedCount > 0
      ? "Continue"
      : "Start course";

  type LessonRow = (typeof published.lessons)[number];
  const unsortedLessons = published.lessons.filter((l) => !l.moduleId);
  const lessonsByModule = new Map<string, LessonRow[]>();
  for (const mod of published.modules) {
    lessonsByModule.set(
      mod.id,
      published.lessons.filter((l) => l.moduleId === mod.id)
    );
  }

  let lessonNumber = 0;

  function renderLesson(lesson: LessonRow) {
    lessonNumber += 1;
    const isDone = completedLessonIds.has(lesson.id);
    const unlocked = bypassDrip || isLessonUnlocked(lesson, enrollment, now);
    const unlockAt = getLessonUnlockAt(lesson, enrollment);

    if (!unlocked && unlockAt) {
      return (
        <div
          key={lesson.id}
          className="glass flex items-center justify-between gap-4 rounded-xl p-4 opacity-60"
        >
          <div className="flex min-w-0 items-center gap-3">
            {lesson.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={lesson.thumbnailUrl}
                alt=""
                className="h-12 w-20 shrink-0 rounded-lg object-cover opacity-70"
              />
            ) : (
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-off-white/20 font-body text-xs text-off-white/40">
                🔒
              </span>
            )}
            <div className="min-w-0">
              <p className="font-body text-sm font-medium text-off-white/70">{lesson.title}</p>
              <p className="mt-0.5 font-body text-xs text-orange/80">
                {formatUnlockLabel(unlockAt, now)}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <Link
        key={lesson.id}
        href={`/learn/${published.id}/lessons/${lesson.id}`}
        className="glass flex items-center justify-between gap-4 rounded-xl p-4 transition hover:border-cyan/40"
      >
        <div className="flex min-w-0 items-center gap-3">
          {lesson.thumbnailUrl ? (
            <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lesson.thumbnailUrl}
                alt=""
                className="h-full w-full object-cover"
              />
              {isDone && (
                <span className="absolute inset-0 flex items-center justify-center bg-charcoal/55 font-body text-sm text-cyan">
                  ✓
                </span>
              )}
            </div>
          ) : (
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border font-body text-xs ${
                isDone
                  ? "border-cyan bg-cyan/10 text-cyan"
                  : "border-off-white/20 text-off-white/50"
              }`}
            >
              {isDone ? "✓" : lessonNumber}
            </span>
          )}
          <div className="min-w-0">
            <p className="font-body text-sm font-medium text-off-white">{lesson.title}</p>
            {(lesson.quiz || lesson.assignment) && (
              <p className="mt-0.5 font-body text-xs text-off-white/40">
                {lesson.quiz ? "Includes quiz" : "Includes assignment"}
              </p>
            )}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/learn"
          className="font-body text-sm text-off-white/50 transition hover:text-off-white"
        >
          &larr; Learning Center
        </Link>

        <div className="relative mt-4 flex h-40 w-full items-center justify-center overflow-hidden rounded-2xl bg-off-white/5">
          {published.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={published.thumbnailUrl}
              alt={published.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-6xl">🎓</span>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/10 to-transparent" />
          {isCourseComplete && (
            <span className="absolute right-3 top-3 rounded-full border border-cyan/40 bg-charcoal/80 px-3 py-1 font-body text-xs font-semibold text-cyan">
              ✓ Completed
            </span>
          )}
        </div>

        <h1 className="mt-4 font-display text-5xl tracking-wide text-gradient">{published.title}</h1>
        {published.description && (
          <p className="mt-2 font-body text-off-white/60">{published.description}</p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {published.xpReward > 0 && (
            <span className="rounded-full border border-orange/40 bg-orange/10 px-3 py-1 font-body text-xs font-semibold text-orange">
              +{published.xpReward} XP on completion
            </span>
          )}
          {published.badges.map((badge) => (
            <span
              key={badge.id}
              className="rounded-full border border-cyan/40 bg-cyan/10 px-3 py-1 font-body text-xs font-semibold text-cyan"
            >
              {badge.icon || "🏅"} {badge.name}
            </span>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          {ctaLesson && (
            <Link
              href={`/learn/${published.id}/lessons/${ctaLesson.id}`}
              className="inline-flex rounded-lg bg-orange px-6 py-2.5 font-body font-semibold text-off-white shadow-glow transition hover:brightness-110"
            >
              {ctaLabel}
            </Link>
          )}
          {isCourseComplete && published.certificateEnabled && (
            <Link
              href={`/learn/${published.id}/certificate`}
              className="inline-flex rounded-lg border border-cyan/40 px-6 py-2.5 font-body font-semibold text-cyan transition hover:bg-cyan/10"
            >
              🎓 View certificate
            </Link>
          )}
        </div>

        <div className="mt-6">
          <div className="mb-1 flex items-center justify-between font-body text-xs text-off-white/50">
            <span>
              {completedCount} of {totalLessons} lessons
            </span>
            <span className="text-cyan">{progressPct}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-off-white/10">
            <div
              className="h-full rounded-full bg-cyan transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-6">
          {published.lessons.length === 0 && (
            <p className="glass rounded-2xl p-8 text-center font-body text-off-white/50">
              No lessons yet. Check back soon.
            </p>
          )}

          {unsortedLessons.length > 0 && (
            <div>
              {published.modules.length > 0 && (
                <h2 className="mb-2 font-body text-xs font-semibold uppercase tracking-wide text-off-white/40">
                  Other lessons
                </h2>
              )}
              <div className="flex flex-col gap-2">
                {unsortedLessons.map((lesson) => renderLesson(lesson))}
              </div>
            </div>
          )}

          {published.modules.map((mod) => {
            const group = lessonsByModule.get(mod.id) ?? [];
            if (group.length === 0) return null;
            return (
              <div key={mod.id}>
                <h2 className="mb-1 font-display text-xl tracking-wide text-off-white/80">
                  {mod.title}
                </h2>
                {mod.description && (
                  <p className="mb-2 font-body text-sm text-off-white/50">{mod.description}</p>
                )}
                <div className="flex flex-col gap-2">
                  {group.map((lesson) => renderLesson(lesson))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
