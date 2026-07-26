import Link from "next/link";

type Accent = "cyan" | "orange";

const ACCENT_STYLES: Record<Accent, { border: string; iconBg: string }> = {
  cyan: {
    border: "hover:border-cyan/40 hover:shadow-glow-cyan",
    iconBg: "bg-cyan/10 text-cyan",
  },
  orange: {
    border: "hover:border-orange/40 hover:shadow-glow",
    iconBg: "bg-orange/10 text-orange",
  },
};

export default function DashboardCard({
  href,
  icon,
  title,
  description,
  stat,
  accent = "cyan",
}: {
  href: string;
  icon: string;
  title: string;
  description: string;
  stat?: string | null;
  accent?: Accent;
}) {
  const styles = ACCENT_STYLES[accent];

  return (
    <Link
      href={href}
      className={`glass flex flex-col gap-3 rounded-2xl p-5 transition ${styles.border}`}
    >
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl ${styles.iconBg}`}
      >
        <span aria-hidden="true">{icon}</span>
      </div>
      <div className="flex-1">
        <p className="font-display text-lg tracking-wide text-off-white">{title}</p>
        <p className="mt-1 font-body text-sm text-off-white/60">{description}</p>
      </div>
      {stat && (
        <p className="font-body text-xs font-semibold uppercase tracking-wide text-off-white/40">
          {stat}
        </p>
      )}
    </Link>
  );
}
