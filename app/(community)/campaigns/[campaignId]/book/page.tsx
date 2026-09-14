import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { isAdminRole } from "@/lib/rbac";
import { hubCampaignBookingPage, requireHubCampaignsModule } from "@/lib/hubCampaigns";
import { isInterviewCampaign } from "@/lib/hubCampaignLabels";
import {
  getActiveBookingPageById,
  listOpenSlotsForPage,
} from "@/lib/booking";
import PublicBookingClient from "@/components/booking/PublicBookingClient";
import { bookHubCampaignInterview } from "../../actions";

export const dynamic = "force-dynamic";

export default async function CampaignInterviewBookPage({
  params,
}: {
  params: { campaignId: string };
}) {
  requireHubCampaignsModule();
  const { user } = await requireProfile();
  const campaignId = params.campaignId;

  const campaign = await prisma.hubCampaign.findUnique({
    where: { id: campaignId },
    select: {
      id: true,
      title: true,
      category: true,
      status: true,
      bookingPageId: true,
      bookingPage: { select: { id: true, slug: true, isActive: true } },
      createdBy: { select: { bookingPage: { select: { id: true, slug: true, isActive: true } } } },
      signups: {
        where: { userId: user.id },
        select: {
          id: true,
          appointment: { select: { startsAt: true, endsAt: true, status: true } },
        },
      },
    },
  });
  if (!campaign || !isInterviewCampaign(campaign.category)) notFound();
  if (campaign.status === "ARCHIVED" && !isAdminRole(user.role)) notFound();

  const signup = campaign.signups[0];
  if (!signup) {
    redirect(`/campaigns/${campaignId}`);
  }

  const booked =
    signup.appointment?.status === "CONFIRMED" ? signup.appointment : null;
  if (booked) {
    return (
      <main className="flex-1 px-6 py-10">
        <div className="mx-auto max-w-2xl">
          <Link
            href={`/campaigns/${campaignId}`}
            className="font-body text-sm text-off-white/50 transition hover:text-off-white/80"
          >
            ← Back to campaign
          </Link>
          <div className="glass mt-6 rounded-2xl p-8 text-center">
            <h1 className="font-display text-3xl tracking-wide text-gradient">You&apos;re booked</h1>
            <p className="mt-3 font-body text-sm text-off-white/60">
              Your interview time for {campaign.title} is already on the calendar.
            </p>
            <Link
              href={`/campaigns/${campaignId}`}
              className="mt-6 inline-block rounded-lg bg-orange px-6 py-2.5 font-body text-sm font-semibold text-off-white shadow-glow"
            >
              Back to your spot
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const booking = hubCampaignBookingPage(campaign);
  if (!booking) {
    return (
      <main className="flex-1 px-6 py-10">
        <div className="mx-auto max-w-2xl">
          <Link
            href={`/campaigns/${campaignId}`}
            className="font-body text-sm text-off-white/50 transition hover:text-off-white/80"
          >
            ← Back to campaign
          </Link>
          <p className="mt-8 font-body text-sm text-off-white/60">
            This campaign does not have a booking page yet. Ask an admin to attach one.
          </p>
        </div>
      </main>
    );
  }

  const page = await getActiveBookingPageById(booking.id);
  if (!page) {
    return (
      <main className="flex-1 px-6 py-10">
        <div className="mx-auto max-w-2xl">
          <Link
            href={`/campaigns/${campaignId}`}
            className="font-body text-sm text-off-white/50 transition hover:text-off-white/80"
          >
            ← Back to campaign
          </Link>
          <p className="mt-8 font-body text-sm text-off-white/60">
            The booking page for this campaign is unavailable right now.
          </p>
        </div>
      </main>
    );
  }

  const fallbackSlots = await listOpenSlotsForPage(page);
  const meetingTypes = await Promise.all(
    page.meetingTypes.map(async (type) => ({
      id: type.id,
      title: type.title,
      description: type.description,
      durationMins: type.durationMins,
      slots: await listOpenSlotsForPage(page, new Date(), type.durationMins),
    }))
  );
  const hostName = page.host.name?.trim() || "TriForge host";
  const bookerEmail = user.email?.trim();
  if (!bookerEmail) {
    return (
      <main className="flex-1 px-6 py-10">
        <div className="mx-auto max-w-2xl">
          <Link
            href={`/campaigns/${campaignId}`}
            className="font-body text-sm text-off-white/50 transition hover:text-off-white/80"
          >
            ← Back to campaign
          </Link>
          <p className="mt-8 font-body text-sm text-off-white/60">
            Your account needs an email before you can book a time.
          </p>
        </div>
      </main>
    );
  }
  const bookerName = user.name?.trim() || bookerEmail;
  const bookAction = bookHubCampaignInterview.bind(null, campaignId);

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <Link
          href={`/campaigns/${campaignId}`}
          className="font-body text-sm text-off-white/50 transition hover:text-off-white/80"
        >
          ← Back to {campaign.title}
        </Link>
        <div className="mt-8">
          <PublicBookingClient
            slug={page.slug}
            title={page.title}
            description={page.description}
            hostName={hostName}
            timezone={page.timezone}
            durationMins={page.durationMins}
            slots={meetingTypes[0]?.slots ?? fallbackSlots}
            meetingTypes={meetingTypes}
            remindHourBefore={page.remindHourBefore}
            lockedGuest={{ name: bookerName, email: bookerEmail }}
            bookFn={bookAction}
            doneHref={`/campaigns/${campaignId}`}
            doneLabel="Back to your spot"
          />
        </div>
      </div>
    </main>
  );
}
