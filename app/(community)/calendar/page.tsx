import Link from "next/link";
import { requireProfile } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  defaultCalendarWindow,
  formatCalendarWhen,
  listBookableAvailability,
  listLiveAvailability,
  listVisibleCalendarEvents,
} from "@/lib/calendar";
import { createAvailabilitySlot, createMemberCalendarEvent } from "./actions";
import BookSlotButton from "@/components/calendar/BookSlotButton";
import RsvpButton from "@/components/calendar/RsvpButton";
import BookingRespondButtons from "@/components/calendar/BookingRespondButtons";
import DeleteSlotButton from "@/components/calendar/DeleteSlotButton";
import CalendarForm from "@/components/calendar/CalendarForm";

export const dynamic = "force-dynamic";

const KIND_LABEL: Record<string, string> = {
  MEETING: "Meeting",
  EVENT: "Event",
  LIVE: "Live",
  WEBINAR: "Webinar",
  OTHER: "Other",
};

export default async function CalendarPage() {
  const { user } = await requireProfile();
  const { from, to } = defaultCalendarWindow(45);

  const [events, bookable, liveSlots, mySlots, myHostBookings, myBookings] =
    await Promise.all([
      listVisibleCalendarEvents(user.id, user.role, from, to),
      listBookableAvailability(from, to, user.id),
      listLiveAvailability(from, to),
      prisma.availabilitySlot.findMany({
        where: { userId: user.id, startsAt: { gte: from } },
        orderBy: { startsAt: "asc" },
        take: 30,
      }),
      prisma.calendarBooking.findMany({
        where: {
          hostId: user.id,
          status: "PENDING",
          startsAt: { gte: from },
        },
        orderBy: { startsAt: "asc" },
        include: {
          booker: { select: { name: true, email: true } },
          slot: { select: { label: true, kind: true } },
          event: { select: { title: true } },
        },
      }),
      prisma.calendarBooking.findMany({
        where: {
          bookerId: user.id,
          status: { in: ["PENDING", "CONFIRMED"] },
          startsAt: { gte: from },
        },
        orderBy: { startsAt: "asc" },
        include: {
          host: { select: { name: true, email: true } },
          event: { select: { title: true } },
          slot: { select: { label: true } },
        },
      }),
    ]);

  const rsvpedEventIds = new Set(
    myBookings.filter((b) => b.eventId).map((b) => b.eventId as string)
  );

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-5xl tracking-wide">
          HUB <span className="text-gradient">CALENDAR</span>
        </h1>
        <p className="mt-2 font-body text-off-white/60">
          Meetings, events, go-live times, availability, and booking. Mass webinars sync
          here automatically.
        </p>

        {myHostBookings.length > 0 && (
          <section className="mt-8">
            <h2 className="font-display text-2xl tracking-wide text-off-white/80">
              Booking requests
            </h2>
            <div className="mt-3 flex flex-col gap-2">
              {myHostBookings.map((b) => (
                <div
                  key={b.id}
                  className="glass flex flex-col gap-2 rounded-xl p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-body text-sm text-off-white">
                      {b.booker.name || b.booker.email}
                      {" · "}
                      {b.event?.title || b.slot?.label || "Availability"}
                    </p>
                    <p className="font-body text-xs text-off-white/40">
                      {formatCalendarWhen(b.startsAt, b.endsAt)}
                      {b.notes ? ` · ${b.notes}` : ""}
                    </p>
                  </div>
                  <BookingRespondButtons bookingId={b.id} mode="host" />
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mt-10">
          <h2 className="font-display text-2xl tracking-wide text-off-white/80">
            Upcoming
          </h2>
          <div className="mt-4 flex flex-col gap-2">
            {events.length === 0 && (
              <p className="glass rounded-xl p-6 text-center font-body text-sm text-off-white/40">
                Nothing scheduled in the next few weeks.
              </p>
            )}
            {events.map((event) => (
              <div
                key={event.id}
                className="glass flex flex-col gap-2 rounded-xl p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-body text-sm font-medium text-off-white">
                    <span className="mr-2 text-xs text-cyan">
                      {KIND_LABEL[event.kind] || event.kind}
                    </span>
                    {event.title}
                  </p>
                  <p className="font-body text-xs text-off-white/40">
                    {formatCalendarWhen(event.startsAt, event.endsAt)}
                    {event.location ? ` · ${event.location}` : ""}
                    {event.createdBy
                      ? ` · ${event.createdBy.name || event.createdBy.email}`
                      : ""}
                  </p>
                  {event.description && (
                    <p className="mt-1 font-body text-xs text-off-white/50">{event.description}</p>
                  )}
                </div>
                <div className="shrink-0">
                  {event.webinarId ? (
                    <Link
                      href={`/webinars/${event.webinarId}`}
                      className="rounded-lg border border-cyan/40 px-3 py-1 font-body text-xs font-semibold text-cyan"
                    >
                      Webinar →
                    </Link>
                  ) : event.createdById !== user.id && !rsvpedEventIds.has(event.id) ? (
                    <RsvpButton eventId={event.id} />
                  ) : rsvpedEventIds.has(event.id) ? (
                    <span className="font-body text-xs text-cyan">RSVP&apos;d</span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl tracking-wide text-off-white/80">
            Who&apos;s going live
          </h2>
          <div className="mt-4 flex flex-col gap-2">
            {liveSlots.length === 0 && (
              <p className="glass rounded-xl p-4 font-body text-sm text-off-white/40">
                No live windows posted yet.
              </p>
            )}
            {liveSlots.map((slot) => (
              <div key={slot.id} className="glass rounded-xl px-4 py-3">
                <p className="font-body text-sm text-off-white">
                  {slot.user.name || slot.user.email}
                  {slot.label ? ` — ${slot.label}` : ""}
                </p>
                <p className="font-body text-xs text-off-white/40">
                  {formatCalendarWhen(slot.startsAt, slot.endsAt)}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl tracking-wide text-off-white/80">
            Open for booking
          </h2>
          <div className="mt-4 flex flex-col gap-2">
            {bookable.length === 0 && (
              <p className="glass rounded-xl p-4 font-body text-sm text-off-white/40">
                No open booking slots right now.
              </p>
            )}
            {bookable.map((slot) => (
              <div
                key={slot.id}
                className="glass flex flex-col gap-2 rounded-xl p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-body text-sm text-off-white">
                    {slot.user.name || slot.user.email}
                    {slot.label ? ` — ${slot.label}` : ""}
                  </p>
                  <p className="font-body text-xs text-off-white/40">
                    {formatCalendarWhen(slot.startsAt, slot.endsAt)}
                  </p>
                </div>
                <BookSlotButton slotId={slot.id} />
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <CalendarForm
            mode="availability"
            action={createAvailabilitySlot}
            mySlots={mySlots.map((s) => ({
              id: s.id,
              kind: s.kind,
              label: s.label,
              startsAt: s.startsAt,
              endsAt: s.endsAt,
            }))}
          />
          <CalendarForm mode="event" action={createMemberCalendarEvent} />
        </section>

        {myBookings.length > 0 && (
          <section className="mt-10">
            <h2 className="font-display text-2xl tracking-wide text-off-white/80">
              Your bookings
            </h2>
            <div className="mt-4 flex flex-col gap-2">
              {myBookings.map((b) => (
                <div
                  key={b.id}
                  className="glass flex flex-col gap-2 rounded-xl p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-body text-sm text-off-white">
                      {b.event?.title || b.slot?.label || "Booking"} · {b.status}
                    </p>
                    <p className="font-body text-xs text-off-white/40">
                      {formatCalendarWhen(b.startsAt, b.endsAt)}
                      {b.host ? ` · with ${b.host.name || b.host.email}` : ""}
                    </p>
                  </div>
                  {b.status === "PENDING" && (
                    <BookingRespondButtons bookingId={b.id} mode="booker" />
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
