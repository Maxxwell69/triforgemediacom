import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireProgressionModule } from "@/lib/progression/module";
import { createLearningModule } from "../actions";
import ProgressionAdminNav from "@/components/admin/ProgressionAdminNav";
import ProgressionRowTools from "@/components/admin/ProgressionRowTools";
import ImageUploadField from "@/components/ImageUploadField";

export const dynamic = "force-dynamic";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60";

export default async function AdminProgressionLearnPage() {
  requireProgressionModule();
  const [categories, modules, attachedCourses] = await Promise.all([
    prisma.progressionCategory.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.progressionLearningModule.findMany({
      include: { category: true, quiz: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.course.findMany({
      where: { progressionEnabled: true },
      orderBy: { order: "asc" },
      include: {
        progressionCategory: { select: { name: true } },
        progressionLevel: { select: { name: true } },
      },
    }),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-5xl tracking-wide">
        LEARNING <span className="text-gradient">MODULES</span>
      </h1>
      <p className="mt-2 font-body text-sm text-off-white/55">
        Prefer attaching a Learning Center course (toggle on the course edit page). Legacy shells below are optional.
      </p>
      <ProgressionAdminNav />
      <div className="mt-8 flex flex-col gap-2">
        <h2 className="font-display text-xl text-off-white/80">Attached courses</h2>
        {attachedCourses.length === 0 ? (
          <p className="font-body text-sm text-off-white/40">
            No courses attached yet. Open Admin → Courses, edit a course, and turn on “Use in Creator Progression”.
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
                  {course.progressionCategory?.name || "No track"}
                  {course.progressionLevel ? ` · from ${course.progressionLevel.name}` : ""}
                  {course.isPublished ? "" : " · draft"}
                </p>
              </div>
              <span className="font-body text-xs text-cyan">Edit course</span>
            </Link>
          ))
        )}
      </div>
      {categories.length === 0 ? (
        <p className="mt-8 font-body text-off-white/50">Create a category first.</p>
      ) : (
        <form action={createLearningModule} className="glass mt-8 flex flex-col gap-3 rounded-2xl p-6">
          <select name="categoryId" required className={fieldClass}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <input name="title" required placeholder="Module title" className={fieldClass} />
          <textarea name="description" rows={2} className={fieldClass} />
          <textarea name="content" rows={4} placeholder="Text / notes" className={fieldClass} />
          <input name="videoUrl" placeholder="Video URL" className={fieldClass} />
          <input name="linkUrl" placeholder="External link" className={fieldClass} />
          <ImageUploadField name="imageUrl" folder="progression-images" label="Image" />
          <select name="status" defaultValue="DRAFT" className={fieldClass}>
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
          </select>
          <button type="submit" className="self-start rounded-lg bg-orange px-6 py-2 font-body font-semibold text-off-white">
            Add module
          </button>
        </form>
      )}
      <div className="mt-6 flex flex-col gap-2">
        {modules.map((learnModule) => (
          <div key={learnModule.id} className="glass flex items-center justify-between gap-3 rounded-xl p-4">
            <Link href={`/admin/progression/learn/${learnModule.id}`} className="min-w-0 flex-1">
              <p className="font-body text-sm text-off-white">{learnModule.title}</p>
              <p className="font-body text-xs text-off-white/40">
                {learnModule.category.name} · {learnModule.status}
                {learnModule.quiz ? " · quiz" : ""}
              </p>
            </Link>
            <ProgressionRowTools id={learnModule.id} kind="module" />
          </div>
        ))}
      </div>
    </main>
  );
}
