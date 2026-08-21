import { requireProfile } from "@/lib/session";
import {
  addDays,
  listCalendarFilterGroups,
  listEventCreatableGroups,
  listVisibleCalendarEvents,
  startOfDay,
} from "@/lib/calendar";
import EventsCalendar from "@/components/calendar/EventsCalendar";
import CreateGroupEventForm from "@/components/calendar/CreateGroupEventForm";

export const dynamic = "force-dynamic";

const LEGEND = [
  { label: "Webinar", className: "bg-cyan/20 text-cyan border-cyan/35" },
  { label: "Live", className: "bg-orange/20 text-orange border-orange/35" },
  { label: "Meeting", className: "bg-[#3B82F6]/15 text-[#93C5FD] border-[#3B82F6]/35" },
  { label: "Event", className: "bg-cyan/10 text-off-white/80 border-cyan/25" },
] as const;

export default async function CalendarPage() {
  const { user } = await requireProfile();

  const from = startOfDay(addDays(new Date(), -45));
  const to = addDays(from, 120);
  const [events, filterGroups, creatableGroups] = await Promise.all([
    listVisibleCalendarEvents(user.id, user.role, from, to),
    listCalendarFilterGroups(user.id, user.role),
    listEventCreatableGroups(user.id, user.role),
  ]);

  return (
    <main className="relative flex-1 overflow-hidden px-4 py-10 sm:px-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(ellipse_at_20%_0%,rgba(253,72,2,0.16),transparent_55%),radial-gradient(ellipse_at_80%_10%,rgba(0,212,255,0.12),transparent_50%)]"
      />

      <div className="relative mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-5xl tracking-wide sm:text-6xl">
              HUB <span className="text-gradient">CALENDAR</span>
            </h1>
            <p className="mt-2 max-w-xl font-body text-off-white/60">
              Hub calendar for everyone — open a day, click an event for details, or post a new
              event. Webinars show here automatically.
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 sm:items-end">
            <ul className="flex flex-wrap gap-1.5">
              {LEGEND.map((item) => (
                <li
                  key={item.label}
                  className={`rounded-md border px-2 py-0.5 font-body text-[11px] font-semibold ${item.className}`}
                >
                  {item.label}
                </li>
              ))}
            </ul>
            <CreateGroupEventForm
              groups={creatableGroups.map((g) => ({
                id: g.id,
                name: g.name,
                color: g.color,
              }))}
            />
          </div>
        </div>

        <div className="mt-8">
          <EventsCalendar
            filterGroups={filterGroups.map((g) => ({
              id: g.id,
              name: g.name,
              color: g.color,
              isHome: g.isHome,
            }))}
            events={events.map((e) => ({
              id: e.id,
              title: e.title,
              kind: e.kind,
              startsAt: e.startsAt.toISOString(),
              endsAt: e.endsAt?.toISOString() ?? null,
              location: e.location,
              description: e.description,
              webinarId: e.webinarId,
              hostLabel: e.createdBy.name || e.createdBy.email,
              groupId: e.groupId,
              groupName: e.group?.name ?? null,
              groupColor: e.group?.color ?? null,
            }))}
          />
        </div>
      </div>
    </main>
  );
}
