import { requireProfile } from "@/lib/session";
import {
  addDays,
  listVisibleCalendarEvents,
  startOfDay,
} from "@/lib/calendar";
import EventsCalendar from "@/components/calendar/EventsCalendar";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const { user } = await requireProfile();

  // Show a wide window so month navigation has data loaded.
  const from = startOfDay(addDays(new Date(), -45));
  const to = addDays(from, 120);
  const events = await listVisibleCalendarEvents(user.id, user.role, from, to);

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-5xl tracking-wide">
          HUB <span className="text-gradient">CALENDAR</span>
        </h1>
        <p className="mt-2 font-body text-off-white/60">
          Scheduled hub meetings, events, and webinars.
        </p>

        <div className="mt-8">
          <EventsCalendar
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
            }))}
          />
        </div>
      </div>
    </main>
  );
}
