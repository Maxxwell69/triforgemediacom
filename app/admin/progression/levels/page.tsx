import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireProgressionModule } from "@/lib/progression/module";
import { createLevel } from "../actions";
import ProgressionAdminNav from "@/components/admin/ProgressionAdminNav";
import ProgressionRowTools from "@/components/admin/ProgressionRowTools";
import ImageUploadField from "@/components/ImageUploadField";

export const dynamic = "force-dynamic";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60";

export default async function AdminProgressionLevelsPage() {
  requireProgressionModule();
  const levels = await prisma.progressionLevel.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-5xl tracking-wide">
        LEVEL <span className="text-gradient">LADDER</span>
      </h1>
      <ProgressionAdminNav />
      <form action={createLevel} className="glass mt-8 flex flex-col gap-3 rounded-2xl p-6">
        <h2 className="font-display text-xl tracking-wide text-off-white/80">New level</h2>
        <input name="name" required placeholder="Level name" className={fieldClass} />
        <textarea name="description" rows={2} className={fieldClass} />
        <ImageUploadField name="imageUrl" folder="progression-images" label="Image" />
        <input name="xpRequired" type="number" min={0} defaultValue={0} placeholder="XP required" className={fieldClass} />
        <select name="status" defaultValue="DRAFT" className={fieldClass}>
          <option value="DRAFT">Draft</option>
          <option value="ACTIVE">Active</option>
        </select>
        <button type="submit" className="self-start rounded-lg bg-orange px-6 py-2 font-body font-semibold text-off-white">
          Add level
        </button>
      </form>
      <div className="mt-6 flex flex-col gap-2">
        {levels.map((level) => (
          <div key={level.id} className="glass flex items-center justify-between gap-3 rounded-xl p-4">
            <Link href={`/admin/progression/levels/${level.id}`} className="min-w-0 flex-1">
              <p className="font-body text-sm text-off-white">{level.name}</p>
              <p className="font-body text-xs text-off-white/40">
                {level.xpRequired} XP · {level.status}
              </p>
            </Link>
            <ProgressionRowTools id={level.id} kind="level" />
          </div>
        ))}
      </div>
    </main>
  );
}
