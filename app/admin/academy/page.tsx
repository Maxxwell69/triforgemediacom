import Link from "next/link";
import { academyDb, canAuthorAcademy, requireAcademyLearner } from "@/lib/academy";
import { createAcademyCourse } from "./actions";
import CourseRow from "@/components/admin/CourseRow";
import ImageUploadField from "@/components/ImageUploadField";

export const dynamic = "force-dynamic";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60";

export default async function AdminAcademyPage() {
  const user = await requireAcademyLearner();
  const author = await canAuthorAcademy();
  const db = academyDb();

  const courses = await db.course.findMany({
    where: { hubOwnerOnly: true, ...(author ? {} : { isPublished: true }) },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: {
      _count: { select: { lessons: true, enrollments: true } },
      lessons: { select: { id: true } },
    },
  });

  const lessonIds = courses.flatMap((course) => course.lessons.map((lesson) => lesson.id));
  const [enrollments, completed] = await Promise.all([
    db.enrollment.findMany({
      where: { userId: user.id, courseId: { in: courses.map((course) => course.id) } },
    }),
    lessonIds.length > 0
      ? db.lessonProgress.findMany({
          where: { userId: user.id, lessonId: { in: lessonIds }, completedAt: { not: null } },
          select: { lessonId: true },
        })
      : Promise.resolve([]),
  ]);
  const enrollmentByCourse = new Map(enrollments.map((row) => [row.courseId, row]));
  const doneLessons = new Set(completed.map((row) => row.lessonId));

  const published = courses.filter((course) => course.isPublished);
  const drafts = author ? courses.filter((course) => !course.isPublished) : [];

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-5xl tracking-wide">
        HUB ZERO <span className="text-gradient">ACADEMY</span>
      </h1>
      <p className="mt-2 font-body text-sm text-off-white/50">
        Training for people who run a hub. Courses live only on Hub 0 — every hub admin gets
        access here. Nothing is copied into client hubs.
      </p>

      {author ? (
        <form action={createAcademyCourse} className="glass mt-8 flex flex-col gap-3 rounded-2xl p-6">
          <h2 className="font-display text-xl tracking-wide text-off-white/80">New academy course</h2>
          <p className="font-body text-xs text-off-white/45">
            After you add it, manage lessons and publish from the course editor. Hub owners see it
            once it is published.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input name="title" required placeholder="e.g. How to launch your hub" className={fieldClass} />
            <input name="category" placeholder="Category (optional)" className={fieldClass} />
          </div>
          <textarea
            name="description"
            rows={2}
            placeholder="What hub owners will learn"
            className={fieldClass}
          />
          <ImageUploadField name="thumbnailUrl" folder="course-thumbnails" label="Thumbnail" />
          <button
            type="submit"
            className="self-start rounded-lg bg-orange px-6 py-2 font-body font-semibold text-off-white shadow-glow transition hover:brightness-110"
          >
            Add course
          </button>
        </form>
      ) : null}

      {author && (drafts.length > 0 || published.length > 0) ? (
        <section className="mt-10">
          <h2 className="font-display text-xl tracking-wide text-off-white/80">Manage on Hub 0</h2>
          <div className="mt-4 flex flex-col gap-2">
            {courses.map((course, index) => (
              <CourseRow
                key={course.id}
                course={{
                  id: course.id,
                  title: course.title,
                  description: course.description,
                  thumbnailUrl: course.thumbnailUrl,
                  category: course.category,
                  isPublished: course.isPublished,
                  xpReward: 0,
                  lessonCount: course._count.lessons,
                  enrollmentCount: course._count.enrollments,
                }}
                isFirst={index === 0}
                isLast={index === courses.length - 1}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-10">
        <h2 className="font-display text-xl tracking-wide text-off-white/80">Your courses</h2>
        <div className="mt-4 flex flex-col gap-3">
          {published.length === 0 ? (
            <p className="glass rounded-2xl p-8 text-center font-body text-sm text-off-white/50">
              {author
                ? "Publish a course above to share it with every hub owner."
                : "No academy courses yet. Hub 0 will add them here."}
            </p>
          ) : (
            published.map((course) => {
              const total = course.lessons.length;
              const done = course.lessons.filter((lesson) => doneLessons.has(lesson.id)).length;
              const enrollment = enrollmentByCourse.get(course.id);
              const pct = total === 0 ? 0 : Math.round((done / total) * 100);
              return (
                <Link
                  key={course.id}
                  href={`/admin/academy/${course.id}`}
                  className="glass flex flex-col gap-3 rounded-2xl p-5 transition hover:border-cyan/40 sm:flex-row sm:items-center"
                >
                  <div className="relative h-24 w-full shrink-0 overflow-hidden rounded-xl bg-off-white/5 sm:w-40">
                    {course.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={course.thumbnailUrl}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full items-center justify-center text-3xl">🎓</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-body font-semibold text-off-white">{course.title}</p>
                    <p className="mt-1 line-clamp-2 font-body text-sm text-off-white/50">
                      {course.description || "Hub owner training"}
                    </p>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-off-white/10">
                      <div className="h-full rounded-full bg-cyan" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="mt-1 font-body text-xs text-off-white/45">
                      {enrollment?.completedAt
                        ? "Completed"
                        : done > 0
                          ? `${done} of ${total} lessons · ${pct}%`
                          : `${total} lesson${total === 1 ? "" : "s"}`}
                    </p>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </section>
    </main>
  );
}
