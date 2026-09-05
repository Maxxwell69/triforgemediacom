import Link from "next/link";
import CompleteMissionButton from "@/components/progress/CompleteMissionButton";

type TrainingLink = {
  id: string;
  title: string;
  href: string;
  done: boolean;
  levelName?: string | null;
  specialtyName?: string | null;
};

type Requirement = {
  id: string;
  label: string;
  done: boolean;
  waived?: boolean;
  detail?: string | null;
};

type PathwayMission = {
  id: string;
  name: string;
  xpValue: number;
  categoryName: string;
  done: boolean;
  blocked: string | null;
};

export default function CurrentLevelWork({
  currentName,
  currentDescription,
  nextName,
  xpHave,
  xpNeed,
  requirements,
  training,
  missions,
}: {
  currentName: string;
  currentDescription: string | null;
  nextName: string | null;
  xpHave: number;
  xpNeed: number | null;
  requirements: Requirement[];
  training: TrainingLink[];
  missions: PathwayMission[];
}) {
  const remainingXp = Math.max(0, (xpNeed ?? 0) - xpHave);

  return (
    <section className="glass mt-8 rounded-2xl p-6">
      <p className="font-body text-xs font-semibold uppercase tracking-[0.2em] text-orange">
        Current level
      </p>
      <h2 className="mt-2 font-display text-3xl tracking-wide text-off-white">{currentName}</h2>
      {currentDescription ? (
        <p className="mt-2 font-body text-sm leading-relaxed text-off-white/65">{currentDescription}</p>
      ) : null}

      {nextName ? (
        <p className="mt-5 font-display text-xl text-off-white/80">Path to {nextName}</p>
      ) : (
        <p className="mt-5 font-body text-sm text-cyan">You are at the top of the ladder.</p>
      )}

      {nextName && xpNeed != null ? (
        <p className="mt-2 font-body text-sm text-off-white/70">
          {remainingXp === 0 ? (
            <>
              {xpHave.toLocaleString()} / {xpNeed.toLocaleString()} XP
            </>
          ) : (
            <>
              {remainingXp.toLocaleString()} XP to go
              <span className="text-off-white/40">
                {" "}
                · {xpHave.toLocaleString()} / {xpNeed.toLocaleString()}
              </span>
            </>
          )}
        </p>
      ) : null}

      {requirements.length > 0 ? (
        <ul className="mt-4 flex flex-col gap-2">
          {requirements.map((item) => (
            <li
              key={item.id}
              className={`font-body text-sm ${item.done || item.waived ? "text-cyan" : "text-off-white/80"}`}
            >
              {item.done || item.waived ? "✓" : "○"} {item.label}
              {item.waived ? (
                <span className="text-off-white/40"> · waived — no training assigned</span>
              ) : null}
              {item.detail && !item.waived ? (
                <span className="text-off-white/45"> · {item.detail}</span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      <h3 className="mt-6 font-display text-lg text-off-white/80">Training</h3>
      {training.length === 0 ? (
        <p className="mt-2 font-body text-sm text-off-white/40">
          No Learning Center courses are assigned for this next rank. Training gates without a course
          do not block you — keep earning XP and complete the missions below.
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {training.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="font-body text-sm text-cyan transition hover:underline"
              >
                {item.done ? "✓ " : ""}
                {item.title}
                {item.levelName ? (
                  <span className="text-off-white/40"> · {item.levelName}</span>
                ) : null}
                {item.specialtyName ? (
                  <span className="text-off-white/40"> · {item.specialtyName}</span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {missions.length > 0 ? (
        <>
          <h3 className="mt-6 font-display text-lg text-off-white/80">Next missions</h3>
          <p className="mt-1 font-body text-xs text-off-white/45">
            These missions count toward the rank above. Certified ranks also need category XP from
            that track.
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {missions.map((mission) => (
              <li key={mission.id} className="flex items-center justify-between gap-3">
                <span className="font-body text-sm text-off-white/80">
                  {mission.name}
                  <span className="text-off-white/40">
                    {" "}
                    · {mission.categoryName} · {mission.xpValue} XP
                  </span>
                </span>
                {mission.done ? (
                  <span className="font-body text-xs text-cyan">Done</span>
                ) : (
                  <CompleteMissionButton
                    missionId={mission.id}
                    disabled={!!mission.blocked}
                    label={mission.blocked || "Complete"}
                  />
                )}
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}
