import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { canViewWebinar, isWebinarOnHubList } from "@/lib/webinars";
import { WEBINAR_AUDIENCE_LABELS } from "@/lib/validations/webinar";
import { getUserNetworkTrack } from "@/lib/mnCn";
import { isAdminRole } from "@/lib/rbac";
import MemberAvatar from "@/components/MemberAvatar";
import LocalWhen from "@/components/LocalWhen";
import type { WebinarAudience } from "@prisma/client";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  SCHEDULED: "Upcoming",
  LIVE: "Live now",
  ENDED: "Ended",
};

export default async function WebinarsPage() {
  const { user } = await requireProfile();
  const networkTrack = await getUserNetworkTrack(user.id);

  const webinars = await prisma.webinar.findMany({
    orderBy: [{ status: "asc" }, { scheduledAt: "desc" }],
    include: {
      host: { select: { name: true, email: true } },
      _count: { select: { attendances: true, recordings: true } },
    },
  });

  const visible = webinars.filter(
    (w) =>
      canViewWebinar(w, user.role, user.id, networkTrack) && isWebinarOnHubList(w)
  );

  const live = visible.filter((w) => w.status === "LIVE");
  const upcoming = visible
    .filter((w) => w.status === "SCHEDULED" || w.status === "DRAFT")
    .slice()
    .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
  const past = visible
    .filter((w) => w.status === "ENDED")
    .slice()
    .sort((a, b) => b.scheduledAt.getTime() - a.scheduledAt.getTime());

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-5xl tracking-wide">
              WEBI<span className="text-gradient">NARS</span>
            </h1>
            <p className="mt-2 font-body text-off-white/60">
              Join sessions that are live or starting within 24 hours. The full schedule lives on
              the calendar.
            </p>
          </div>
          {isAdminRole(user.role) && (
            <Link
              href="/admin/webinars"
              className="rounded-lg border border-cyan/30 bg-cyan/10 px-3 py-2 font-body text-sm font-semibold text-cyan transition hover:bg-cyan/15"
            >
              Manage
            </Link>
          )}
        </div>

        {visible.length === 0 ? (
          <p className="mt-10 font-body text-off-white/50">
            Nothing starting in the next 24 hours. Check the{" "}
            <Link href="/calendar" className="text-cyan hover:underline">
              calendar
            </Link>{" "}
            for upcoming sessions.
          </p>
        ) : (
          <div className="mt-10 flex flex-col gap-8">
            {live.length > 0 && (
              <section>
                <h2 className="font-display text-2xl tracking-wide text-orange">Live now</h2>
                <div className="mt-3 flex flex-col gap-3">
                  {live.map((w) => (
                    <WebinarCard key={w.id} webinar={w} showAudience={isAdminRole(user.role)} />
                  ))}
                </div>
              </section>
            )}

            {upcoming.length > 0 && (
              <section>
                <h2 className="font-display text-2xl tracking-wide text-off-white/80">Upcoming</h2>
                <div className="mt-3 flex flex-col gap-3">
                  {upcoming.map((w) => (
                    <WebinarCard key={w.id} webinar={w} showAudience={isAdminRole(user.role)} />
                  ))}
                </div>
              </section>
            )}

            {past.length > 0 && (
              <section>
                <h2 className="font-display text-2xl tracking-wide text-off-white/50">Past</h2>
                <div className="mt-3 flex flex-col gap-3">
                  {past.map((w) => (
                    <WebinarCard key={w.id} webinar={w} showAudience={isAdminRole(user.role)} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function WebinarCard({
  webinar,
  showAudience,
}: {
  webinar: {
    id: string;
    title: string;
    description: string | null;
    scheduledAt: Date;
    status: string;
    audience: WebinarAudience;
    seriesId: string | null;
    hostAvatarUrl: string | null;
    host: { name: string | null; email: string };
    _count: { attendances: number; recordings: number };
  };
  showAudience: boolean;
}) {
  const canEnter = webinar.status === "LIVE" || webinar.status === "SCHEDULED";
  const hasRecording = webinar._count.recordings > 0;
  const hostName = webinar.host.name || webinar.host.email;

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <MemberAvatar
            avatarUrl={webinar.hostAvatarUrl}
            initial={(hostName || "?").charAt(0).toUpperCase()}
            size={48}
            textSize="text-base"
          />
          <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-body text-lg font-semibold text-off-white">{webinar.title}</h3>
            <span
              className={`rounded px-2 py-0.5 font-body text-xs uppercase tracking-wide ${
                webinar.status === "LIVE"
                  ? "bg-orange/20 text-orange"
                  : webinar.status === "SCHEDULED"
                    ? "bg-cyan/15 text-cyan"
                    : "bg-off-white/10 text-off-white/50"
              }`}
            >
              {STATUS_LABEL[webinar.status] || webinar.status}
            </span>
            {showAudience && webinar.audience !== "ALL" && (
              <span className="rounded bg-off-white/10 px-2 py-0.5 font-body text-xs text-off-white/60">
                {WEBINAR_AUDIENCE_LABELS[webinar.audience]}
              </span>
            )}
            {webinar.seriesId && (
              <span className="rounded bg-cyan/15 px-2 py-0.5 font-body text-xs text-cyan">
                Weekly series
              </span>
            )}
            {hasRecording && (
              <span className="rounded bg-cyan/15 px-2 py-0.5 font-body text-xs text-cyan">
                Recording
              </span>
            )}
          </div>
          <p className="mt-1 font-body text-xs text-off-white/50">
            <LocalWhen startsAt={webinar.scheduledAt.toISOString()} /> · {hostName}
            {webinar._count.attendances > 0
              ? ` · ${webinar._count.attendances} joined`
              : ""}
          </p>
          {webinar.description && (
            <p className="mt-2 font-body text-sm text-off-white/70">{webinar.description}</p>
          )}
          </div>
        </div>
        {canEnter ? (
          <Link
            href={`/webinars/${webinar.id}/room`}
            className="rounded-lg bg-orange px-4 py-2 font-body text-sm font-semibold text-charcoal shadow-glow transition hover:brightness-110"
          >
            {webinar.status === "LIVE" ? "Join live" : "Enter lobby"}
          </Link>
        ) : (
          <Link
            href={`/webinars/${webinar.id}`}
            className="rounded-lg border border-off-white/15 px-4 py-2 font-body text-sm text-off-white/60 transition hover:bg-off-white/5"
          >
            {hasRecording ? "Watch recording" : "Details"}
          </Link>
        )}
      </div>
    </div>
  );
}
