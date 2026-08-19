import Link from "next/link";
import { requireProfile } from "@/lib/session";
import { requireProgressionModule } from "@/lib/progression/module";
import { canCompleteMission, loadCreatorProgress } from "@/lib/progression/engine";
import { isSpecializeMissionName, isSpecialtyDeepDiveTitle, SPECIALTY_TRACKS } from "@/lib/progression/tracks";
import {
  getProgressionApplication,
  isProgressionEnrolled,
  maybeAutoEnrollProgression,
  requireMemberProgressionPage,
} from "@/lib/progression/access";
import { getOrCreateProgressionSettings, DEFAULT_EXPLAINER_BODY } from "@/lib/progression/settings";
import CompleteMissionButton from "@/components/progress/CompleteMissionButton";
import ProgressionChart from "@/components/progress/ProgressionChart";
import { SpecialtyIcon } from "@/components/progress/ProgressionIcons";
import CurrentLevelWork from "@/components/progress/CurrentLevelWork";
import { isAdminRole } from "@/lib/rbac";
import ProgressAccessSheet from "@/components/progress/ProgressAccessSheet";

export const dynamic = "force-dynamic";

export default async function ProgressPage({
  searchParams,
}: {
  searchParams?: { preview?: string };
}) {
  requireProgressionModule();
  const { user } = await requireProfile();
  await requireMemberProgressionPage(user.role);
  await maybeAutoEnrollProgression(user.id, user.role);

  const enrolled = await isProgressionEnrolled(user.id);
  const previewSheet = searchParams?.preview === "sheet" && isAdminRole(user.role);
  if (!enrolled || previewSheet) {
    const [settings, application] = await Promise.all([
      getOrCreateProgressionSettings(),
      getProgressionApplication(user.id),
    ]);
    return (
      <main className="flex-1 px-6 py-10">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-display text-5xl tracking-wide">
            YOUR <span className="text-gradient">PROGRESS</span>
          </h1>
          <p className="mt-2 font-body text-off-white/60">
            {previewSheet
              ? "Admin preview of the MN apply sheet. Members only see this when Progress is turned on and they are not a Recruit yet."
              : "Join Creator Progression as a Recruit to unlock the ladder, missions, and training."}
          </p>
          <ProgressAccessSheet
            headline={settings.explainerHeadline}
            body={settings.explainerBody || DEFAULT_EXPLAINER_BODY}
            videoUrl={settings.explainerVideoUrl}
            applicationStatus={
              application?.status === "PENDING" || application?.status === "REJECTED"
                ? application.status
                : null
            }
          />
        </div>
      </main>
    );
  }

  const progress = await loadCreatorProgress(user.id);
  const doneMissions = new Set(progress.missionCompletions.map((c) => c.missionId));
  const doneModules = new Set(progress.moduleCompletions.map((c) => c.moduleId));
  const heldSkills = new Set(progress.skillsHeld.map((s) => s.skillId));
  const heldBadges = new Set(progress.badgesHeld.map((b) => b.badgeId));
  const currentSort = progress.profile?.currentLevel?.sortOrder ?? -1;
  const currentLevel =
    progress.levels.find((level) => level.id === progress.profile?.currentLevelId) ??
    progress.levels[0] ??
    null;
  const nextLevel = currentLevel
    ? progress.levels.find((level) => level.sortOrder > currentLevel.sortOrder) ?? null
    : null;
  const heldCertById = new Map(progress.certsHeld.map((row) => [row.certificationId, row]));
  const firstLevelId = progress.levels[0]?.id ?? null;

  const levelRequirements = (nextLevel ?? currentLevel)?.certRequirements.map((req) => {
    const held = heldCertById.get(req.certificationId);
    const done = req.tier
      ? !!held && held.tier.sortOrder >= req.tier.sortOrder
      : !!held;
    const label = req.tier
      ? `${req.certification.name} · ${req.tier.name}`
      : req.certification.name;
    return { id: req.id, label, done };
  }) ?? [];
  const milestoneRequirements = (nextLevel ?? currentLevel)?.milestones.map((row) => ({
    id: row.id,
    label: row.mission.name,
    done: doneMissions.has(row.missionId),
  })) ?? [];

  const attachedLevelIds = new Set(
    [currentLevel?.id, nextLevel?.id].filter((id): id is string => !!id)
  );
  const training = [
    ...progress.teachingCourses
      .filter((course) => course.progressionLevelId && attachedLevelIds.has(course.progressionLevelId))
      .map((course) => ({
        id: course.id,
        title: course.title,
        href: `/learn/${course.id}`,
        done: course.done,
      })),
    ...progress.categories.flatMap((category) => {
      const unlockId = category.unlockAtLevel?.id ?? null;
      const attachedHere =
        (unlockId && attachedLevelIds.has(unlockId)) ||
        (!unlockId && currentLevel?.id === firstLevelId);
      if (!attachedHere) return [];
      return category.modules
        .filter((learnModule) => {
          if (!learnModule.title.startsWith("Skill Mastery Deep-Dive")) return true;
          return isSpecialtyDeepDiveTitle(learnModule.title, progress.specialty.chosenTrack);
        })
        .map((learnModule) => ({
          id: learnModule.id,
          title: learnModule.title,
          href: `/progress/learn/${learnModule.id}`,
          done: doneModules.has(learnModule.id),
        }));
    }),
  ];

  const missionBlocks = await Promise.all(
    progress.categories.flatMap((category) =>
      category.missions.map(async (mission) => ({
        mission,
        categoryName: category.name,
        blocked: await canCompleteMission(user.id, mission.id),
      }))
    )
  );

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="font-display text-5xl tracking-wide">
          YOUR <span className="text-gradient">PROGRESS</span>
        </h1>
        <p className="mt-2 font-body text-off-white/60">
          {progress.profile?.currentLevel?.name || "Recruit"} · {progress.totalXp} XP
        </p>

        <ProgressionChart
          levels={progress.levels}
          currentLevelId={progress.profile?.currentLevelId}
          specialty={progress.specialty}
        />

        {currentLevel ? (
          <CurrentLevelWork
            currentName={currentLevel.name}
            currentDescription={currentLevel.description}
            nextName={nextLevel?.name ?? null}
            xpHave={progress.totalXp}
            xpNeed={nextLevel?.xpRequired ?? null}
            requirements={[...milestoneRequirements, ...levelRequirements]}
            training={training}
          />
        ) : null}

        <section className="mt-10">
          <h2 className="font-display text-2xl text-off-white/80">Tracks</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {progress.categories.map((category) => {
              const locked =
                !!category.unlockAtLevel && currentSort < category.unlockAtLevel.sortOrder;
              return (
              <div key={category.id} className={`glass rounded-2xl p-5 ${locked ? "opacity-50" : ""}`}>
                <p className="font-body font-semibold text-off-white">{category.name}</p>
                <p className="font-body text-xs text-cyan">
                  {locked
                    ? `Locked · unlocks at ${category.unlockAtLevel?.name}`
                    : `${progress.xpByCategory[category.id] ?? 0} category XP`}
                </p>
                <ul className="mt-3 flex flex-col gap-2">
                  {category.missions
                    .filter((mission) => !isSpecializeMissionName(mission.name))
                    .map((mission) => {
                    const block = missionBlocks.find((b) => b.mission.id === mission.id);
                    return (
                      <li key={mission.id} className="flex items-center justify-between gap-2">
                        <span className="font-body text-sm text-off-white/80">
                          {mission.name} · {mission.xpValue} XP
                        </span>
                        {doneMissions.has(mission.id) && mission.recurrence === "ONE_TIME" ? (
                          <span className="font-body text-xs text-cyan">Done</span>
                        ) : locked ? (
                          <span className="font-body text-xs text-off-white/40">Locked</span>
                        ) : (
                          <CompleteMissionButton
                            missionId={mission.id}
                            disabled={!!block?.blocked}
                            label={block?.blocked || "Complete"}
                          />
                        )}
                      </li>
                    );
                  })}
                  {progress.teachingCourses
                    .filter((course) => course.progressionCategoryId === category.id)
                    .map((course) => {
                      const levelLocked =
                        !!course.progressionLevel && currentSort < course.progressionLevel.sortOrder;
                      return (
                        <li key={course.id}>
                          {locked || levelLocked ? (
                            <span className="font-body text-sm text-off-white/40">
                              {course.title}
                              {levelLocked ? ` · from ${course.progressionLevel?.name}` : ""}
                            </span>
                          ) : (
                            <Link
                              href={`/learn/${course.id}`}
                              className="font-body text-sm text-cyan hover:underline"
                            >
                              {course.done ? "✓ " : ""}
                              {course.title}
                            </Link>
                          )}
                        </li>
                      );
                    })}
                  {category.modules
                    .filter((learnModule) => {
                      if (!learnModule.title.startsWith("Skill Mastery Deep-Dive")) return true;
                      return isSpecialtyDeepDiveTitle(learnModule.title, progress.specialty.chosenTrack);
                    })
                    .map((learnModule) => (
                    <li key={learnModule.id}>
                      {locked ? (
                        <span className="font-body text-sm text-off-white/40">{learnModule.title}</span>
                      ) : (
                        <Link href={`/progress/learn/${learnModule.id}`} className="font-body text-sm text-cyan hover:underline">
                          {doneModules.has(learnModule.id) ? "✓ " : ""}
                          {learnModule.title}
                        </Link>
                      )}
                    </li>
                  ))}
                  {category.certifications.map((cert) => {
                    const held = progress.certsHeld.find((h) => h.certificationId === cert.id);
                    return (
                      <li key={cert.id} className="font-body text-xs text-off-white/50">
                        {cert.name}: {held ? held.tier.name : "not earned"}
                      </li>
                    );
                  })}
                </ul>
              </div>
              );
            })}
          </div>
        </section>

        <section className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="glass rounded-2xl p-5">
            <h2 className="font-display text-xl text-off-white/80">Skills</h2>
            <p className="mt-1 font-body text-xs text-off-white/45">
              Your specialty at Rising Star. One of seven: Engagement Host, Gamer, Shop Owner, Musician, Artist,
              Educator, Community Builder.
            </p>
            <ul className="mt-3 flex flex-col gap-2">
              {SPECIALTY_TRACKS.map((track) => {
                const skill = progress.skills.find((row) => row.name === track.name);
                const held = skill ? heldSkills.has(skill.id) : false;
                return (
                  <li key={track.name} className={`flex items-start gap-3 font-body text-sm ${held ? "text-off-white" : "text-off-white/40"}`}>
                    <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${held ? "border-orange text-off-white" : "border-off-white/25 text-off-white/40"}`}>
                      <SpecialtyIcon name={track.name} className="h-4 w-4" />
                    </span>
                    <span>
                      <span className="font-semibold">{held ? "Unlocked" : "Locked"} — {track.name}</span>
                      <span className="mt-0.5 block text-xs text-off-white/40">{track.description}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="glass rounded-2xl p-5">
            <h2 className="font-display text-xl text-off-white/80">Badges</h2>
            <ul className="mt-3 flex flex-col gap-2">
              {progress.badges.map((badge) => (
                <li key={badge.id} className={`font-body text-sm ${heldBadges.has(badge.id) ? "text-cyan" : "text-off-white/40"}`}>
                  {heldBadges.has(badge.id) ? "Earned" : "Locked"} — {badge.name}
                </li>
              ))}
              {progress.badges.length === 0 ? (
                <li className="font-body text-sm text-off-white/40">None yet</li>
              ) : null}
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}
