import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { defaultCalendarWindow, formatCalendarWhen } from "@/lib/calendar";
import { createAdminCalendarEvent } from "./actions";
import DeleteCalendarEventButton from "@/components/admin/DeleteCalendarEventButton";

export const dynamic = "force-dynamic";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white outline-none transition focus:border-cyan/60";

export default async function AdminEventsPage() {
  const { from, to } = defaultCalendarWindow(90);

  const [events, groups] = await Promise.all([
    prisma.calendarEvent.findMany({
      where: { startsAt: { gte: from, lt: to } },
      orderBy: { startsAt: "asc" },
      include: {
        createdBy: { select: { name: true, email: true } },
        webinar: { select: { id: true, status: true } },
        group: { select: { name: true } },
        _count: { select: { attendees: true } },
      },
    }),
    prisma.group.findMany({
      orderBy: [{ isHome: "desc" }, { name: "asc" }],
      select: { id: true, name: true },
    }),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-5xl tracking-wide">
        HUB <span className="text-gradient">EVENTS</span>
      </h1>
      <p className="mt-2 font-body text-off-white/60">
        Schedule meetings and hub events for the member calendar. Mass webinars from{" "}
        <Link href="/admin/webinars" className="text-cyan hover:underline">
          Admin → Webinars
        </Link>{" "}
        sync here automatically. Set your personal availability on{" "}
        <Link href="/account" className="text-cyan hover:underline">
          Account
        </Link>
        .
      </p>

      <form
        action={createAdminCalendarEvent}
        className="glass mt-8 flex flex-col gap-3 rounded-2xl p-6"
      >
        <h2 className="font-display text-xl tracking-wide text-off-white/80">New event</h2>
        <input name="title" required placeholder="Title" className={fieldClass} />
        <textarea
          name="description"
          rows={2}
          placeholder="Optional description"
          className={fieldClass}
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <select name="kind" defaultValue="MEETING" className={fieldClass}>
            <option value="MEETING">Meeting</option>
            <option value="EVENT">Event</option>
            <option value="LIVE">Live</option>
            <option value="OTHER">Other</option>
          </select>
          <select name="visibility" defaultValue="HUB" className={fieldClass}>
            <option value="HUB">All hub members</option>
            <option value="GROUP">Group only</option>
            <option value="PRIVATE">Private (staff only)</option>
          </select>
        </div>
        <select name="groupId" defaultValue="" className={fieldClass}>
          <option value="">No group</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        <input name="location" placeholder="Location / link (optional)" className={fieldClass} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input name="startsAt" type="datetime-local" required className={fieldClass} />
          <input name="endsAt" type="datetime-local" className={fieldClass} />
        </div>
        <button
          type="submit"
          className="self-start rounded-lg bg-orange px-6 py-2 font-body font-semibold text-off-white shadow-glow"
        >
          Schedule event
        </button>
      </form>

      <section className="mt-10">
        <h2 className="font-display text-2xl tracking-wide text-off-white/80">
          Upcoming ({events.length})
        </h2>
        <div className="mt-4 flex flex-col gap-2">
          {events.length === 0 && (
            <p className="glass rounded-xl p-6 text-center font-body text-sm text-off-white/40">
              No events in this window.
            </p>
          )}
          {events.map((event) => (
            <div
              key={event.id}
              className="glass flex flex-col gap-2 rounded-xl p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="font-body text-sm font-medium text-off-white">
                  <span className="mr-2 text-xs text-cyan">{event.kind}</span>
                  {event.title}
                  {event.webinarId && (
                    <span className="ml-2 text-xs text-off-white/40">(webinar sync)</span>
                  )}
                </p>
                <p className="font-body text-xs text-off-white/40">
                  {formatCalendarWhen(event.startsAt, event.endsAt)} · {event.visibility}
                  {event.group ? ` · ${event.group.name}` : ""}
                  {" · "}
                  {event._count.attendees} attendees
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                {event.webinarId ? (
                  <Link
                    href="/admin/webinars"
                    className="rounded-lg border border-cyan/40 px-3 py-1 font-body text-xs text-cyan"
                  >
                    Webinars
                  </Link>
                ) : (
                  <DeleteCalendarEventButton eventId={event.id} />
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
