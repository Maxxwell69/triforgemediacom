import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { canJoinWebinar } from "@/lib/webinars";
import { isLiveKitConfigured } from "@/lib/livekit";

export const dynamic = "force-dynamic";

export default async function ExternalWebinarAccessPage({
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
          description: true,
          scheduledAt: true,
          status: true,
          externalSignupEnabled: true,
          externalInviteToken: true,
          hostAvatarUrl: true,
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

  if (guest.kickedAt) {
    return (
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center px-6 py-16 text-center">
        <h1 className="font-display text-4xl tracking-wide">Access revoked</h1>
        <p className="mt-3 font-body text-off-white/60">
          Your access to this webinar was removed by the host.
        </p>
      </main>
    );
  }

  const { webinar } = guest;
  const canEnter = canJoinWebinar(webinar.status) && isLiveKitConfigured();
  const roomHref = `/w/${params.inviteToken}/room/${params.joinToken}`;

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-6 py-14">
      <p className="font-body text-xs uppercase tracking-[0.2em] text-cyan">
        You&apos;re registered
      </p>
      <h1 className="mt-3 font-display text-5xl tracking-wide">{webinar.title}</h1>
      <p className="mt-3 font-body text-off-white/60">
        Hi {guest.name} — save this page. It&apos;s your personal entry for this webinar.
      </p>

      <div className="glass mt-8 rounded-2xl p-6">
        <p className="font-body text-sm text-off-white/70">
          {webinar.scheduledAt.toLocaleString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </p>
        <p className="mt-2 font-body text-xs text-off-white/45">
          Status:{" "}
          <span
            className={
              webinar.status === "LIVE"
                ? "text-orange"
                : webinar.status === "ENDED"
                  ? "text-off-white/40"
                  : "text-cyan"
            }
          >
            {webinar.status === "LIVE"
              ? "Live now"
              : webinar.status === "ENDED"
                ? "Ended"
                : "Scheduled"}
          </span>
        </p>

        {webinar.status === "ENDED" ? (
          <p className="mt-6 font-body text-sm text-off-white/50">
            This session has ended. Thanks for registering.
          </p>
        ) : canEnter ? (
          <Link
            href={roomHref}
            className="mt-6 inline-flex rounded-lg bg-orange px-5 py-2.5 font-body text-sm font-semibold text-charcoal shadow-glow transition hover:brightness-110"
          >
            {webinar.status === "LIVE" ? "Enter live room" : "Enter lobby"}
          </Link>
        ) : (
          <p className="mt-6 font-body text-sm text-off-white/50">
            The room isn&apos;t open yet. Come back closer to the start time — this link will
            unlock when the host opens the session.
          </p>
        )}
      </div>

      <p className="mt-6 font-body text-xs text-off-white/35">
        Bookmark this URL. Don&apos;t share it — it&apos;s tied to your registration.
      </p>
    </main>
  );
}
