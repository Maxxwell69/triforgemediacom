import { prisma } from "@/lib/prisma";
import { requireProgressionModule } from "@/lib/progression/module";
import { ensureOfficialProgression } from "@/lib/progression/populate";
import { getOrCreateProgressionSettings } from "@/lib/progression/settings";
import ProgressionAdminNav from "@/components/admin/ProgressionAdminNav";
import { populateOfficialLadder, saveProgressionSettings } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminProgressionPage() {
  requireProgressionModule();
  await ensureOfficialProgression();
  const [levels, categories, missions, modules, certs, skills, badges, profiles, levelRows, moduleRows, completions, settings, pendingApps] =
    await Promise.all([
      prisma.progressionLevel.count(),
      prisma.progressionCategory.count(),
      prisma.progressionMission.count(),
      prisma.progressionLearningModule.count(),
      prisma.progressionCertification.count(),
      prisma.progressionSkill.count(),
      prisma.progressionBadge.count(),
      prisma.progressionProfile.count({ where: { enrolledAt: { not: null } } }),
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
      prisma.progressionProfile.count({ where: { enrolledAt: null } }),
      getOrCreateProgressionSettings(),
      prisma.progressionApplication.count({ where: { status: "PENDING" } }),
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
    { label: "Creators enrolled", value: profiles },
    { label: "Pending applications", value: pendingApps },
  ];

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="font-display text-5xl tracking-wide">
        CREATOR <span className="text-gradient">PROGRESSION</span>
      </h1>
      <p className="mt-2 font-body text-off-white/60">
        Admin-editable ladder. Hidden from CN and MN until you turn on member access below.
      </p>
      <ProgressionAdminNav />
      <form action={saveProgressionSettings} className="glass mt-6 flex flex-col gap-4 rounded-2xl p-5">
        <h2 className="font-display text-xl text-off-white/80">Member access</h2>
        <p className="font-body text-sm text-off-white/60">
          Keep this off until training is ready. CN members are still enrolled as Recruits in the background.
          MN members see the apply sheet on /progress once this is on.
        </p>
        <label className="flex items-center gap-2 font-body text-sm text-off-white/80">
          <input
            type="checkbox"
            name="memberVisible"
            defaultChecked={settings.memberVisible}
            className="h-4 w-4 accent-orange"
          />
          Show Progress to CN and MN
        </label>
        <label className="font-body text-sm text-off-white/70">
          Explainer headline
          <input
            name="explainerHeadline"
            defaultValue={settings.explainerHeadline}
            className="mt-1 w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white outline-none focus:border-cyan/60"
          />
        </label>
        <label className="font-body text-sm text-off-white/70">
          Explainer copy
          <textarea
            name="explainerBody"
            rows={4}
            defaultValue={settings.explainerBody ?? ""}
            className="mt-1 w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white outline-none focus:border-cyan/60"
          />
        </label>
        <label className="font-body text-sm text-off-white/70">
          Explainer video URL (YouTube or Vimeo)
          <input
            name="explainerVideoUrl"
            defaultValue={settings.explainerVideoUrl ?? ""}
            placeholder="https://www.youtube.com/watch?v=…"
            className="mt-1 w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white outline-none focus:border-cyan/60"
          />
        </label>
        <button type="submit" className="self-start rounded-lg border border-cyan/40 px-5 py-2 font-body text-sm text-cyan">
          Save access settings
        </button>
      </form>
      <form action={populateOfficialLadder} className="glass mt-6 rounded-2xl p-5">
        <p className="font-body text-sm text-off-white/70">
          Load the official TriForge ladder (categories, levels, track picks, module shells, certs, badges, starter skills). Safe to re-run — it updates by name.
        </p>
        <button type="submit" className="mt-3 rounded-lg bg-orange px-5 py-2 font-body text-sm font-semibold text-off-white">
          Load official content
        </button>
      </form>
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
              <span>Not enrolled</span>
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
