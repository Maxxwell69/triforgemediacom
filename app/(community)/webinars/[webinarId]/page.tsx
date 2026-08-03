import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import {
  canChooseWebinarJoinMode,
  canJoinWebinar,
  canViewWebinar,
} from "@/lib/webinars";
import WebinarRecordingPlayer from "@/components/webinars/WebinarRecordingPlayer";
import MemberAvatar from "@/components/MemberAvatar";

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
      recordings: { orderBy: { sortOrder: "asc" } },
      _count: { select: { attendances: true, chatMessages: true } },
    },
  });

  if (!webinar || !canViewWebinar(webinar, user.role, user.id)) {
    notFound();
  }

  const joinable = canJoinWebinar(webinar.status);
  const staffChoice = canChooseWebinarJoinMode(user.role);

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/webinars"
          className="font-body text-sm text-off-white/50 transition hover:text-off-white/80"
        >
          ← All webinars
        </Link>

        <div className="mt-4 flex items-start gap-4">
          <MemberAvatar
            avatarUrl={webinar.hostAvatarUrl}
            initial={(webinar.host.name || webinar.host.email || "?").charAt(0).toUpperCase()}
            size={64}
            textSize="text-2xl"
          />
          <div className="min-w-0">
            <h1 className="font-display text-5xl tracking-wide text-off-white">
              {webinar.title}
            </h1>
            <p className="mt-2 font-body text-off-white/60">
              {webinar.scheduledAt.toLocaleString()} · Hosted by{" "}
              {webinar.host.name || webinar.host.email}
            </p>
          </div>
        </div>

        {webinar.description && (
          <p className="mt-6 font-body text-off-white/80">{webinar.description}</p>
        )}

        <p className="mt-4 font-body text-sm text-off-white/40">
          Status: {webinar.status}
          {webinar._count.attendances > 0
            ? ` · ${webinar._count.attendances} attended`
            : ""}
        </p>

        {joinable && staffChoice ? (
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/webinars/${webinar.id}/room?as=host`}
              className="inline-flex rounded-lg bg-orange px-5 py-2.5 font-body text-sm font-semibold text-charcoal shadow-glow transition hover:brightness-110"
            >
              Join as host
            </Link>
            <Link
              href={`/webinars/${webinar.id}/room?as=watch`}
              className="inline-flex rounded-lg border border-cyan/40 bg-cyan/10 px-5 py-2.5 font-body text-sm font-semibold text-cyan transition hover:bg-cyan/15"
            >
              Watch &amp; chat
            </Link>
          </div>
        ) : joinable ? (
          <Link
            href={`/webinars/${webinar.id}/room`}
            className="mt-8 inline-flex rounded-lg bg-orange px-5 py-2.5 font-body text-sm font-semibold text-charcoal shadow-glow transition hover:brightness-110"
          >
            {webinar.status === "LIVE" ? "Join live room" : "Enter lobby"}
          </Link>
        ) : webinar.status === "ENDED" && webinar.recordings.length === 0 ? (
          <p className="mt-8 font-body text-sm text-off-white/50">
            This webinar has ended. A recording will appear here once an admin uploads it.
          </p>
        ) : webinar.status !== "ENDED" ? (
          <p className="mt-8 font-body text-sm text-off-white/50">
            This webinar is not open yet.
          </p>
        ) : null}

        {webinar.recordings.length > 0 && (
          <section className="mt-10">
            <h2 className="font-display text-2xl tracking-wide text-off-white/80">
              Recording{webinar.recordings.length === 1 ? "" : "s"}
            </h2>
            <div className="mt-4 flex flex-col gap-4">
              {webinar.recordings.map((r) => (
                <WebinarRecordingPlayer key={r.id} url={r.url} title={r.title} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
