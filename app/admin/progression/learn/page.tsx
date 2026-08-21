import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireProgressionModule } from "@/lib/progression/module";
import ProgressionAdminNav from "@/components/admin/ProgressionAdminNav";

export const dynamic = "force-dynamic";

export default async function AdminProgressionLearnPage() {
  requireProgressionModule();
  const [levels, attachedCourses] = await Promise.all([
    prisma.progressionLevel.findMany({
      where: { status: "ACTIVE" },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, sortOrder: true },
    }),
    prisma.course.findMany({
      where: { progressionEnabled: true },
      orderBy: { title: "asc" },
      include: {
        progressionCategory: { select: { name: true } },
        progressionLevel: { select: { id: true, name: true, sortOrder: true } },
      },
    }),
  ]);

  const unleveled = attachedCourses.filter((course) => !course.progressionLevelId);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-5xl tracking-wide">
        LEARN <span className="text-gradient">BY LEVEL</span>
      </h1>
      <p className="mt-2 font-body text-sm text-off-white/55">
        Learning Center courses attached to each progression rank. Attach or move a course from{" "}
        <Link href="/admin/courses" className="text-cyan hover:underline">
          Admin → Courses
        </Link>{" "}
        → Use in Creator Progression → Attach to level.
      </p>
      <ProgressionAdminNav />
      <div className="mt-8 flex flex-col gap-4">
        {levels.map((level) => {
          const courses = attachedCourses.filter((course) => course.progressionLevelId === level.id);
          return (
            <section key={level.id} className="glass rounded-2xl p-5">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-display text-xl text-off-white/80">{level.name}</h2>
                <p className="font-body text-xs text-off-white/40">
                  {courses.length === 0 ? "No courses" : `${courses.length} course${courses.length === 1 ? "" : "s"}`}
                </p>
              </div>
              {courses.length === 0 ? (
                <p className="mt-3 font-body text-sm text-off-white/40">Nothing attached to this level yet.</p>
              ) : (
                <ul className="mt-3 flex flex-col gap-2">
                  {courses.map((course) => (
                    <li key={course.id}>
                      <Link
                        href={`/admin/courses/${course.id}`}
                        className="flex items-center justify-between rounded-xl border border-off-white/10 px-3 py-2 hover:border-cyan/40"
                      >
                        <span>
                          <span className="block font-body text-sm text-off-white">{course.title}</span>
                          <span className="block font-body text-xs text-off-white/40">
                            {course.progressionCategory?.name || "No track"}
                            {course.isPublished ? "" : " · draft"}
                          </span>
                        </span>
                        <span className="font-body text-xs text-cyan">Edit</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
        {unleveled.length > 0 ? (
          <section className="glass rounded-2xl p-5">
            <h2 className="font-display text-xl text-off-white/80">Attached, no level</h2>
            <p className="mt-1 font-body text-xs text-off-white/45">
              These count toward a track but are not assigned to a rank yet.
            </p>
            <ul className="mt-3 flex flex-col gap-2">
              {unleveled.map((course) => (
                <li key={course.id}>
                  <Link
                    href={`/admin/courses/${course.id}`}
                    className="flex items-center justify-between rounded-xl border border-off-white/10 px-3 py-2 hover:border-cyan/40"
                  >
                    <span>
                      <span className="block font-body text-sm text-off-white">{course.title}</span>
                      <span className="block font-body text-xs text-off-white/40">
                        {course.progressionCategory?.name || "No track"}
                        {course.isPublished ? "" : " · draft"}
                      </span>
                    </span>
                    <span className="font-body text-xs text-cyan">Edit</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </main>
  );
}
