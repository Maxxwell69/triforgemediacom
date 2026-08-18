import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ExternalWebinarSignupForm from "@/components/webinars/ExternalWebinarSignupForm";
import MemberAvatar from "@/components/MemberAvatar";
import LocalWhen from "@/components/LocalWhen";

export const dynamic = "force-dynamic";

export default async function ExternalWebinarInvitePage({
  params,
}: {
  params: { inviteToken: string };
}) {
  const webinar = await prisma.webinar.findFirst({
    where: {
      externalInviteToken: params.inviteToken,
      externalSignupEnabled: true,
    },
    include: {
      host: { select: { name: true, email: true } },
    },
  });

  if (!webinar || webinar.status === "DRAFT") {
    notFound();
  }

  const hostName = webinar.host.name || webinar.host.email || "Host";
  const ended = webinar.status === "ENDED";

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-6 py-14">
      <p className="font-body text-xs uppercase tracking-[0.2em] text-orange">
        TriForge webinar invite
      </p>
      <h1 className="mt-3 font-display text-5xl tracking-wide sm:text-6xl">
        {webinar.title}
      </h1>
      <p className="mt-3 font-body text-off-white/60">
        {ended
          ? "This webinar has ended. Registration is closed."
          : "You were invited to join this session. Sign up below — no community membership required."}
      </p>

      <div className="mt-8 flex items-center gap-3">
        <MemberAvatar
          avatarUrl={webinar.hostAvatarUrl}
          initial={hostName.charAt(0).toUpperCase()}
          size={48}
          textSize="text-sm"
        />
        <div>
          <p className="font-body text-sm font-semibold text-off-white">{hostName}</p>
          <p className="font-body text-xs text-off-white/45">
            <LocalWhen startsAt={webinar.scheduledAt} />
            {webinar.status === "LIVE" ? " · Live now" : ""}
          </p>
        </div>
      </div>

      {webinar.description && (
        <p className="mt-6 font-body text-sm leading-relaxed text-off-white/70">
          {webinar.description}
        </p>
      )}

      {ended ? null : <ExternalWebinarSignupForm inviteToken={params.inviteToken} />}
    </main>
  );
}
