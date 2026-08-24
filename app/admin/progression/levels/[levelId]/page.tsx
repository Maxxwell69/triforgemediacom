import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireProgressionModule } from "@/lib/progression/module";
import { setLevelCertReqForm, updateLevel } from "../../actions";
import ImageUploadField from "@/components/ImageUploadField";
import LevelMilestoneToggle from "@/components/admin/LevelMilestoneToggle";
import ProgressionCourseAttachPanel from "@/components/admin/ProgressionCourseAttachPanel";

export const dynamic = "force-dynamic";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60";

export default async function AdminProgressionLevelDetailPage({
  params,
}: {
  params: { levelId: string };
}) {
  requireProgressionModule();
  const [level, missions, certs, courses] = await Promise.all([
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
    prisma.course.findMany({
      orderBy: { title: "asc" },
      select: {
        id: true,
        title: true,
        isPublished: true,
        progressionEnabled: true,
        progressionSpecialty: true,
        progressionLevelId: true,
        progressionLevel: { select: { name: true } },
      },
    }),
  ]);
  if (!level) notFound();
  const milestoneIds = new Set(level.milestones.map((m) => m.missionId));
  const certReqById = new Map(level.certRequirements.map((req) => [req.certificationId, req]));
  const attachedCourses = courses.filter((course) => course.progressionLevelId === level.id);
  const availableCourses = courses.filter((course) => course.progressionLevelId !== level.id);

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
        <h2 className="font-display text-2xl text-off-white/80">Learning Center courses</h2>
        <p className="mt-1 font-body text-sm text-off-white/50">
          Attach LMS courses to this rank. Optionally limit a course to a specialization so only members
          who picked that track see it as unlocked.
        </p>
        <ProgressionCourseAttachPanel
          target={{ kind: "level", levelId: level.id }}
          attached={attachedCourses}
          available={availableCourses}
        />
      </section>
      <section className="mt-8">
        <h2 className="font-display text-2xl text-off-white/80">Milestone missions</h2>
        <div className="mt-3 flex flex-col gap-2">
          {missions.map((mission) => (
            <LevelMilestoneToggle
              key={mission.id}
              levelId={level.id}
              missionId={mission.id}
              checked={milestoneIds.has(mission.id)}
              label={`${mission.category.name} — ${mission.name}`}
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
              action={setLevelCertReqForm}
              className="glass flex flex-col gap-2 rounded-xl p-3 sm:flex-row sm:items-center sm:gap-3"
            >
              <input type="hidden" name="levelId" value={level.id} />
              <input type="hidden" name="certificationId" value={cert.id} />
              <span className="w-full shrink-0 font-body text-sm text-off-white/80 sm:w-44">
                {cert.name}
              </span>
              <select
                name="tierId"
                defaultValue={certReqById.get(cert.id)?.tierId ?? ""}
                className="min-w-0 flex-1 rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white outline-none transition focus:border-cyan/60"
              >
                <option value="">Not required</option>
                {cert.tiers.map((tier) => (
                  <option key={tier.id} value={tier.id}>
                    {tier.name}+
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="shrink-0 rounded-lg border border-cyan/40 px-3 py-1.5 font-body text-xs text-cyan"
              >
                Save
              </button>
            </form>
          ))}
        </div>
      </section>
    </main>
  );
}
