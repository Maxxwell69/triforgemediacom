import Link from "next/link";
import { calendarKindNeedsFeatured, calendarKindNeedsOpponent } from "@/lib/calendarEventTypes";

type ProfileRef = { id: string; label: string };

export default function CalendarEventProfiles({
  kind,
  featured,
  opponent,
  className = "font-body text-sm text-off-white/70",
}: {
  kind: string;
  featured: ProfileRef | null;
  opponent: ProfileRef | null;
  className?: string;
}) {
  if (kind === "INTERVIEW" && featured) {
    return (
      <p className={className}>
        Interviewing{" "}
        <Link href={`/members/${featured.id}`} className="font-semibold text-cyan hover:underline">
          {featured.label}
        </Link>
      </p>
    );
  }

  if (kind === "BATTLE" && (featured || opponent)) {
    return (
      <p className={className}>
        {featured ? (
          <Link href={`/members/${featured.id}`} className="font-semibold text-cyan hover:underline">
            {featured.label}
          </Link>
        ) : (
          "TBD"
        )}
        <span className="mx-1.5 text-off-white/40">vs</span>
        {opponent ? (
          <Link href={`/members/${opponent.id}`} className="font-semibold text-cyan hover:underline">
            {opponent.label}
          </Link>
        ) : (
          "TBD"
        )}
      </p>
    );
  }

  if (kind === "SHOP_EVENT" && featured) {
    return (
      <p className={className}>
        Featured{" "}
        <Link href={`/members/${featured.id}`} className="font-semibold text-cyan hover:underline">
          {featured.label}
        </Link>
      </p>
    );
  }

  if (!calendarKindNeedsFeatured(kind) && !calendarKindNeedsOpponent(kind)) {
    return null;
  }
  return null;
}
