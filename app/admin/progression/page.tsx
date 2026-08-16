import { prisma } from "@/lib/prisma";
import { requireProgressionModule } from "@/lib/progression/module";
import ProgressionAdminNav from "@/components/admin/ProgressionAdminNav";

export const dynamic = "force-dynamic";

export default async function AdminProgressionPage() {
  requireProgressionModule();
  const [levels, categories, missions, modules, certs, skills, badges, profiles, levelRows, moduleRows, completions] =
    await Promise.all([
      prisma.progressionLevel.count(),
      prisma.progressionCategory.count(),
      prisma.progressionMission.count(),
      prisma.progressionLearningModule.count(),
      prisma.progressionCertification.count(),
      prisma.progressionSkill.count(),
      prisma.progressionBadge.count(),
      prisma.progressionProfile.count(),
      prisma.progressionLevel.findMany({
        where: { status: "ACTIVE" },
        orderBy: { sortOrder: "asc" },
        include: { _count: { select: { profiles: true } } },
      }),
      prisma.progressionLearningModule.findMany({
        where: { status: "ACTIVE" },
        orderBy: { title: "asc" },
        include: { _count: { select: { completions: true } } },
      }),
      prisma.progressionProfile.count({ where: { currentLevelId: null } }),
    ]);
  const moduleByCompletions = [...moduleRows].sort((a, b) => b._count.completions - a._count.completions);

  const stats = [
    { label: "Levels", value: levels },
    { label: "Categories", value: categories },
    { label: "Missions", value: missions },
    { label: "Learn modules", value: modules },
    { label: "Certifications", value: certs },
    { label: "Skills", value: skills },
    { label: "Badges", value: badges },
    { label: "Creators tracked", value: profiles },
  ];

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="font-display text-5xl tracking-wide">
        CREATOR <span className="text-gradient">PROGRESSION</span>
      </h1>
      <p className="mt-2 font-body text-off-white/60">
        Admin-editable ladder. No tracks are hardcoded — add categories, levels, missions, and
        certs here, then test on /progress.
      </p>
      <ProgressionAdminNav />
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="glass rounded-2xl p-4">
            <p className="font-body text-xs uppercase tracking-wide text-off-white/40">{stat.label}</p>
            <p className="mt-1 font-display text-3xl text-off-white">{stat.value}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        <section className="glass rounded-2xl p-5">
          <h2 className="font-display text-xl text-off-white/80">Creators by level</h2>
          <ul className="mt-3 flex flex-col gap-2">
            <li className="flex justify-between font-body text-sm text-off-white/70">
              <span>No level yet</span>
              <span>{completions}</span>
            </li>
            {levelRows.map((level) => (
              <li key={level.id} className="flex justify-between font-body text-sm text-off-white/70">
                <span>{level.name}</span>
                <span>{level._count.profiles}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="glass rounded-2xl p-5">
          <h2 className="font-display text-xl text-off-white/80">Module completions</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {moduleByCompletions.length === 0 ? (
              <li className="font-body text-sm text-off-white/40">No active modules</li>
            ) : (
              moduleByCompletions.map((learnModule) => (
                <li key={learnModule.id} className="flex justify-between font-body text-sm text-off-white/70">
                  <span>{learnModule.title}</span>
                  <span>{learnModule._count.completions}</span>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </main>
  );
}
