import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireProgressionModule } from "@/lib/progression/module";
import ProgressionAdminNav from "@/components/admin/ProgressionAdminNav";

export const dynamic = "force-dynamic";

export default async function AdminProgressionLearnPage() {
  requireProgressionModule();
  const attachedCourses = (
    await prisma.course.findMany({
      where: { progressionEnabled: true },
      orderBy: { order: "asc" },
      include: {
        progressionCategory: { select: { name: true } },
        progressionLevel: { select: { name: true, sortOrder: true } },
      },
    })
  ).sort((a, b) => (a.progressionLevel?.sortOrder ?? 999) - (b.progressionLevel?.sortOrder ?? 999));

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-5xl tracking-wide">
        LEARNING <span className="text-gradient">CENTER</span>
      </h1>
      <p className="mt-2 font-body text-sm text-off-white/55">
        Progression uses Learning Center courses only. Attach a course to a level from Admin → Courses →
        edit the course → Use in Creator Progression.
      </p>
      <ProgressionAdminNav />
      <div className="mt-8 flex flex-col gap-2">
        {attachedCourses.length === 0 ? (
          <p className="font-body text-sm text-off-white/40">
            No courses attached yet.{" "}
            <Link href="/admin/courses" className="text-cyan hover:underline">
              Open Courses
            </Link>{" "}
            and turn on “Use in Creator Progression”, then pick the level.
          </p>
        ) : (
          attachedCourses.map((course) => (
            <Link
              key={course.id}
              href={`/admin/courses/${course.id}`}
              className="glass flex items-center justify-between rounded-xl p-4 hover:border-cyan/40"
            >
              <div>
                <p className="font-body text-sm text-off-white">{course.title}</p>
                <p className="font-body text-xs text-off-white/40">
                  {course.progressionLevel?.name || "No level"}
                  {course.progressionCategory ? ` · ${course.progressionCategory.name}` : ""}
                  {course.isPublished ? "" : " · draft"}
                </p>
              </div>
              <span className="font-body text-xs text-cyan">Edit course</span>
            </Link>
          ))
        )}
      </div>
    </main>
  );
}
