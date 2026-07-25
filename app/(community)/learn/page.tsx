import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { canAccessCourse, getUserGroupIds } from "@/lib/groups";

export const dynamic = "force-dynamic";

type CourseCardData = {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  category: string | null;
  xpReward: number;
  totalLessons: number;
  completedCount: number;
  isComplete: boolean;
};

function CourseCard({ course, compact = false }: { course: CourseCardData; compact?: boolean }) {
  const progressPct =
    course.totalLessons === 0
      ? 0
      : Math.round((course.completedCount / course.totalLessons) * 100);
  const statusLabel = course.isComplete
    ? "Completed"
    : course.completedCount > 0
      ? `${course.completedCount} of ${course.totalLessons} lessons`
      : "Not started";

  return (
    <Link
      href={`/learn/${course.id}`}
      className="glass flex flex-col gap-3 rounded-2xl p-5 transition hover:border-cyan/40"
    >
      <div className={`relative flex w-full items-center justify-center overflow-hidden rounded-xl bg-off-white/5 ${compact ? "h-24" : "h-32"}`}>
        {course.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-4xl">🎓</span>
        )}
        {course.isComplete && (
          <span className="absolute right-2 top-2 rounded-full border border-cyan/40 bg-charcoal/80 px-2 py-0.5 font-body text-[10px] font-semibold text-cyan">
            ✓ Done
          </span>
        )}
      </div>
      <div>
        <p className="font-body font-semibold text-off-white">{course.title}</p>
        {course.category && (
          <p className="mt-0.5 font-body text-xs uppercase tracking-wide text-cyan/70">
            {course.category}
          </p>
        )}
        {!compact && course.description && (
          <p className="mt-1 truncate font-body text-sm text-off-white/50">
            {course.description}
          </p>
        )}
      </div>
      <div className="mt-auto">
        <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-off-white/10">
          <div
            className="h-full rounded-full bg-cyan transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <span
            className={`font-body text-xs font-semibold uppercase tracking-wide ${
              course.isComplete ? "text-cyan" : "text-off-white/50"
            }`}
          >
            {statusLabel} · {progressPct}%
          </span>
          {course.xpReward > 0 && (
            <span className="font-body text-xs text-orange">+{course.xpReward} XP</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default async function LearnPage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const { user } = await requireProfile();
  const userGroupIds = await getUserGroupIds(user.id);

  const courses = await prisma.course.findMany({
    where: { isPublished: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: {
      lessons: { select: { id: true } },
      groups: { select: { id: true } },
    },
  });

  const visibleCourses = courses.filter((c) =>
    canAccessCourse(user.role, c, userGroupIds)
  );

  const courseIds = visibleCourses.map((c) => c.id);
  const allLessonIds = visibleCourses.flatMap((c) => c.lessons.map((l) => l.id));

  const [enrollments, completedProgress] = await Promise.all([
    prisma.enrollment.findMany({ where: { userId: user.id, courseId: { in: courseIds } } }),
    allLessonIds.length > 0
      ? prisma.lessonProgress.findMany({
          where: { userId: user.id, lessonId: { in: allLessonIds }, completedAt: { not: null } },
          select: { lessonId: true },
        })
      : Promise.resolve([]),
  ]);

  const enrollmentMap = new Map(enrollments.map((e) => [e.courseId, e]));
  const completedLessonIds = new Set(completedProgress.map((p) => p.lessonId));

  const cards: CourseCardData[] = visibleCourses.map((course) => {
    const totalLessons = course.lessons.length;
    const completedCount = course.lessons.filter((l) => completedLessonIds.has(l.id)).length;
    const enrollment = enrollmentMap.get(course.id);
    return {
      id: course.id,
      title: course.title,
      description: course.description,
      thumbnailUrl: course.thumbnailUrl,
      category: course.category,
      xpReward: course.xpReward,
      totalLessons,
      completedCount,
      isComplete: !!enrollment?.completedAt,
    };
  });

  const continueCards = cards.filter((c) => !c.isComplete && c.completedCount > 0);

  const categories = Array.from(
    new Set(visibleCourses.map((c) => c.category).filter((c): c is string => !!c))
  ).sort();
  const activeCategory = searchParams.category;
  const filteredCards = activeCategory
    ? cards.filter((c) => c.category === activeCategory)
    : cards;

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="font-display text-5xl tracking-wide">
          LEARNING <span className="text-gradient">CENTER</span>
        </h1>
        <p className="mt-2 font-body text-off-white/60">
          Courses to help you grow as a creator. Complete lessons and quizzes to earn XP and
          badges.
        </p>

        {continueCards.length > 0 && (
          <div className="mt-8">
            <h2 className="font-display text-xl tracking-wide text-off-white/80">
              Continue learning
            </h2>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {continueCards.slice(0, 3).map((course) => (
                <CourseCard key={course.id} course={course} compact />
              ))}
            </div>
          </div>
        )}

        <div className="mt-10 flex items-center justify-between gap-4">
          <h2 className="font-display text-xl tracking-wide text-off-white/80">All courses</h2>
          {categories.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/learn"
                className={`rounded-full border px-3 py-1 font-body text-xs font-semibold transition ${
                  !activeCategory
                    ? "border-cyan/50 bg-cyan/10 text-cyan"
                    : "border-off-white/15 text-off-white/50 hover:border-off-white/30"
                }`}
              >
                All
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat}
                  href={`/learn?category=${encodeURIComponent(cat)}`}
                  className={`rounded-full border px-3 py-1 font-body text-xs font-semibold transition ${
                    activeCategory === cat
                      ? "border-cyan/50 bg-cyan/10 text-cyan"
                      : "border-off-white/15 text-off-white/50 hover:border-off-white/30"
                  }`}
                >
                  {cat}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCards.length === 0 && (
            <p className="glass col-span-full rounded-2xl p-8 text-center font-body text-off-white/50">
              No courses available yet. Check back soon.
            </p>
          )}
          {filteredCards.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </div>
    </main>
  );
}
