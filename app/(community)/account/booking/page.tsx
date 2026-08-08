import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { isAdminRole } from "@/lib/rbac";
import { bookingPageUrl } from "@/lib/booking";
import BookingSchedulePanel from "@/components/account/BookingSchedulePanel";
import AccountPageShell from "@/components/account/AccountPageShell";

export default async function AccountBookingPage() {
  const { user } = await requireProfile();
  if (!isAdminRole(user.role)) {
    redirect("/account");
  }

  const bookingPage = await prisma.bookingPage.findUnique({
    where: { hostUserId: user.id },
    include: {
      weeklyWindows: { orderBy: [{ dayOfWeek: "asc" }, { startMinute: "asc" }] },
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
      description="Share a link so people can schedule time with you."
    >
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
                bookingUrl: bookingPageUrl(bookingPage.slug),
                weeklyWindows: bookingPage.weeklyWindows.map((w) => ({
                  dayOfWeek: w.dayOfWeek,
                  startMinute: w.startMinute,
                  endMinute: w.endMinute,
                })),
              }
            : null
        }
      />
    </AccountPageShell>
  );
}
