import { prisma } from "@/lib/prisma";
import { requireProgressionModule } from "@/lib/progression/module";
import { createMission, updateMission } from "../actions";
import ProgressionAdminNav from "@/components/admin/ProgressionAdminNav";
import ProgressionRowTools from "@/components/admin/ProgressionRowTools";
import ImageUploadField from "@/components/ImageUploadField";

export const dynamic = "force-dynamic";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60";

export default async function AdminProgressionMissionsPage() {
  requireProgressionModule();
  const [categories, missions] = await Promise.all([
    prisma.progressionCategory.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.progressionMission.findMany({
      include: { category: true },
      orderBy: [{ categoryId: "asc" }, { sortOrder: "asc" }],
    }),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-5xl tracking-wide">
        MIS<span className="text-gradient">SIONS</span>
      </h1>
      <ProgressionAdminNav />
      {categories.length === 0 ? (
        <p className="mt-8 font-body text-off-white/50">Create a category first.</p>
      ) : (
        <form action={createMission} className="glass mt-8 flex flex-col gap-3 rounded-2xl p-6">
          <h2 className="font-display text-xl tracking-wide text-off-white/80">New mission</h2>
          <select name="categoryId" required className={fieldClass}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <input name="name" required placeholder="Mission name" className={fieldClass} />
          <textarea name="description" rows={2} className={fieldClass} />
          <ImageUploadField name="imageUrl" folder="progression-images" label="Image" />
          <input name="xpValue" type="number" min={0} defaultValue={10} className={fieldClass} />
          <select name="tier" defaultValue="STANDARD" className={fieldClass}>
            <option value="MICRO">Micro (daily cap 50/category)</option>
            <option value="STANDARD">Standard (daily cap 100/category)</option>
            <option value="MILESTONE">Milestone (uncapped)</option>
            <option value="MAJOR">Major milestone (uncapped)</option>
          </select>
          <select name="recurrence" defaultValue="ONE_TIME" className={fieldClass}>
            <option value="ONE_TIME">One-time</option>
            <option value="REPEATABLE">Repeatable</option>
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
          </select>
          <select name="status" defaultValue="DRAFT" className={fieldClass}>
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
          </select>
          <button type="submit" className="self-start rounded-lg bg-orange px-6 py-2 font-body font-semibold text-off-white">
            Add mission
          </button>
        </form>
      )}
      <div className="mt-6 flex flex-col gap-3">
        {missions.map((mission) => (
          <form key={mission.id} action={updateMission} className="glass flex flex-col gap-3 rounded-2xl p-5">
            <input type="hidden" name="id" value={mission.id} />
            <select name="categoryId" defaultValue={mission.categoryId} className={fieldClass}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <input name="name" defaultValue={mission.name} required className={fieldClass} />
            <textarea name="description" defaultValue={mission.description ?? ""} rows={2} className={fieldClass} />
            <ImageUploadField name="imageUrl" folder="progression-images" defaultValue={mission.imageUrl} />
            <input name="xpValue" type="number" min={0} defaultValue={mission.xpValue} className={fieldClass} />
            <select name="tier" defaultValue={mission.tier} className={fieldClass}>
              <option value="MICRO">Micro (daily cap 50/category)</option>
              <option value="STANDARD">Standard (daily cap 100/category)</option>
              <option value="MILESTONE">Milestone (uncapped)</option>
              <option value="MAJOR">Major milestone (uncapped)</option>
            </select>
            <select name="recurrence" defaultValue={mission.recurrence} className={fieldClass}>
              <option value="ONE_TIME">One-time</option>
              <option value="REPEATABLE">Repeatable</option>
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
            </select>
            <select name="status" defaultValue={mission.status} className={fieldClass}>
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
              <option value="ARCHIVED">Archived</option>
            </select>
            <div className="flex flex-wrap items-center gap-3">
              <button type="submit" className="rounded-lg border border-cyan/40 px-4 py-1.5 font-body text-sm text-cyan">
                Save
              </button>
              <ProgressionRowTools id={mission.id} kind="mission" />
            </div>
          </form>
        ))}
      </div>
    </main>
  );
}
