import { calendarLocationHref } from "@/lib/calendarEventTypes";

export default function EventLocation({
  location,
  className = "mt-1 font-body text-sm text-off-white/50",
}: {
  location: string;
  className?: string;
}) {
  const href = calendarLocationHref(location);
  if (!href) {
    return <p className={className}>{location}</p>;
  }
  return (
    <p className={className}>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-cyan transition hover:underline"
      >
        {location}
      </a>
    </p>
  );
}
