import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireProgressionModule } from "@/lib/progression/module";
import { loadCreatorProgress } from "@/lib/progression/engine";
import { grantBadge, grantCertification, grantSkill, enrollUserAsRecruit, setUserProgressionLevel, clearUserProgressionPlacement } from "../../actions";

export const dynamic = "force-dynamic";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white outline-none focus:border-cyan/60";

export default async function AdminProgressionPersonPage({
  params,
}: {
  params: { userId: string };
}) {
  requireProgressionModule();
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: {
      id: true,
      name: true,
      email: true,
      progressionProfile: { select: { enrolledAt: true } },
    },
  });
  if (!user) notFound();
  const progress = await loadCreatorProgress(user.id);
  const allCerts = await prisma.progressionCertification.findMany({
    include: { tiers: { orderBy: { sortOrder: "asc" } } },
  });
  const allSkills = await prisma.progressionSkill.findMany({ where: { status: "ACTIVE" } });
  const allBadges = await prisma.progressionBadge.findMany({ where: { status: "ACTIVE" } });

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/admin/progression/people" className="font-body text-sm text-off-white/50 hover:text-cyan">
        ← People
      </Link>
      <h1 className="mt-4 font-display text-4xl tracking-wide">{user.name || user.email}</h1>
      <p className="mt-1 font-body text-sm text-off-white/50">
        {user.progressionProfile?.enrolledAt || progress.profile?.enrolledAt
          ? `${progress.profile?.currentLevel?.name || "Recruit"} · ${progress.totalXp} XP`
          : "Not enrolled in Creator Progression"}
        {progress.profile?.adminPlacedLevel
          ? ` · placed at ${progress.profile.adminPlacedLevel.name}`
          : ""}
      </p>
      <section className="glass mt-6 rounded-2xl p-6">
        <h2 className="font-display text-xl text-off-white/80">Set level</h2>
        <p className="mt-1 font-body text-sm text-off-white/55">
          Place this member on any rank. They stay at that rank even without the XP or certs, and can still
          climb higher automatically.
        </p>
        <form action={setUserProgressionLevel} className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <input type="hidden" name="userId" value={user.id} />
          <select
            name="levelId"
            required
            defaultValue={progress.profile?.currentLevel?.id || ""}
            className={fieldClass}
          >
            <option value="" disabled>
              Choose a level
            </option>
            {progress.levels.map((level) => (
              <option key={level.id} value={level.id}>
                {level.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="shrink-0 rounded-lg bg-orange px-4 py-2 font-body text-sm font-semibold text-off-white"
          >
            Set level
          </button>
        </form>
        {progress.profile?.adminPlacedLevelId ? (
          <form action={clearUserProgressionPlacement} className="mt-3">
            <input type="hidden" name="userId" value={user.id} />
            <button type="submit" className="font-body text-xs text-off-white/50 underline hover:text-cyan">
              Clear placement and use earned rank only
            </button>
          </form>
        ) : null}
      </section>
      {!user.progressionProfile?.enrolledAt && !progress.profile?.enrolledAt ? (
        <form
          action={async () => {
            "use server";
            await enrollUserAsRecruit(user.id);
          }}
          className="mt-4"
        >
          <button type="submit" className="rounded-lg border border-cyan/40 px-4 py-2 font-body text-sm text-cyan">
            Enroll as Recruit
          </button>
        </form>
      ) : null}

      <section className="glass mt-8 rounded-2xl p-6">
        <h2 className="font-display text-xl text-off-white/80">Grant certification</h2>
        <form
          action={async (formData) => {
            "use server";
            await grantCertification(
              user.id,
              String(formData.get("certificationId") || ""),
              String(formData.get("tierId") || "")
            );
          }}
          className="mt-3 flex flex-col gap-2"
        >
          <select name="certificationId" required className={fieldClass}>
            {allCerts.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select name="tierId" required className={fieldClass}>
            {allCerts.flatMap((c) =>
              c.tiers.map((t) => (
                <option key={t.id} value={t.id}>
                  {c.name} — {t.name}
                </option>
              ))
            )}
          </select>
          <button type="submit" className="self-start rounded-lg bg-orange px-4 py-2 font-body text-sm font-semibold text-off-white">
            Grant
          </button>
        </form>
      </section>

      <section className="glass mt-4 rounded-2xl p-6">
        <h2 className="font-display text-xl text-off-white/80">Grant skill</h2>
        <form
          action={async (formData) => {
            "use server";
            await grantSkill(user.id, String(formData.get("skillId") || ""));
          }}
          className="mt-3 flex flex-col gap-2"
        >
          <select name="skillId" required className={fieldClass}>
            {allSkills.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <button type="submit" className="self-start rounded-lg border border-cyan/40 px-4 py-2 font-body text-sm text-cyan">
            Unlock
          </button>
        </form>
      </section>

      <section className="glass mt-4 rounded-2xl p-6">
        <h2 className="font-display text-xl text-off-white/80">Grant badge</h2>
        <form
          action={async (formData) => {
            "use server";
            await grantBadge(user.id, String(formData.get("badgeId") || ""));
          }}
          className="mt-3 flex flex-col gap-2"
        >
          <select name="badgeId" required className={fieldClass}>
            {allBadges.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          <button type="submit" className="self-start rounded-lg border border-cyan/40 px-4 py-2 font-body text-sm text-cyan">
            Award
          </button>
        </form>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-xl text-off-white/80">Held</h2>
        <p className="mt-2 font-body text-sm text-off-white/60">
          Certs: {progress.certsHeld.map((c) => `${c.certification.name} (${c.tier.name})`).join(", ") || "none"}
        </p>
        <p className="mt-1 font-body text-sm text-off-white/60">
          Skills: {progress.skillsHeld.length} · Badges: {progress.badgesHeld.length} · Missions:{" "}
          {progress.missionCompletions.length}
        </p>
        <ul className="mt-4 flex flex-col gap-1">
          {progress.categories.map((category) => (
            <li key={category.id} className="font-body text-xs text-off-white/45">
              {category.name}: {progress.xpByCategory[category.id] ?? 0} XP
            </li>
          ))}
        </ul>
        <ul className="mt-4 flex flex-col gap-1">
          {progress.missionCompletions.map((row) => {
            const mission = progress.categories
              .flatMap((category) => category.missions)
              .find((item) => item.id === row.missionId);
            return (
              <li key={row.id} className="font-body text-xs text-off-white/45">
                {mission?.name || "Mission"} · {row.completedAt.toISOString().slice(0, 16).replace("T", " ")} UTC · +
                {row.xpAwarded} XP
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
