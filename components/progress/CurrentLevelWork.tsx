import Link from "next/link";

type TrainingLink = {
  id: string;
  title: string;
  href: string;
  done: boolean;
};

export default function CurrentLevelWork({
  currentName,
  currentDescription,
  nextName,
  xpHave,
  xpNeed,
  requirements,
  training,
}: {
  currentName: string;
  currentDescription: string | null;
  nextName: string | null;
  xpHave: number;
  xpNeed: number | null;
  requirements: { id: string; label: string; done: boolean }[];
  training: TrainingLink[];
}) {
  const xpLeft = xpNeed == null ? null : Math.max(0, xpNeed - xpHave);

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
        <p className="mt-5 font-display text-xl text-off-white/80">Training to reach {nextName}</p>
      ) : (
        <p className="mt-5 font-body text-sm text-cyan">You are at the top of the ladder.</p>
      )}

      {nextName && xpNeed != null ? (
        <p className="mt-2 font-body text-sm text-off-white/70">
          {xpLeft === 0 ? (
            <>
              {xpHave.toLocaleString()} / {xpNeed.toLocaleString()} XP
            </>
          ) : (
            <>
              {xpLeft.toLocaleString()} XP to go
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
              className={`font-body text-sm ${item.done ? "text-cyan" : "text-off-white/80"}`}
            >
              {item.done ? "✓" : "○"} {item.label}
            </li>
          ))}
        </ul>
      ) : null}

      <h3 className="mt-6 font-display text-lg text-off-white/80">Training</h3>
      {training.length === 0 ? (
        <p className="mt-2 font-body text-sm text-off-white/40">
          No learning modules are attached to this level yet.
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
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
