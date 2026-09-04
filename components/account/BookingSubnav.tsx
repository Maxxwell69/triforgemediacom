import Link from "next/link";

type Tab = "setup" | "meetings";

const TABS: { id: Tab; href: string; label: string }[] = [
  { id: "setup", href: "/account/booking", label: "Setup" },
  { id: "meetings", href: "/account/booking/meetings", label: "Active meetings" },
];

export default function BookingSubnav({
  active,
  upcomingCount,
}: {
  active: Tab;
  upcomingCount?: number;
}) {
  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {TABS.map((tab) => {
        const isActive = tab.id === active;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={[
              "rounded-lg border px-3 py-1.5 font-body text-sm transition",
              isActive
                ? "border-orange/50 bg-orange/15 text-orange"
                : "border-off-white/15 text-off-white/65 hover:border-off-white/30 hover:text-off-white",
            ].join(" ")}
          >
            {tab.label}
            {tab.id === "meetings" && upcomingCount != null && upcomingCount > 0 ? (
              <span className="ml-2 rounded-full bg-orange/20 px-1.5 py-0.5 text-[11px] text-orange">
                {upcomingCount}
              </span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
