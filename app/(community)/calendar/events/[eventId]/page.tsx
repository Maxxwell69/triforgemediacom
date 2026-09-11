import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { canViewEvent } from "@/lib/calendar";
import LocalWhen from "@/components/LocalWhen";
import { getUserGroupIds } from "@/lib/groups";
import RsvpButton from "@/components/calendar/RsvpButton";
import CalendarEventProfiles from "@/components/calendar/CalendarEventProfiles";
import CalendarEventPhotoForm from "@/components/calendar/CalendarEventPhotoForm";
import EventLocation from "@/components/calendar/EventLocation";
import { calendarKindLabel } from "@/lib/calendarEventTypes";
import { calendarMemberLabel } from "@/lib/calendar";
import { isAdminRole } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export default async function CalendarEventPage({
  params,
}: {
  params: { eventId: string };
}) {
  const { user } = await requireProfile();
  const userGroupIds = await getUserGroupIds(user.id);

  const event = await prisma.calendarEvent.findUnique({
    where: { id: params.eventId },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      group: { select: { id: true, name: true, color: true } },
      webinar: { select: { id: true, status: true } },
      attendees: { select: { userId: true } },
      featuredUser: {
        select: {
          id: true,
          name: true,
          email: true,
          profile: { select: { username: true, socialLinks: true } },
        },
      },
      opponentUser: {
        select: {
          id: true,
          name: true,
          email: true,
          profile: { select: { username: true, socialLinks: true } },
        },
      },
      _count: { select: { attendees: true } },
    },
  });

  if (!event || !canViewEvent(event, user.id, user.role, userGroupIds)) {
    notFound();
  }

  const alreadyRsvpd = event.attendees.some((a) => a.userId === user.id);
  const canEditPhoto =
    !event.webinarId && (event.createdById === user.id || isAdminRole(user.role));

  return (
    <main className="relative flex-1 overflow-hidden px-4 py-10 sm:px-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[22rem] bg-[radial-gradient(ellipse_at_20%_0%,rgba(253,72,2,0.14),transparent_55%),radial-gradient(ellipse_at_80%_10%,rgba(0,212,255,0.1),transparent_50%)]"
      />
      <div className="relative mx-auto max-w-2xl">
        <Link
          href="/calendar"
          className="font-body text-sm text-off-white/50 transition hover:text-off-white"
        >
          &larr; Back to calendar
        </Link>

        <div className="glass mt-4 overflow-hidden rounded-2xl">
          {event.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={event.imageUrl}
              alt=""
              className="h-52 w-full object-cover sm:h-64"
            />
          ) : (
            <div
              className="h-1.5 w-full"
              style={{ backgroundColor: event.group?.color || "#FD4802" }}
            />
          )}
          <div className="p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md border border-cyan/35 bg-cyan/10 px-2 py-0.5 font-body text-[11px] font-semibold uppercase tracking-wide text-cyan">
                {calendarKindLabel(event.kind)}
              </span>
              {event.group && (
                <span className="rounded-md border border-off-white/15 px-2 py-0.5 font-body text-[11px] text-off-white/60">
                  {event.group.name}
                </span>
              )}
              <span className="rounded-md border border-off-white/10 px-2 py-0.5 font-body text-[11px] text-off-white/40">
                {event.visibility}
              </span>
            </div>

            <h1 className="mt-4 font-display text-4xl tracking-wide text-off-white sm:text-5xl">
              {event.title}
            </h1>

            <p className="mt-3 font-body text-sm text-off-white/65">
              <LocalWhen
                startsAt={event.startsAt.toISOString()}
                endsAt={event.endsAt ? event.endsAt.toISOString() : null}
              />
            </p>
            {event.location && <EventLocation location={event.location} />}
            <p className="mt-1 font-body text-xs text-off-white/40">
              Hosted by {event.createdBy.name || event.createdBy.email}
              {" · "}
              {event._count.attendees} RSVP{event._count.attendees === 1 ? "" : "s"}
            </p>

            <div className="mt-6">
              <CalendarEventProfiles
                kind={event.kind}
                featured={
                  event.featuredUser
                    ? { id: event.featuredUser.id, label: calendarMemberLabel(event.featuredUser) }
                    : null
                }
                opponent={
                  event.opponentUser
                    ? { id: event.opponentUser.id, label: calendarMemberLabel(event.opponentUser) }
                    : null
                }
              />
            </div>

            {event.description && (
              <p className="mt-6 whitespace-pre-wrap font-body text-sm leading-relaxed text-off-white/70">
                {event.description}
              </p>
            )}

            <div className="mt-8 flex flex-wrap items-center gap-3">
              {event.webinarId ? (
                <Link
                  href={`/webinars/${event.webinarId}/room`}
                  className="rounded-lg bg-cyan/90 px-4 py-2 font-body text-sm font-semibold text-charcoal transition hover:brightness-110"
                >
                  Open meeting room
                </Link>
              ) : alreadyRsvpd ? (
                <span className="rounded-lg border border-cyan/35 bg-cyan/10 px-4 py-2 font-body text-sm font-semibold text-cyan">
                  You&apos;re going
                </span>
              ) : (
                <RsvpButton eventId={event.id} />
              )}
              <Link
                href="/calendar"
                className="rounded-lg border border-off-white/15 px-4 py-2 font-body text-sm text-off-white/70 transition hover:border-cyan/40 hover:text-cyan"
              >
                Calendar
              </Link>
            </div>

            {canEditPhoto && (
              <CalendarEventPhotoForm eventId={event.id} imageUrl={event.imageUrl} />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
