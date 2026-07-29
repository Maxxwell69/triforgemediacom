import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { canViewWebinar } from "@/lib/webinars";
import { isAdminRole } from "@/lib/rbac";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  SCHEDULED: "Upcoming",
  LIVE: "Live now",
  ENDED: "Ended",
};

export default async function WebinarsPage() {
  const { user } = await requireProfile();

  const webinars = await prisma.webinar.findMany({
    orderBy: [{ status: "asc" }, { scheduledAt: "desc" }],
    include: {
      host: { select: { name: true, email: true } },
      _count: { select: { attendances: true, recordings: true } },
    },
  });

  const visible = webinars.filter((w) =>
    canViewWebinar(w.status, user.role, w.hostUserId, user.id)
  );

  const live = visible.filter((w) => w.status === "LIVE");
  const upcoming = visible.filter((w) => w.status === "SCHEDULED" || w.status === "DRAFT");
  const past = visible.filter((w) => w.status === "ENDED");

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-5xl tracking-wide">
              WEBI<span className="text-gradient">NARS</span>
            </h1>
            <p className="mt-2 font-body text-off-white/60">
              Join live sessions with the TriForge team. Watch, chat, and raise your hand to come
              on stage.
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
          <p className="mt-10 font-body text-off-white/50">No webinars scheduled yet. Check back soon.</p>
        ) : (
          <div className="mt-10 flex flex-col gap-8">
            {live.length > 0 && (
              <section>
                <h2 className="font-display text-2xl tracking-wide text-orange">Live now</h2>
                <div className="mt-3 flex flex-col gap-3">
                  {live.map((w) => (
                    <WebinarCard key={w.id} webinar={w} />
                  ))}
                </div>
              </section>
            )}

            {upcoming.length > 0 && (
              <section>
                <h2 className="font-display text-2xl tracking-wide text-off-white/80">Upcoming</h2>
                <div className="mt-3 flex flex-col gap-3">
                  {upcoming.map((w) => (
                    <WebinarCard key={w.id} webinar={w} />
                  ))}
                </div>
              </section>
            )}

            {past.length > 0 && (
              <section>
                <h2 className="font-display text-2xl tracking-wide text-off-white/50">Past</h2>
                <div className="mt-3 flex flex-col gap-3">
                  {past.map((w) => (
                    <WebinarCard key={w.id} webinar={w} />
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
}: {
  webinar: {
    id: string;
    title: string;
    description: string | null;
    scheduledAt: Date;
    status: string;
    host: { name: string | null; email: string };
    _count: { attendances: number; recordings: number };
  };
}) {
  const canEnter = webinar.status === "LIVE" || webinar.status === "SCHEDULED";
  const hasRecording = webinar._count.recordings > 0;

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
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
            {hasRecording && (
              <span className="rounded bg-cyan/15 px-2 py-0.5 font-body text-xs text-cyan">
                Recording
              </span>
            )}
          </div>
          <p className="mt-1 font-body text-xs text-off-white/50">
            {webinar.scheduledAt.toLocaleString()} · {webinar.host.name || webinar.host.email}
            {webinar._count.attendances > 0
              ? ` · ${webinar._count.attendances} joined`
              : ""}
          </p>
          {webinar.description && (
            <p className="mt-2 font-body text-sm text-off-white/70">{webinar.description}</p>
          )}
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
