import { prisma } from "@/lib/prisma";
import { createCourse } from "./actions";
import CourseRow from "@/components/admin/CourseRow";
import ImageUploadField from "@/components/ImageUploadField";
import CourseGroupAccessFields from "@/components/admin/CourseGroupAccessFields";

export const dynamic = "force-dynamic";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60";

export default async function AdminCoursesPage() {
  const [courses, groups] = await Promise.all([
    prisma.course.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      include: {
        _count: { select: { lessons: true, enrollments: true } },
        groups: { select: { id: true, name: true, color: true }, orderBy: { name: "asc" } },
      },
    }),
    prisma.group.findMany({
      orderBy: [{ isHome: "desc" }, { name: "asc" }],
      select: { id: true, name: true, color: true, isHome: true },
    }),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-5xl tracking-wide">
        LEARNING <span className="text-gradient">CENTER</span>
      </h1>
      <p className="mt-2 font-body text-off-white/60">
        Build courses out of ordered lessons, quizzes, and badges. Restrict training to specific
        groups when needed (e.g. Gaming only — not Shop Owners).
      </p>

      <form
        key={courses.length}
        action={createCourse}
        className="glass mt-8 flex flex-col gap-3 rounded-2xl p-6"
      >
        <h2 className="font-display text-xl tracking-wide text-off-white/80">New course</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input name="title" required placeholder="e.g. TikTok Growth 101" className={fieldClass} />
          <input name="category" placeholder="Category (optional)" className={fieldClass} />
        </div>
        <textarea
          name="description"
          rows={2}
          placeholder="Optional description"
          className={fieldClass}
        />
        <ImageUploadField name="thumbnailUrl" folder="course-thumbnails" label="Thumbnail" />
        <CourseGroupAccessFields groups={groups} />
        <div className="flex items-center gap-3">
          <input
            type="number"
            name="xpReward"
            defaultValue={0}
            min={0}
            max={100000}
            className={`${fieldClass} w-32`}
          />
          <button
            type="submit"
            className="rounded-lg bg-orange px-6 py-2 font-body font-semibold text-off-white shadow-glow transition hover:brightness-110"
          >
            Add course
          </button>
        </div>
      </form>

      <div className="mt-8 flex flex-col gap-2">
        {courses.length === 0 && (
          <p className="glass rounded-2xl p-8 text-center font-body text-off-white/50">
            No courses yet.
          </p>
        )}
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
              xpReward: course.xpReward,
              lessonCount: course._count.lessons,
              enrollmentCount: course._count.enrollments,
              accessGroups: course.groups,
            }}
            isFirst={index === 0}
            isLast={index === courses.length - 1}
          />
        ))}
      </div>
    </main>
  );
}
