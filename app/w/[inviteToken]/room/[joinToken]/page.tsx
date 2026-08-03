import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { canJoinWebinar } from "@/lib/webinars";
import { isLiveKitConfigured } from "@/lib/livekit";
import { webinarGuestIdentity } from "@/lib/webinarExternal";
import WebinarRoom from "@/components/webinars/WebinarRoom";

export const dynamic = "force-dynamic";

export default async function ExternalWebinarRoomPage({
  params,
}: {
  params: { inviteToken: string; joinToken: string };
}) {
  const guest = await prisma.webinarGuest.findUnique({
    where: { joinToken: params.joinToken },
    include: {
      webinar: {
        select: {
          id: true,
          title: true,
          status: true,
          hostUserId: true,
          externalSignupEnabled: true,
          externalInviteToken: true,
        },
      },
    },
  });

  if (
    !guest ||
    guest.webinar.externalInviteToken !== params.inviteToken ||
    !guest.webinar.externalSignupEnabled
  ) {
    notFound();
  }

  const accessPath = `/w/${params.inviteToken}/access/${params.joinToken}`;

  if (guest.kickedAt) {
    redirect(accessPath);
  }

  if (!canJoinWebinar(guest.webinar.status)) {
    redirect(accessPath);
  }

  if (!isLiveKitConfigured()) {
    return (
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="max-w-md text-center">
          <h1 className="font-display text-3xl tracking-wide">Room unavailable</h1>
          <p className="mt-3 font-body text-off-white/60">
            The live room is not ready yet. Please try again shortly.
          </p>
          <Link
            href={accessPath}
            className="mt-6 inline-flex font-body text-sm text-cyan hover:underline"
          >
            ← Back to your registration
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex h-[100dvh] min-h-0 flex-1 flex-col overflow-hidden">
      <WebinarRoom
        webinarId={guest.webinar.id}
        title={guest.webinar.title}
        status={guest.webinar.status}
        initialRole="AUDIENCE"
        userId={webinarGuestIdentity(guest.id)}
        userName={guest.name}
        designatedHostUserId={guest.webinar.hostUserId}
        guestMode
        guestJoinToken={params.joinToken}
        leaveHref={accessPath}
      />
    </main>
  );
}
