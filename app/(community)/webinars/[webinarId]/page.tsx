import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { canJoinWebinar, canViewWebinar } from "@/lib/webinars";

export const dynamic = "force-dynamic";

export default async function WebinarDetailPage({
  params,
}: {
  params: { webinarId: string };
}) {
  const { user } = await requireProfile();

  const webinar = await prisma.webinar.findUnique({
    where: { id: params.webinarId },
    include: {
      host: { select: { name: true, email: true } },
      _count: { select: { attendances: true, chatMessages: true } },
    },
  });

  if (!webinar || !canViewWebinar(webinar.status, user.role, webinar.hostUserId, user.id)) {
    notFound();
  }

  const joinable = canJoinWebinar(webinar.status);

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/webinars"
          className="font-body text-sm text-off-white/50 transition hover:text-off-white/80"
        >
          ← All webinars
        </Link>

        <h1 className="mt-4 font-display text-5xl tracking-wide text-off-white">
          {webinar.title}
        </h1>
        <p className="mt-2 font-body text-off-white/60">
          {webinar.scheduledAt.toLocaleString()} · Hosted by{" "}
          {webinar.host.name || webinar.host.email}
        </p>

        {webinar.description && (
          <p className="mt-6 font-body text-off-white/80">{webinar.description}</p>
        )}

        <p className="mt-4 font-body text-sm text-off-white/40">
          Status: {webinar.status}
          {webinar._count.attendances > 0
            ? ` · ${webinar._count.attendances} attended`
            : ""}
        </p>

        {joinable ? (
          <Link
            href={`/webinars/${webinar.id}/room`}
            className="mt-8 inline-flex rounded-lg bg-orange px-5 py-2.5 font-body text-sm font-semibold text-charcoal shadow-glow transition hover:brightness-110"
          >
            {webinar.status === "LIVE" ? "Join live room" : "Enter lobby"}
          </Link>
        ) : (
          <p className="mt-8 font-body text-sm text-off-white/50">
            {webinar.status === "ENDED"
              ? "This webinar has ended."
              : "This webinar is not open yet."}
          </p>
        )}
      </div>
    </main>
  );
}
