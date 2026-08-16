import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireProgressionModule } from "@/lib/progression/module";
import { createCertification } from "../actions";
import ProgressionAdminNav from "@/components/admin/ProgressionAdminNav";
import ProgressionRowTools from "@/components/admin/ProgressionRowTools";
import ImageUploadField from "@/components/ImageUploadField";

export const dynamic = "force-dynamic";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60";

export default async function AdminProgressionCertsPage() {
  requireProgressionModule();
  const [categories, certs] = await Promise.all([
    prisma.progressionCategory.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.progressionCertification.findMany({
      include: { category: true, tiers: { orderBy: { sortOrder: "asc" } } },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-5xl tracking-wide">
        CERTIFI<span className="text-gradient">CATIONS</span>
      </h1>
      <p className="mt-2 font-body text-xs text-off-white/40">
        New certs start with Trainee / Certified / Master tiers — edit them after create.
      </p>
      <ProgressionAdminNav />
      {categories.length === 0 ? (
        <p className="mt-8 font-body text-off-white/50">Create a category first.</p>
      ) : (
        <form action={createCertification} className="glass mt-8 flex flex-col gap-3 rounded-2xl p-6">
          <select name="categoryId" required className={fieldClass}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <input name="name" required placeholder="Certification name" className={fieldClass} />
          <textarea name="description" rows={2} className={fieldClass} />
          <ImageUploadField name="imageUrl" folder="progression-images" label="Image" />
          <select name="status" defaultValue="DRAFT" className={fieldClass}>
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
          </select>
          <button type="submit" className="self-start rounded-lg bg-orange px-6 py-2 font-body font-semibold text-off-white">
            Add certification
          </button>
        </form>
      )}
      <div className="mt-6 flex flex-col gap-2">
        {certs.map((cert) => (
          <div key={cert.id} className="glass flex items-center justify-between gap-3 rounded-xl p-4">
            <Link href={`/admin/progression/certs/${cert.id}`} className="min-w-0 flex-1">
              <p className="font-body text-sm text-off-white">{cert.name}</p>
              <p className="font-body text-xs text-off-white/40">
                {cert.category.name} · {cert.tiers.map((t) => t.name).join(" / ")}
              </p>
            </Link>
            <ProgressionRowTools id={cert.id} kind="certification" />
          </div>
        ))}
      </div>
    </main>
  );
}
