import ChooseSpecialtyButton from "@/components/progress/ChooseSpecialtyButton";
import ResetSpecialtyButton from "@/components/progress/ResetSpecialtyButton";
import LevelTip from "@/components/progress/LevelTip";
import {
  IconChevronUp,
  IconPerson,
  IconRecruit,
  SpecialtyIcon,
} from "@/components/progress/ProgressionIcons";
import { SPECIALTY_TRACKS, SPECIALTY_UNLOCK_LEVEL, formatSpecialtyTracks } from "@/lib/progression/tracks";

type Level = {
  id: string;
  name: string;
  xpRequired: number;
  description: string | null;
  sortOrder: number;
};

type SpecialtyOption = {
  missionId: string;
  track: string;
  chosen: boolean;
};

const OFFICIAL_RANK: Record<string, number> = {
  Regular: 4,
  "Fan Favorite": 5,
  "Featured Creator": 6,
  "Top Creator": 7,
  "Elite Creator": 8,
  "Triforge Star": 9,
  Legend: 10,
};

const LIVE_HOST_TIP =
  "Everyone starts as a Live Host. Recruit is the first ranked step on the shared path.";

export default function ProgressionChart({
  levels,
  currentLevelId,
  specialty,
}: {
  levels: Level[];
  currentLevelId: string | null | undefined;
  specialty: {
    unlocked: boolean;
    unlocksAt: string | null;
    chosenTrack: string | null;
    chosenTracks: string[];
    options: SpecialtyOption[];
  };
}) {
  const currentIndex = levels.findIndex((level) => level.id === currentLevelId);
  const foundRising = levels.findIndex((level) => level.name === SPECIALTY_UNLOCK_LEVEL);
  const branchIndex = foundRising >= 0 ? foundRising : 2;
  const early = levels.slice(0, branchIndex);
  const rising = levels[branchIndex];
  const advanced = levels.slice(branchIndex + 1);
  const legend = advanced.find((level) => level.name === "Legend");
  const ranks = advanced.filter((level) => level.name !== "Legend");
  const options = SPECIALTY_TRACKS.map((track) => {
    const option = specialty.options.find((row) => row.track === track.name);
    return { ...track, missionId: option?.missionId ?? null, chosen: option?.chosen ?? false };
  });

  return (
    <section className="mt-8">
      <h2 className="font-display text-2xl text-off-white/80">Creator progression</h2>
      <p className="mt-2 font-body text-sm text-off-white/55">
        Live Host start. Recruit and Newcomer share one path. Rising Star unlocks specialties — pick as many
        as you want. Then the rank ladder — Regular through Legend.
      </p>

      <div className="mt-6 overflow-visible rounded-[28px] border border-off-white/10 bg-[#050505] px-4 py-8 sm:px-8">
        <div className="mx-auto flex max-w-xl flex-col items-center">
          {legend ? (
            <LevelTip
              title="Legend"
              description={legend.description}
              xpRequired={legend.xpRequired}
              current={legend.id === currentLevelId}
              reached={currentIndex >= levels.findIndex((row) => row.id === legend.id)}
              tip="below"
              className="rounded-2xl bg-off-white px-5 py-6 text-center"
            >
              <p className="font-display text-4xl tracking-wide text-charcoal">
                <span className="text-orange">{OFFICIAL_RANK.Legend}</span> LEGEND
              </p>
              <p className="mt-1 font-body text-[11px] font-semibold uppercase tracking-[0.2em] text-orange">
                Peak creator achievement
              </p>
            </LevelTip>
          ) : null}

          <p className="mt-7 font-body text-[11px] font-semibold uppercase tracking-[0.28em] text-orange">
            Rank ladder
          </p>
          <div className="mt-3 flex w-full flex-col gap-2">
            {[...ranks].reverse().map((level) => {
              const index = levels.findIndex((row) => row.id === level.id);
              const number = OFFICIAL_RANK[level.name] ?? index + 1;
              return (
                <LevelTip
                  key={level.id}
                  title={level.name}
                  description={level.description}
                  xpRequired={level.xpRequired}
                  current={level.id === currentLevelId}
                  reached={currentIndex >= index}
                  className="flex items-center gap-3 rounded-xl bg-off-white px-2 py-1.5"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-orange font-display text-lg text-off-white">
                    {number}
                  </span>
                  <p className="font-body text-sm font-semibold uppercase tracking-wide text-charcoal">
                    {level.name}
                  </p>
                </LevelTip>
              );
            })}
          </div>

          <p className="mt-8 font-body text-[11px] font-semibold uppercase tracking-[0.28em] text-orange">
            Specializations
          </p>
          <div className="mt-4 grid w-full grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-4 lg:grid-cols-7">
            {options.map((track) => {
              const locked = !specialty.unlocked;
              return (
                <LevelTip
                  key={track.name}
                  title={track.name}
                  description={track.description}
                  items={track.focuses}
                  current={track.chosen}
                  reached={!locked}
                  className="flex flex-col items-center rounded-2xl px-1 py-2 text-center"
                >
                  <span
                    className={`flex h-14 w-14 items-center justify-center rounded-full border-2 border-orange ${
                      track.chosen ? "bg-orange text-off-white" : "bg-transparent text-off-white"
                    }`}
                  >
                    <SpecialtyIcon name={track.name} className="h-7 w-7" />
                  </span>
                  <p className="mt-2 font-body text-[10px] font-semibold uppercase leading-tight tracking-wide text-off-white">
                    {track.name}
                  </p>
                  <div className="mt-2 min-h-[28px]">
                    {track.chosen ? (
                      <span className="font-body text-[10px] uppercase tracking-wide text-orange">Chosen</span>
                    ) : !locked && track.missionId ? (
                      <ChooseSpecialtyButton missionId={track.missionId} compact />
                    ) : null}
                  </div>
                </LevelTip>
              );
            })}
          </div>
          {specialty.unlocked && specialty.chosenTracks.length > 0 ? (
            <div className="mt-5 flex flex-col items-center gap-2">
              <ResetSpecialtyButton currentTrack={formatSpecialtyTracks(specialty.chosenTracks)} />
              <p className="font-body text-[11px] text-off-white/45">
                Choose more specialties anytime, or reset to start over.
              </p>
            </div>
          ) : null}

          <div className="h-8 w-px bg-orange" aria-hidden />

          {rising ? (
            <LevelTip
              title="Rising Star"
              description={rising.description}
              xpRequired={rising.xpRequired}
              current={rising.id === currentLevelId}
              reached={currentIndex >= branchIndex}
              className="rounded-2xl border-2 border-orange bg-off-white px-5 py-5 text-center"
            >
              <p className="font-display text-3xl tracking-wide text-charcoal">RISING STAR</p>
              <p className="mt-1 font-body text-[11px] font-semibold uppercase tracking-[0.18em] text-orange">
                Specialization unlocked
              </p>
              <p className="mt-2 font-body text-xs text-charcoal/70">
                {specialty.unlocked
                  ? specialty.chosenTracks.length > 0
                    ? `You’re on ${formatSpecialtyTracks(specialty.chosenTracks)}. Add more specialties anytime.`
                    : "Pick as many specialties as you want. You can add more later or reset."
                  : `Reach ${specialty.unlocksAt || "Rising Star"} to choose a track.`}
              </p>
            </LevelTip>
          ) : null}

          <div className="mt-5 flex w-full max-w-sm flex-col gap-2">
            {[...early].reverse().map((level) => {
              const index = levels.findIndex((row) => row.id === level.id);
              const Icon = level.name === "Newcomer" ? IconChevronUp : IconRecruit;
              return (
                <LevelTip
                  key={level.id}
                  title={level.name}
                  description={level.description}
                  xpRequired={level.xpRequired}
                  current={level.id === currentLevelId}
                  reached={currentIndex >= index}
                  className="flex items-center gap-3 rounded-xl bg-off-white px-3 py-2"
                >
                  <span className="flex h-8 w-8 items-center justify-center text-orange">
                    <Icon className="h-5 w-5" />
                  </span>
                  <p className="font-body text-sm font-semibold uppercase tracking-wide text-charcoal">
                    {level.name}
                  </p>
                </LevelTip>
              );
            })}
          </div>

          <span className="mt-5 flex h-12 w-12 items-center justify-center rounded-full border-2 border-orange text-orange">
            <IconPerson className="h-6 w-6" />
          </span>
          <LevelTip
            title="Live Host"
            description={LIVE_HOST_TIP}
            current={currentIndex < 0}
            reached
            className="mt-3 max-w-sm rounded-2xl bg-[#111] px-6 py-4 text-center"
          >
            <p className="font-display text-2xl tracking-wide text-off-white">LIVE HOST</p>
            <p className="mt-1 font-body text-[11px] font-semibold uppercase tracking-[0.18em] text-orange">
              Universal start
            </p>
          </LevelTip>
        </div>
      </div>
    </section>
  );
}
