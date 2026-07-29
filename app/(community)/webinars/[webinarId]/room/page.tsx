import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { isLiveKitConfigured } from "@/lib/livekit";
import {
  canJoinWebinar,
  canViewWebinar,
  displayNameForUser,
  isWebinarHost,
  resolveParticipantRole,
} from "@/lib/webinars";
import WebinarRoom from "@/components/webinars/WebinarRoom";

export const dynamic = "force-dynamic";

export default async function WebinarRoomPage({
  params,
}: {
  params: { webinarId: string };
}) {
  const { user } = await requireProfile();

  const webinar = await prisma.webinar.findUnique({
    where: { id: params.webinarId },
    include: {
      host: { select: { id: true, name: true, email: true } },
    },
  });

  if (!webinar || !canViewWebinar(webinar.status, user.role, webinar.hostUserId, user.id)) {
    notFound();
  }

  if (!canJoinWebinar(webinar.status)) {
    redirect(`/webinars/${webinar.id}`);
  }

  if (!isLiveKitConfigured()) {
    return (
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="max-w-md text-center">
          <h1 className="font-display text-3xl tracking-wide">Room unavailable</h1>
          <p className="mt-3 font-body text-off-white/60">
            LiveKit is not configured yet. Ask an admin to set LIVEKIT_URL, LIVEKIT_API_KEY, and
            LIVEKIT_API_SECRET.
          </p>
          <Link
            href="/webinars"
            className="mt-6 inline-flex font-body text-sm text-cyan hover:underline"
          >
            ← Back to webinars
          </Link>
        </div>
      </main>
    );
  }

  const role = await resolveParticipantRole(webinar, user.id, user.role);
  const hostControls = isWebinarHost(webinar, user.id, user.role);

  return (
    <main className="flex min-h-[calc(100dvh-3.5rem)] flex-1 flex-col md:min-h-screen">
      <WebinarRoom
        webinarId={webinar.id}
        title={webinar.title}
        status={webinar.status}
        initialRole={role}
        isHost={hostControls}
        userId={user.id}
        userName={displayNameForUser(user)}
      />
    </main>
  );
}
