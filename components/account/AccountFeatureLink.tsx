import Link from "next/link";

type Props = {
  href: string;
  title: string;
  description: string;
  accent?: "orange" | "cyan";
};

export default function AccountFeatureLink({
  href,
  title,
  description,
  accent = "cyan",
}: Props) {
  const border =
    accent === "orange"
      ? "hover:border-orange/40 hover:bg-orange/5"
      : "hover:border-cyan/40 hover:bg-cyan/5";
  const titleColor = accent === "orange" ? "group-hover:text-orange" : "group-hover:text-cyan";

  return (
    <Link
      href={href}
      className={`group glass flex flex-col rounded-xl p-4 transition ${border}`}
    >
      <span
        className={`font-display text-lg tracking-wide text-off-white transition ${titleColor}`}
      >
        {title}
      </span>
      <span className="mt-1 font-body text-xs text-off-white/45">{description}</span>
      <span className="mt-3 font-body text-xs text-off-white/35 transition group-hover:text-off-white/60">
        Open →
      </span>
    </Link>
  );
}
