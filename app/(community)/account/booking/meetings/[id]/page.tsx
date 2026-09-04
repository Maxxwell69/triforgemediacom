import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { isAdminRole } from "@/lib/rbac";
import { listOpenSlotsForPage } from "@/lib/booking";
import {
  appointmentDurationMins,
  appointmentManageInclude,
  appointmentMeetingTitle,
  appointmentRoomUrls,
  meetingStillActionable,
} from "@/lib/bookingMeetings";
import AccountPageShell from "@/components/account/AccountPageShell";
import BookingSubnav from "@/components/account/BookingSubnav";
import HostMeetingDetail from "@/components/account/HostMeetingDetail";

export default async function AccountBookingMeetingDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { user } = await requireProfile();
  if (!isAdminRole(user.role)) {
    redirect("/account");
  }

  const meeting = await prisma.appointment.findFirst({
    where: { id: params.id, hostUserId: user.id },
    include: appointmentManageInclude,
  });
  if (!meeting || meeting.status !== "CONFIRMED") notFound();

  const upcomingCount = await prisma.appointment.count({
    where: {
      hostUserId: user.id,
      status: "CONFIRMED",
      endsAt: { gte: new Date() },
    },
  });

  const durationMins = appointmentDurationMins(meeting);
  const notStarted = meeting.startsAt.getTime() > Date.now();
  const canCancel = meetingStillActionable(meeting.startsAt);
  const rooms = appointmentRoomUrls(meeting);

  const slots = notStarted
    ? await listOpenSlotsForPage(meeting.bookingPage, new Date(), durationMins, {
        excludeAppointmentId: meeting.id,
        excludeWebinarId: meeting.webinarId ?? undefined,
      })
    : [];

  return (
    <AccountPageShell
      crumbs={[
        { label: "Booking", href: "/account/booking" },
        { label: "Active meetings", href: "/account/booking/meetings" },
        { label: meeting.bookerName },
      ]}
      title={
        <>
          <span className="text-gradient">MEETING</span>
        </>
      }
      description="Cancel, remind, or move this booking. Changes email both people and update the calendar."
    >
      <BookingSubnav active="meetings" upcomingCount={upcomingCount} />
      <HostMeetingDetail
        meeting={{
          id: meeting.id,
          title: appointmentMeetingTitle(meeting),
          bookerName: meeting.bookerName,
          bookerEmail: meeting.bookerEmail,
          notes: meeting.notes,
          startsAt: meeting.startsAt.toISOString(),
          endsAt: meeting.endsAt.toISOString(),
          timezone: meeting.bookingPage.timezone,
          durationMins,
          hostRoomUrl: rooms.hostWebinarUrl,
          canRemind: notStarted,
          canReschedule: notStarted,
          canCancel,
        }}
        slots={slots}
      />
    </AccountPageShell>
  );
}
