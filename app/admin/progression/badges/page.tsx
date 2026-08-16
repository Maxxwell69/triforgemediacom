import { prisma } from "@/lib/prisma";
import { requireProgressionModule } from "@/lib/progression/module";
import { createProgressionBadge, updateProgressionBadge } from "../actions";
import ProgressionAdminNav from "@/components/admin/ProgressionAdminNav";
import ProgressionRowTools from "@/components/admin/ProgressionRowTools";
import ImageUploadField from "@/components/ImageUploadField";

export const dynamic = "force-dynamic";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60";

export default async function AdminProgressionBadgesPage() {
  requireProgressionModule();
  const [badges, levels, missions, certs, skills] = await Promise.all([
    prisma.progressionBadge.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.progressionLevel.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.progressionMission.findMany({ orderBy: { name: "asc" } }),
    prisma.progressionCertification.findMany({ orderBy: { name: "asc" } }),
    prisma.progressionSkill.findMany({ orderBy: { name: "asc" } }),
  ]);

  function triggerSelect(defaultTrigger: string, defaultId: string) {
    return (
      <>
        <select name="trigger" defaultValue={defaultTrigger} className={fieldClass}>
          <option value="STANDALONE">Standalone</option>
          <option value="LEVEL">Level reached</option>
          <option value="MISSION">Mission completed</option>
          <option value="CERTIFICATION">Certification earned</option>
          <option value="SKILL">Skill unlocked</option>
        </select>
        <select name="triggerId" defaultValue={defaultId} className={fieldClass}>
          <option value="">No trigger id (standalone)</option>
          {levels.map((item) => (
            <option key={item.id} value={item.id}>
              Level: {item.name}
            </option>
          ))}
          {missions.map((item) => (
            <option key={item.id} value={item.id}>
              Mission: {item.name}
            </option>
          ))}
          {certs.map((item) => (
            <option key={item.id} value={item.id}>
              Cert: {item.name}
            </option>
          ))}
          {skills.map((item) => (
            <option key={item.id} value={item.id}>
              Skill: {item.name}
            </option>
          ))}
        </select>
      </>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-5xl tracking-wide">
        PROGRESSION <span className="text-gradient">BADGES</span>
      </h1>
      <p className="mt-2 font-body text-xs text-off-white/40">
        Trigger ID is the level / mission / cert / skill id. Standalone badges are granted by admin.
      </p>
      <ProgressionAdminNav />
      <form action={createProgressionBadge} className="glass mt-8 flex flex-col gap-3 rounded-2xl p-6">
        <input name="name" required placeholder="Badge name" className={fieldClass} />
        <textarea name="description" rows={2} className={fieldClass} />
        <ImageUploadField name="imageUrl" folder="progression-images" label="Image" />
        {triggerSelect("STANDALONE", "")}
        <select name="status" defaultValue="DRAFT" className={fieldClass}>
          <option value="DRAFT">Draft</option>
          <option value="ACTIVE">Active</option>
        </select>
        <button type="submit" className="self-start rounded-lg bg-orange px-6 py-2 font-body font-semibold text-off-white">
          Add badge
        </button>
      </form>
      <div className="mt-6 flex flex-col gap-3">
        {badges.map((badge) => (
          <form key={badge.id} action={updateProgressionBadge} className="glass flex flex-col gap-3 rounded-2xl p-5">
            <input type="hidden" name="id" value={badge.id} />
            <input name="name" defaultValue={badge.name} required className={fieldClass} />
            <textarea name="description" defaultValue={badge.description ?? ""} rows={2} className={fieldClass} />
            <ImageUploadField name="imageUrl" folder="progression-images" defaultValue={badge.imageUrl} />
            {triggerSelect(badge.trigger, badge.triggerId ?? "")}
            <select name="status" defaultValue={badge.status} className={fieldClass}>
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
              <option value="ARCHIVED">Archived</option>
            </select>
            <div className="flex flex-wrap items-center gap-3">
              <button type="submit" className="rounded-lg border border-cyan/40 px-4 py-1.5 font-body text-sm text-cyan">
                Save
              </button>
              <ProgressionRowTools id={badge.id} kind="badge" canReorder={false} />
            </div>
          </form>
        ))}
      </div>
    </main>
  );
}
