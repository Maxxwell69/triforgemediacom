import { prisma } from "@/lib/prisma";
import { requireProgressionModule } from "@/lib/progression/module";
import { ensureOfficialProgression } from "@/lib/progression/populate";
import {
  getOrCreateProgressionSettings,
  PROGRESSION_MEMBERS_LOCKED,
} from "@/lib/progression/settings";
import ProgressionAdminNav from "@/components/admin/ProgressionAdminNav";
import { populateOfficialLadder, saveProgressionSettings } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminProgressionPage() {
  requireProgressionModule();
  await ensureOfficialProgression();
  const [levels, categories, missions, attachedCourses, certs, skills, badges, profiles, levelRows, courseRows, completions, settings, pendingApps] =
    await Promise.all([
      prisma.progressionLevel.count(),
      prisma.progressionCategory.count(),
      prisma.progressionMission.count(),
      prisma.course.count({ where: { progressionEnabled: true } }),
      prisma.progressionCertification.count(),
      prisma.progressionSkill.count(),
      prisma.progressionBadge.count(),
      prisma.progressionProfile.count({ where: { enrolledAt: { not: null } } }),
      prisma.progressionLevel.findMany({
        where: { status: "ACTIVE" },
        orderBy: { sortOrder: "asc" },
        include: { _count: { select: { profiles: true } } },
      }),
      prisma.course.findMany({
        where: { progressionEnabled: true },
        orderBy: { title: "asc" },
        include: {
          progressionLevel: { select: { name: true } },
          _count: { select: { enrollments: true } },
        },
      }),
      prisma.progressionProfile.count({ where: { enrolledAt: null } }),
      getOrCreateProgressionSettings(),
      prisma.progressionApplication.count({ where: { status: "PENDING" } }),
    ]);
  const coursesByEnrollments = [...courseRows].sort((a, b) => b._count.enrollments - a._count.enrollments);

  const stats = [
    { label: "Levels", value: levels },
    { label: "Categories", value: categories },
    { label: "Missions", value: missions },
    { label: "LMS courses", value: attachedCourses },
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
        Admin-editable ladder. Hidden from CN and MN until training is ready.
      </p>
      <ProgressionAdminNav />
      <form action={saveProgressionSettings} className="glass mt-6 flex flex-col gap-4 rounded-2xl p-5">
        <h2 className="font-display text-xl text-off-white/80">Member access</h2>
        {PROGRESSION_MEMBERS_LOCKED ? (
          <p className="rounded-lg border border-orange/30 bg-orange/10 px-3 py-2 font-body text-sm text-off-white/80">
            Locked to admins for now. CN and MN will not see Progress in the nav or on /progress, even if this
            box was checked earlier. Flip this when training is ready.
          </p>
        ) : (
          <p className="font-body text-sm text-off-white/60">
            Keep this off until training is ready. CN members are still enrolled as Recruits in the background.
            MN members see the apply sheet on /progress once this is on.
          </p>
        )}
        <label className="flex items-center gap-2 font-body text-sm text-off-white/80">
          <input
            type="checkbox"
            name="memberVisible"
            defaultChecked={PROGRESSION_MEMBERS_LOCKED ? false : settings.memberVisible}
            disabled={PROGRESSION_MEMBERS_LOCKED}
            className="h-4 w-4 accent-orange disabled:opacity-50"
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
            placeholder="https://youtu.be/QXh4TMdixP4"
            className="mt-1 w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white outline-none focus:border-cyan/60"
          />
        </label>
        <button type="submit" className="self-start rounded-lg border border-cyan/40 px-5 py-2 font-body text-sm text-cyan">
          Save access settings
        </button>
      </form>
      <form action={populateOfficialLadder} className="glass mt-6 rounded-2xl p-5">
        <p className="font-body text-sm text-off-white/70">
          Load the official TriForge ladder (categories, levels, track picks, certs, badges, starter skills). Safe to re-run — it updates by name. Training is Learning Center courses attached to levels, not separate progression lessons.
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
          <h2 className="font-display text-xl text-off-white/80">LMS courses attached</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {coursesByEnrollments.length === 0 ? (
              <li className="font-body text-sm text-off-white/40">
                None yet — attach a course to a level in Admin → Courses
              </li>
            ) : (
              coursesByEnrollments.map((course) => (
                <li key={course.id} className="flex justify-between font-body text-sm text-off-white/70">
                  <span>
                    {course.title}
                    {course.progressionLevel ? ` · ${course.progressionLevel.name}` : ""}
                  </span>
                  <span>{course._count.enrollments}</span>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </main>
  );
}
