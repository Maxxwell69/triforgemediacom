import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireProgressionModule } from "@/lib/progression/module";
import { SPECIALTY_TRACKS } from "@/lib/progression/tracks";
import ProgressionAdminNav from "@/components/admin/ProgressionAdminNav";
import ProgressionCourseAttachPanel from "@/components/admin/ProgressionCourseAttachPanel";

export const dynamic = "force-dynamic";

export default async function AdminProgressionLearnPage() {
  requireProgressionModule();
  const [levels, allCourses] = await Promise.all([
    prisma.progressionLevel.findMany({
      where: { status: "ACTIVE" },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, sortOrder: true },
    }),
    prisma.course.findMany({
      orderBy: { title: "asc" },
      select: {
        id: true,
        title: true,
        isPublished: true,
        progressionEnabled: true,
        progressionSpecialty: true,
        progressionLevelId: true,
        progressionCategory: { select: { name: true } },
        progressionLevel: { select: { id: true, name: true, sortOrder: true } },
      },
    }),
  ]);

  const attachedCourses = allCourses.filter((course) => course.progressionEnabled);
  const unleveled = attachedCourses.filter(
    (course) => !course.progressionLevelId && !course.progressionSpecialty
  );
  const available = allCourses.map((course) => ({ id: course.id, title: course.title }));

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-5xl tracking-wide">
        LEARN <span className="text-gradient">ATTACHMENTS</span>
      </h1>
      <p className="mt-2 font-body text-sm text-off-white/55">
        Learning Center courses attached to a progression rank, a specialization, or both. You can also
        attach from a{" "}
        <Link href="/admin/progression/levels" className="text-cyan hover:underline">
          level
        </Link>{" "}
        page or{" "}
        <Link href="/admin/courses" className="text-cyan hover:underline">
          Admin → Courses
        </Link>
        .
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
              <ProgressionCourseAttachPanel
                target={{ kind: "level", levelId: level.id }}
                attached={courses}
                available={allCourses.filter((course) => course.progressionLevelId !== level.id)}
              />
            </section>
          );
        })}

        <h2 className="mt-4 font-display text-2xl tracking-wide text-off-white/80">Specializations</h2>
        <p className="font-body text-sm text-off-white/50">
          Courses here unlock after a creator picks that specialty at Rising Star. You can also pin a
          course to a level so it stays locked until that rank.
        </p>
        {SPECIALTY_TRACKS.map((track) => {
          const courses = attachedCourses.filter((course) => course.progressionSpecialty === track.name);
          return (
            <section key={track.name} className="glass rounded-2xl p-5">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-display text-xl text-off-white/80">{track.name}</h2>
                <p className="font-body text-xs text-off-white/40">
                  {courses.length === 0 ? "No courses" : `${courses.length} course${courses.length === 1 ? "" : "s"}`}
                </p>
              </div>
              <p className="mt-1 font-body text-xs text-off-white/45">{track.description}</p>
              <ProgressionCourseAttachPanel
                target={{ kind: "specialty", specialty: track.name }}
                attached={courses}
                available={available.filter(
                  (course) =>
                    !courses.some((attached) => attached.id === course.id)
                )}
                levels={levels}
              />
            </section>
          );
        })}

        {unleveled.length > 0 ? (
          <section className="glass rounded-2xl p-5">
            <h2 className="font-display text-xl text-off-white/80">Attached, no level or specialty</h2>
            <p className="mt-1 font-body text-xs text-off-white/45">
              These count toward a track but are not assigned to a rank or specialization yet.
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
