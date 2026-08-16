import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireProgressionModule } from "@/lib/progression/module";
import { setLevelCertReq, setLevelMilestone, updateLevel } from "../../actions";
import ImageUploadField from "@/components/ImageUploadField";
import ProgressionToggle from "@/components/admin/ProgressionToggle";

export const dynamic = "force-dynamic";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60";

export default async function AdminProgressionLevelDetailPage({
  params,
}: {
  params: { levelId: string };
}) {
  requireProgressionModule();
  const [level, missions, certs] = await Promise.all([
    prisma.progressionLevel.findUnique({
      where: { id: params.levelId },
      include: { milestones: true, certRequirements: true },
    }),
    prisma.progressionMission.findMany({
      where: { status: { not: "ARCHIVED" } },
      include: { category: true },
      orderBy: { name: "asc" },
    }),
    prisma.progressionCertification.findMany({
      where: { status: { not: "ARCHIVED" } },
      include: { tiers: { orderBy: { sortOrder: "asc" } } },
      orderBy: { name: "asc" },
    }),
  ]);
  if (!level) notFound();
  const milestoneIds = new Set(level.milestones.map((m) => m.missionId));
  const certReqById = new Map(level.certRequirements.map((req) => [req.certificationId, req]));

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/admin/progression/levels" className="font-body text-sm text-off-white/50 hover:text-cyan">
        ← Levels
      </Link>
      <h1 className="mt-4 font-display text-4xl tracking-wide">{level.name}</h1>
      <form action={updateLevel} className="glass mt-6 flex flex-col gap-3 rounded-2xl p-6">
        <input type="hidden" name="id" value={level.id} />
        <input name="name" defaultValue={level.name} required className={fieldClass} />
        <textarea name="description" defaultValue={level.description ?? ""} rows={3} className={fieldClass} />
        <ImageUploadField name="imageUrl" folder="progression-images" defaultValue={level.imageUrl} />
        <input name="xpRequired" type="number" min={0} defaultValue={level.xpRequired} className={fieldClass} />
        <select name="milestoneMode" defaultValue={level.milestoneMode} className={fieldClass}>
          <option value="ALL">All milestone missions required</option>
          <option value="ANY">Any one milestone mission</option>
        </select>
        <select name="status" defaultValue={level.status} className={fieldClass}>
          <option value="DRAFT">Draft</option>
          <option value="ACTIVE">Active</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <button type="submit" className="self-start rounded-lg bg-orange px-6 py-2 font-body font-semibold text-off-white">
          Save level
        </button>
      </form>
      <section className="mt-8">
        <h2 className="font-display text-2xl text-off-white/80">Milestone missions</h2>
        <div className="mt-3 flex flex-col gap-2">
          {missions.map((mission) => (
            <ProgressionToggle
              key={mission.id}
              checked={milestoneIds.has(mission.id)}
              label={`${mission.category.name} — ${mission.name}`}
              onToggle={(on) => setLevelMilestone(level.id, mission.id, on)}
            />
          ))}
        </div>
      </section>
      <section className="mt-8">
        <h2 className="font-display text-2xl text-off-white/80">Required certifications</h2>
        <div className="mt-3 flex flex-col gap-2">
          {certs.map((cert) => (
            <form
              key={cert.id}
              action={async (formData) => {
                "use server";
                await setLevelCertReq(level.id, cert.id, String(formData.get("tierId") || "") || null);
              }}
              className="glass flex items-center gap-3 rounded-xl p-3"
            >
              <span className="min-w-0 flex-1 font-body text-sm text-off-white/80">{cert.name}</span>
              <select
                name="tierId"
                defaultValue={certReqById.get(cert.id)?.tierId ?? ""}
                className={fieldClass}
              >
                <option value="">Not required</option>
                {cert.tiers.map((tier) => (
                  <option key={tier.id} value={tier.id}>
                    {tier.name}+
                  </option>
                ))}
              </select>
              <button type="submit" className="rounded-lg border border-cyan/40 px-3 py-1.5 font-body text-xs text-cyan">
                Save
              </button>
            </form>
          ))}
        </div>
      </section>
    </main>
  );
}
