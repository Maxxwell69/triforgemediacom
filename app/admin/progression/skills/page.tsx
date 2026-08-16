import { prisma } from "@/lib/prisma";
import { requireProgressionModule } from "@/lib/progression/module";
import { createSkill, updateSkill } from "../actions";
import ProgressionAdminNav from "@/components/admin/ProgressionAdminNav";
import ProgressionRowTools from "@/components/admin/ProgressionRowTools";
import ImageUploadField from "@/components/ImageUploadField";

export const dynamic = "force-dynamic";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60";

export default async function AdminProgressionSkillsPage() {
  requireProgressionModule();
  const [skills, levels, categories, certs] = await Promise.all([
    prisma.progressionSkill.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.progressionLevel.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.progressionCategory.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.progressionCertification.findMany({ orderBy: { name: "asc" } }),
  ]);

  function attachFields(skill?: (typeof skills)[number]) {
    return (
      <>
        <select name="unlockKind" defaultValue={skill?.unlockKind ?? "MANUAL"} className={fieldClass}>
          <option value="MANUAL">Manual / admin grant</option>
          <option value="LEVEL">Reach a level</option>
          <option value="CATEGORY_XP">Category XP</option>
          <option value="CERTIFICATION">Hold a certification</option>
        </select>
        <select name="levelId" defaultValue={skill?.levelId ?? ""} className={fieldClass}>
          <option value="">Level (optional)</option>
          {levels.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
        <select name="categoryId" defaultValue={skill?.categoryId ?? ""} className={fieldClass}>
          <option value="">Category (optional)</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select name="certificationId" defaultValue={skill?.certificationId ?? ""} className={fieldClass}>
          <option value="">Certification (optional)</option>
          {certs.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <input name="xpRequired" type="number" min={0} defaultValue={skill?.xpRequired ?? ""} placeholder="XP required (optional)" className={fieldClass} />
      </>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-5xl tracking-wide">
        SPECIAL <span className="text-gradient">SKILLS</span>
      </h1>
      <ProgressionAdminNav />
      <form action={createSkill} className="glass mt-8 flex flex-col gap-3 rounded-2xl p-6">
        <input name="name" required placeholder="Skill name" className={fieldClass} />
        <textarea name="description" rows={2} className={fieldClass} />
        <ImageUploadField name="imageUrl" folder="progression-images" label="Image" />
        {attachFields()}
        <select name="status" defaultValue="DRAFT" className={fieldClass}>
          <option value="DRAFT">Draft</option>
          <option value="ACTIVE">Active</option>
        </select>
        <button type="submit" className="self-start rounded-lg bg-orange px-6 py-2 font-body font-semibold text-off-white">
          Add skill
        </button>
      </form>
      <div className="mt-6 flex flex-col gap-3">
        {skills.map((skill) => (
          <form key={skill.id} action={updateSkill} className="glass flex flex-col gap-3 rounded-2xl p-5">
            <input type="hidden" name="id" value={skill.id} />
            <input name="name" defaultValue={skill.name} required className={fieldClass} />
            <textarea name="description" defaultValue={skill.description ?? ""} rows={2} className={fieldClass} />
            <ImageUploadField name="imageUrl" folder="progression-images" defaultValue={skill.imageUrl} />
            {attachFields(skill)}
            <select name="status" defaultValue={skill.status} className={fieldClass}>
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
              <option value="ARCHIVED">Archived</option>
            </select>
            <div className="flex flex-wrap items-center gap-3">
              <button type="submit" className="rounded-lg border border-cyan/40 px-4 py-1.5 font-body text-sm text-cyan">
                Save
              </button>
              <ProgressionRowTools id={skill.id} kind="skill" />
            </div>
          </form>
        ))}
      </div>
    </main>
  );
}
