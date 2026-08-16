import { prisma } from "@/lib/prisma";
import { requireProgressionModule } from "@/lib/progression/module";
import { createCategory, updateCategory } from "../actions";
import ProgressionAdminNav from "@/components/admin/ProgressionAdminNav";
import ProgressionRowTools from "@/components/admin/ProgressionRowTools";
import ImageUploadField from "@/components/ImageUploadField";

export const dynamic = "force-dynamic";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60";

export default async function AdminProgressionCategoriesPage() {
  requireProgressionModule();
  const categories = await prisma.progressionCategory.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-5xl tracking-wide">
        MISSION <span className="text-gradient">CATEGORIES</span>
      </h1>
      <ProgressionAdminNav />
      <form action={createCategory} className="glass mt-8 flex flex-col gap-3 rounded-2xl p-6">
        <h2 className="font-display text-xl tracking-wide text-off-white/80">New category</h2>
        <input name="name" required placeholder="e.g. Live Hosting" className={fieldClass} />
        <textarea name="description" rows={2} className={fieldClass} />
        <ImageUploadField name="imageUrl" folder="progression-images" label="Image" />
        <select name="status" defaultValue="DRAFT" className={fieldClass}>
          <option value="DRAFT">Draft</option>
          <option value="ACTIVE">Active</option>
        </select>
        <button type="submit" className="self-start rounded-lg bg-orange px-6 py-2 font-body font-semibold text-off-white">
          Add category
        </button>
      </form>
      <div className="mt-6 flex flex-col gap-3">
        {categories.map((category) => (
          <form key={category.id} action={updateCategory} className="glass flex flex-col gap-3 rounded-2xl p-5">
            <input type="hidden" name="id" value={category.id} />
            <input name="name" defaultValue={category.name} required className={fieldClass} />
            <textarea name="description" defaultValue={category.description ?? ""} rows={2} className={fieldClass} />
            <ImageUploadField name="imageUrl" folder="progression-images" defaultValue={category.imageUrl} />
            <select name="status" defaultValue={category.status} className={fieldClass}>
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
              <option value="ARCHIVED">Archived</option>
            </select>
            <div className="flex flex-wrap items-center gap-3">
              <button type="submit" className="rounded-lg border border-cyan/40 px-4 py-1.5 font-body text-sm text-cyan">
                Save
              </button>
              <ProgressionRowTools id={category.id} kind="category" />
            </div>
          </form>
        ))}
      </div>
    </main>
  );
}
