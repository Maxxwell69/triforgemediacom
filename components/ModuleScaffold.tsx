type Props = {
  title: string;
  accent: string;
  summary: string;
  phaseNote: string;
  bullets?: string[];
};

/** Shared “Phase A” placeholder surface for new hub modules. */
export default function ModuleScaffold({
  title,
  accent,
  summary,
  phaseNote,
  bullets = [],
}: Props) {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-5xl tracking-wide">
        {title} <span className="text-gradient">{accent}</span>
      </h1>
      <p className="mt-2 font-body text-off-white/60">{summary}</p>

      <div className="glass mt-8 rounded-2xl p-6">
        <p className="font-body text-sm font-semibold text-cyan">{phaseNote}</p>
        {bullets.length > 0 && (
          <ul className="mt-4 list-disc space-y-2 pl-5 font-body text-sm text-off-white/70">
            {bullets.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
