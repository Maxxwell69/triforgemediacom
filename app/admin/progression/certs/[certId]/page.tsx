import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireProgressionModule } from "@/lib/progression/module";
import { createCertTier, updateCertification, updateCertTier } from "../../actions";
import ImageUploadField from "@/components/ImageUploadField";
import ProgressionRowTools from "@/components/admin/ProgressionRowTools";

export const dynamic = "force-dynamic";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60";

export default async function AdminProgressionCertDetailPage({
  params,
}: {
  params: { certId: string };
}) {
  requireProgressionModule();
  const [cert, categories] = await Promise.all([
    prisma.progressionCertification.findUnique({
      where: { id: params.certId },
      include: { tiers: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.progressionCategory.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  if (!cert) notFound();

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/admin/progression/certs" className="font-body text-sm text-off-white/50 hover:text-cyan">
        ← Certs
      </Link>
      <h1 className="mt-4 font-display text-4xl tracking-wide">{cert.name}</h1>
      <form action={updateCertification} className="glass mt-6 flex flex-col gap-3 rounded-2xl p-6">
        <input type="hidden" name="id" value={cert.id} />
        <select name="categoryId" defaultValue={cert.categoryId} className={fieldClass}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <input name="name" defaultValue={cert.name} required className={fieldClass} />
        <textarea name="description" defaultValue={cert.description ?? ""} rows={2} className={fieldClass} />
        <ImageUploadField name="imageUrl" folder="progression-images" defaultValue={cert.imageUrl} />
        <select name="status" defaultValue={cert.status} className={fieldClass}>
          <option value="DRAFT">Draft</option>
          <option value="ACTIVE">Active</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className="rounded-lg bg-orange px-6 py-2 font-body font-semibold text-off-white">
            Save certification
          </button>
          <ProgressionRowTools id={cert.id} kind="certification" />
        </div>
      </form>
      <form action={createCertTier} className="glass mt-8 flex flex-col gap-3 rounded-2xl p-5">
        <h2 className="font-display text-xl text-off-white/80">Add tier</h2>
        <input type="hidden" name="certificationId" value={cert.id} />
        <input name="name" required placeholder="Tier name" className={fieldClass} />
        <select name="unlockKind" defaultValue="CATEGORY_XP" className={fieldClass}>
          <option value="CATEGORY_XP">Category XP</option>
          <option value="QUIZ_PASSED">Quiz passed</option>
          <option value="ADMIN_REVIEW">Admin review</option>
        </select>
        <input name="xpRequired" type="number" min={0} placeholder="XP if using category XP" className={fieldClass} />
        <input name="xpAward" type="number" min={0} placeholder="Points awarded when this tier is earned" className={fieldClass} />
        <button type="submit" className="self-start rounded-lg border border-cyan/40 px-4 py-1.5 font-body text-sm text-cyan">
          Add tier
        </button>
      </form>
      <div className="mt-4 flex flex-col gap-3">
        {cert.tiers.map((tier) => (
          <form key={tier.id} action={updateCertTier} className="glass flex flex-col gap-3 rounded-2xl p-5">
            <input type="hidden" name="id" value={tier.id} />
            <input name="name" defaultValue={tier.name} required className={fieldClass} />
            <textarea name="description" defaultValue={tier.description ?? ""} rows={2} className={fieldClass} />
            <select name="unlockKind" defaultValue={tier.unlockKind} className={fieldClass}>
              <option value="CATEGORY_XP">Category XP</option>
              <option value="QUIZ_PASSED">Quiz passed</option>
              <option value="ADMIN_REVIEW">Admin review</option>
            </select>
            <input name="xpRequired" type="number" min={0} defaultValue={tier.xpRequired ?? ""} placeholder="XP if using category XP" className={fieldClass} />
            <input name="xpAward" type="number" min={0} defaultValue={tier.xpAward} placeholder="Points awarded when earned" className={fieldClass} />
            <div className="flex flex-wrap items-center gap-3">
              <button type="submit" className="rounded-lg border border-cyan/40 px-4 py-1.5 font-body text-sm text-cyan">
                Save tier
              </button>
              <ProgressionRowTools id={tier.id} kind="certTier" />
            </div>
          </form>
        ))}
      </div>
    </main>
  );
}
