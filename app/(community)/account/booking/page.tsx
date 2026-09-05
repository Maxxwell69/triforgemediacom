import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { isAdminRole } from "@/lib/rbac";
import { bookingPageUrl } from "@/lib/booking";
import { ensureBookingPage } from "@/app/(community)/account/bookingActions";
import BookingSchedulePanel from "@/components/account/BookingSchedulePanel";
import AccountPageShell from "@/components/account/AccountPageShell";
import BookingSubnav from "@/components/account/BookingSubnav";

export default async function AccountBookingPage() {
  const { user } = await requireProfile();
  if (!isAdminRole(user.role)) {
    redirect("/account");
  }

  let bookingPage = await prisma.bookingPage.findUnique({
    where: { hostUserId: user.id },
    include: {
      weeklyWindows: { orderBy: [{ dayOfWeek: "asc" }, { startMinute: "asc" }] },
      meetingTypes: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
      openSlots: { orderBy: { startsAt: "asc" } },
      dateOverrides: {
        orderBy: { localDate: "asc" },
        include: { windows: { orderBy: { startMinute: "asc" } } },
      },
    },
  });
  if (bookingPage && bookingPage.meetingTypes.length === 0) {
    await ensureBookingPage();
    bookingPage = await prisma.bookingPage.findUnique({
      where: { hostUserId: user.id },
      include: {
        weeklyWindows: { orderBy: [{ dayOfWeek: "asc" }, { startMinute: "asc" }] },
        meetingTypes: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
        openSlots: { orderBy: { startsAt: "asc" } },
        dateOverrides: {
          orderBy: { localDate: "asc" },
          include: { windows: { orderBy: { startMinute: "asc" } } },
        },
      },
    });
  }

  const upcomingCount = await prisma.appointment.count({
    where: {
      hostUserId: user.id,
      status: "CONFIRMED",
      endsAt: { gte: new Date() },
    },
  });

  return (
    <AccountPageShell
      crumbs={[{ label: "Booking" }]}
      title={
        <>
          <span className="text-gradient">BOOKING</span>
        </>
      }
      description="Share a link so people can schedule time with you. Use date exceptions for a day off or different hours without changing the weekly schedule."
    >
      <BookingSubnav active="setup" upcomingCount={upcomingCount} />
      <BookingSchedulePanel
        page={
          bookingPage
            ? {
                id: bookingPage.id,
                slug: bookingPage.slug,
                title: bookingPage.title,
                description: bookingPage.description,
                timezone: bookingPage.timezone,
                durationMins: bookingPage.durationMins,
                bufferMins: bookingPage.bufferMins,
                aheadDays: bookingPage.aheadDays,
                isActive: bookingPage.isActive,
                remindHourBefore: bookingPage.remindHourBefore,
                bookingUrl: bookingPageUrl(bookingPage.slug),
                weeklyWindows: bookingPage.weeklyWindows.map((w) => ({
                  dayOfWeek: w.dayOfWeek,
                  startMinute: w.startMinute,
                  endMinute: w.endMinute,
                })),
                meetingTypes: bookingPage.meetingTypes.map((t) => ({
                  id: t.id,
                  title: t.title,
                  description: t.description,
                  durationMins: t.durationMins,
                  isActive: t.isActive,
                })),
                openSlots: bookingPage.openSlots.map((s) => ({
                  id: s.id,
                  startsAt: s.startsAt.toISOString(),
                  endsAt: s.endsAt.toISOString(),
                  label: s.label,
                })),
                dateOverrides: bookingPage.dateOverrides.map((o) => ({
                  id: o.id,
                  localDate: o.localDate,
                  kind: o.kind,
                  note: o.note,
                  windows: o.windows.map((w) => ({
                    startMinute: w.startMinute,
                    endMinute: w.endMinute,
                  })),
                })),
              }
            : null
        }
      />
    </AccountPageShell>
  );
}
