import ChooseSpecialtyButton from "@/components/progress/ChooseSpecialtyButton";
import { SPECIALTY_TRACKS, SPECIALTY_UNLOCK_LEVEL } from "@/lib/progression/tracks";

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

function TrackGlyph({ name, className }: { name: string; className?: string }) {
  const common = className ?? "h-5 w-5";
  if (name === "Gamer") {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="8" width="18" height="10" rx="4" />
        <path d="M8 13h2M9 12v2M16 12.5h.01M18 14.5h.01" />
      </svg>
    );
  }
  if (name === "Shop Owner") {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M6 8h12l-1 12H7L6 8Z" />
        <path d="M9 8V7a3 3 0 0 1 6 0v1" />
      </svg>
    );
  }
  if (name === "Musician") {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M9 18V6l10-2v12" />
        <circle cx="7" cy="18" r="2.5" />
        <circle cx="17" cy="16" r="2.5" />
      </svg>
    );
  }
  if (name === "Artist") {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 20l6-1 10-10a3 3 0 0 0-4-4L6 15l-2 5Z" />
      </svg>
    );
  }
  if (name === "Educator") {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 7l8-3 8 3-8 3-8-3Z" />
        <path d="M6 10v5c2 2 10 2 12 0v-5" />
      </svg>
    );
  }
  if (name === "Community Builder") {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="9" cy="8" r="2.5" />
        <circle cx="16" cy="9" r="2" />
        <path d="M4 18c1-3 3.5-4.5 5-4.5S13 15 14 18M14 18c.5-2 2-3.5 3.5-3.5S21 16 21 18" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 19v-6h4v6M10 19V8h4v11M15 19v-9h4v9" />
    </svg>
  );
}

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
    options: SpecialtyOption[];
  };
}) {
  const currentIndex = levels.findIndex((level) => level.id === currentLevelId);
  const foundRising = levels.findIndex((level) => level.name === SPECIALTY_UNLOCK_LEVEL);
  const branchIndex = foundRising >= 0 ? foundRising : 2;
  const early = levels.slice(0, branchIndex);
  const rising = levels[branchIndex];
  const advanced = levels.slice(branchIndex + 1);
  const options = SPECIALTY_TRACKS.map((track) => {
    const option = specialty.options.find((row) => row.track === track.name);
    return { ...track, missionId: option?.missionId ?? null, chosen: option?.chosen ?? false };
  });

  return (
    <section className="mt-8">
      <h2 className="font-display text-2xl text-off-white/80">Creator ladder</h2>
      <p className="mt-2 font-body text-sm text-off-white/55">
        Live Host start → Recruit → Newcomer → Rising Star unlocks specialization → Regular through Legend on your
        chosen track.
      </p>

      <div className="relative mt-6 overflow-hidden rounded-3xl border border-orange/25 bg-deep-blue px-4 py-8 sm:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(253,72,2,0.12),_transparent_55%)]" />
        <div className="relative mx-auto flex max-w-4xl flex-col items-center gap-4">
          {[...advanced].reverse().map((level) => {
            const index = levels.findIndex((row) => row.id === level.id);
            const number = index + 1;
            const reached = currentIndex >= index;
            const current = level.id === currentLevelId;
            return (
              <div
                key={level.id}
                className={`flex w-full items-center gap-3 rounded-full border px-4 py-2.5 ${
                  current
                    ? "border-orange bg-orange/15"
                    : reached
                      ? "border-cyan/40 bg-cyan/10"
                      : "border-off-white/15 bg-off-white/5 opacity-50"
                }`}
              >
                <span className="font-display text-lg text-orange">{number}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-body text-sm font-semibold text-off-white">{level.name}</p>
                  {level.name === "Legend" ? (
                    <p className="font-body text-[11px] text-orange/80">Peak creator achievement</p>
                  ) : null}
                </div>
                {specialty.chosenTrack ? (
                  <span className="hidden font-body text-[11px] text-cyan sm:inline">{specialty.chosenTrack}</span>
                ) : null}
              </div>
            );
          })}

          <div className="mt-2 grid w-full grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            {options.map((track) => {
              const locked = !specialty.unlocked;
              const taken = !!specialty.chosenTrack && !track.chosen;
              const tone = track.accent === "orange" ? "text-orange border-orange/40" : "text-cyan border-cyan/40";
              return (
                <div
                  key={track.name}
                  className={`flex flex-col items-center rounded-2xl border bg-off-white/[0.04] px-2 py-3 text-center ${tone} ${
                    locked || taken ? "opacity-40" : ""
                  } ${track.chosen ? "bg-cyan/10" : ""}`}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-current">
                    <TrackGlyph name={track.name} />
                  </span>
                  <p className="mt-2 font-body text-[11px] font-semibold leading-tight text-off-white">{track.name}</p>
                  <div className="mt-2 min-h-[28px]">
                    {track.chosen ? (
                      <span className="font-body text-[10px] uppercase tracking-wide text-cyan">Chosen</span>
                    ) : locked ? (
                      <span className="font-body text-[10px] text-off-white/40">Rising Star</span>
                    ) : taken ? (
                      <span className="font-body text-[10px] text-off-white/40">—</span>
                    ) : track.missionId ? (
                      <ChooseSpecialtyButton missionId={track.missionId} />
                    ) : (
                      <span className="font-body text-[10px] text-off-white/40">Soon</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {rising ? (
            <div
              className={`w-full max-w-md rounded-2xl border-2 px-5 py-4 text-center ${
                currentIndex >= branchIndex
                  ? "border-orange bg-orange/10 shadow-glow"
                  : "border-orange/30 bg-off-white/5 opacity-60"
              }`}
            >
              <p className="font-display text-2xl tracking-wide text-orange">RISING STAR</p>
              <p className="mt-1 font-body text-xs uppercase tracking-[0.2em] text-orange/80">
                Specialization unlocked
              </p>
              <p className="mt-2 font-body text-xs text-off-white/55">
                {specialty.unlocked
                  ? specialty.chosenTrack
                    ? `You’re on ${specialty.chosenTrack}.`
                    : "Pick one specialty. It carries through Regular → Legend."
                  : `Reach ${specialty.unlocksAt || "Rising Star"} to choose a track.`}
              </p>
            </div>
          ) : null}

          {[...early].reverse().map((level) => {
            const index = levels.findIndex((row) => row.id === level.id);
            const reached = currentIndex >= index;
            const current = level.id === currentLevelId;
            return (
              <div
                key={level.id}
                className={`rounded-full border px-8 py-2 font-body text-sm font-semibold ${
                  current
                    ? "border-orange bg-orange/20 text-off-white"
                    : reached
                      ? "border-cyan/40 bg-cyan/10 text-off-white"
                      : "border-off-white/15 text-off-white/50"
                }`}
              >
                {level.name}
              </div>
            );
          })}

          <div className="mt-1 rounded-2xl border-2 border-orange/70 bg-orange/10 px-8 py-4 text-center">
            <p className="font-display text-xl tracking-wide text-orange">LIVE HOST</p>
            <p className="mt-1 font-body text-[11px] uppercase tracking-wide text-off-white/50">
              Universal start
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
