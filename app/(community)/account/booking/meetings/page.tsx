import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { isAdminRole } from "@/lib/rbac";
import { appointmentMeetingTitle } from "@/lib/bookingMeetings";
import AccountPageShell from "@/components/account/AccountPageShell";
import BookingSubnav from "@/components/account/BookingSubnav";

export default async function AccountBookingMeetingsPage() {
  const { user } = await requireProfile();
  if (!isAdminRole(user.role)) {
    redirect("/account");
  }

  const now = new Date();
  const meetings = await prisma.appointment.findMany({
    where: {
      hostUserId: user.id,
      status: "CONFIRMED",
      endsAt: { gte: now },
    },
    include: {
      meetingType: { select: { title: true } },
      bookingPage: { select: { title: true, timezone: true } },
    },
    orderBy: { startsAt: "asc" },
  });

  return (
    <AccountPageShell
      crumbs={[{ label: "Booking", href: "/account/booking" }, { label: "Active meetings" }]}
      title={
        <>
          ACTIVE <span className="text-gradient">MEETINGS</span>
        </>
      }
      description="Upcoming bookings from your public link. Open one to cancel, send a reminder, or move it."
    >
      <BookingSubnav active="meetings" upcomingCount={meetings.length} />
      {meetings.length === 0 ? (
        <div className="glass rounded-2xl p-6">
          <p className="font-body text-sm text-off-white/65">
            No active meetings right now. Share your booking link from Setup when you want people
            to schedule time.
          </p>
          <Link
            href="/account/booking"
            className="mt-4 inline-block rounded-lg bg-orange px-4 py-2 font-body text-sm font-semibold text-off-white shadow-glow"
          >
            Open booking setup
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {meetings.map((meeting) => {
            const inProgress = meeting.startsAt.getTime() <= now.getTime();
            const when = new Intl.DateTimeFormat("en-US", {
              timeZone: meeting.bookingPage.timezone,
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            }).format(meeting.startsAt);
            return (
              <li key={meeting.id}>
                <Link
                  href={`/account/booking/meetings/${meeting.id}`}
                  className="glass flex items-center justify-between gap-4 rounded-2xl p-4 transition hover:border-cyan/30"
                >
                  <div>
                    <p className="font-body text-sm font-medium text-off-white">
                      {meeting.bookerName}
                    </p>
                    <p className="mt-0.5 font-body text-xs text-off-white/50">
                      {appointmentMeetingTitle(meeting)} · {when}
                    </p>
                  </div>
                  <span className="shrink-0 font-body text-xs text-cyan">
                    {inProgress ? "In progress" : "Open"}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </AccountPageShell>
  );
}
