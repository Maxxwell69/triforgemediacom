import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Logo from "@/components/Logo";
import CancelBookingButton from "@/components/booking/CancelBookingButton";

export const dynamic = "force-dynamic";

export default async function CancelBookingPage({
  params,
}: {
  params: { token: string };
}) {
  const appointment = await prisma.appointment.findUnique({
    where: { cancelToken: params.token },
    include: {
      bookingPage: { select: { timezone: true, title: true } },
      meetingType: { select: { title: true } },
    },
  });
  if (!appointment) notFound();

  const title = appointment.meetingType?.title || appointment.bookingPage.title;
  const when = new Intl.DateTimeFormat("en-US", {
    timeZone: appointment.bookingPage.timezone,
    dateStyle: "full",
    timeStyle: "short",
  }).format(appointment.startsAt);
  const cancelled = appointment.status === "CANCELLED";

  return (
    <main className="min-h-screen bg-charcoal px-6 py-10">
      <div className="mx-auto max-w-lg">
        <Logo height={22} href="/" />
        <div className="glass mt-10 rounded-2xl p-8">
          <h1 className="font-display text-3xl tracking-wide text-gradient">
            {cancelled ? "Already cancelled" : "Cancel meeting"}
          </h1>
          <p className="mt-3 font-body text-sm text-off-white/70">
            <strong className="text-off-white">{title}</strong>
            <br />
            {when}
          </p>
          {cancelled ? (
            <p className="mt-4 font-body text-sm text-off-white/50">
              This meeting is off the calendar. You can book a new time from the original link.
            </p>
          ) : (
            <>
              <p className="mt-4 font-body text-sm text-off-white/55">
                This frees the slot and emails both sides. The meeting room will close.
              </p>
              <CancelBookingButton token={params.token} />
            </>
          )}
        </div>
        <p className="mt-8 text-center font-body text-xs text-off-white/35">
          <Link href="/" className="text-cyan/80 hover:underline">
            TriForge Hub
          </Link>
        </p>
      </div>
    </main>
  );
}
