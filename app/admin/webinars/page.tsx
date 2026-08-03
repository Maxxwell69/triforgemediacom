import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { isLiveKitConfigured } from "@/lib/livekit";
import { webinarExternalInviteUrl } from "@/lib/webinarExternal";
import CreateWebinarForm from "@/components/webinars/CreateWebinarForm";
import AdminWebinarActions from "@/components/webinars/AdminWebinarActions";
import AdminWebinarHostAvatar from "@/components/webinars/AdminWebinarHostAvatar";
import AdminWebinarRecordings from "@/components/webinars/AdminWebinarRecordings";
import AdminWebinarExternalSignup from "@/components/webinars/AdminWebinarExternalSignup";
import MemberAvatar from "@/components/MemberAvatar";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-off-white/10 text-off-white/60",
  SCHEDULED: "bg-cyan/15 text-cyan",
  LIVE: "bg-orange/20 text-orange",
  ENDED: "bg-off-white/5 text-off-white/40",
};

export default async function AdminWebinarsPage() {
  const webinars = await prisma.webinar.findMany({
    orderBy: { scheduledAt: "desc" },
    include: {
      host: { select: { name: true, email: true } },
      recordings: { orderBy: { sortOrder: "asc" }, select: { id: true, title: true, url: true } },
      externalGuests: {
        orderBy: { registeredAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          registeredAt: true,
          joinedAt: true,
        },
      },
      _count: { select: { attendances: true, chatMessages: true } },
    },
  });

  const livekitReady = isLiveKitConfigured();

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="font-display text-5xl tracking-wide">
        WEBI<span className="text-gradient">NARS</span>
      </h1>
      <p className="mt-2 font-body text-off-white/60">
        Schedule member webinars powered by LiveKit Cloud. Optionally open a secure outside signup
        page for people who are not in the network. After a session, attach screen recordings so
        members can rewatch on the webinar page.
      </p>

      {!livekitReady && (
        <div className="mt-6 rounded-xl border border-orange/40 bg-orange/10 px-4 py-3 font-body text-sm text-orange">
          LiveKit env vars are missing. Set <code className="text-off-white">LIVEKIT_URL</code>,{" "}
          <code className="text-off-white">LIVEKIT_API_KEY</code>, and{" "}
          <code className="text-off-white">LIVEKIT_API_SECRET</code> on Railway before going live.
        </div>
      )}

      <div className="mt-8 glass rounded-2xl p-6">
        <h2 className="font-display text-2xl tracking-wide">Create webinar</h2>
        <CreateWebinarForm />
      </div>

      <div className="mt-10">
        <h2 className="font-display text-2xl tracking-wide text-off-white/80">All webinars</h2>
        {webinars.length === 0 ? (
          <p className="mt-3 font-body text-off-white/50">No webinars yet.</p>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            {webinars.map((w) => {
              const hostName = w.host.name || w.host.email;
              return (
              <div key={w.id} className="glass rounded-xl p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <MemberAvatar
                      avatarUrl={w.hostAvatarUrl}
                      initial={(hostName || "?").charAt(0).toUpperCase()}
                      size={44}
                      textSize="text-sm"
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-body font-semibold text-off-white">{w.title}</p>
                        <span
                          className={`rounded px-2 py-0.5 font-body text-xs uppercase tracking-wide ${STATUS_STYLES[w.status]}`}
                        >
                          {w.status}
                        </span>
                      </div>
                      <p className="mt-1 font-body text-xs text-off-white/50">
                        {w.scheduledAt.toLocaleString()} · Host: {hostName} ·{" "}
                        {w._count.attendances} joined · {w._count.chatMessages} messages
                        {w.externalSignupEnabled
                          ? ` · ${w.externalGuests.length} outside signup${w.externalGuests.length === 1 ? "" : "s"}`
                          : ""}
                      </p>
                      {w.description && (
                        <p className="mt-2 font-body text-sm text-off-white/70">{w.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {(w.status === "SCHEDULED" || w.status === "LIVE") && (
                      <Link
                        href={`/webinars/${w.id}/room`}
                        className="rounded-lg bg-orange px-3 py-1.5 font-body text-sm font-semibold text-charcoal shadow-glow transition hover:brightness-110"
                      >
                        Open room
                      </Link>
                    )}
                    <AdminWebinarActions
                      webinarId={w.id}
                      status={w.status}
                    />
                  </div>
                </div>
                <AdminWebinarHostAvatar webinarId={w.id} hostAvatarUrl={w.hostAvatarUrl} />
                <AdminWebinarExternalSignup
                  webinarId={w.id}
                  enabled={w.externalSignupEnabled}
                  inviteUrl={
                    w.externalInviteToken
                      ? webinarExternalInviteUrl(w.externalInviteToken)
                      : null
                  }
                  guests={w.externalGuests.map((g) => ({
                    id: g.id,
                    name: g.name,
                    email: g.email,
                    registeredAt: g.registeredAt.toISOString(),
                    joinedAt: g.joinedAt?.toISOString() ?? null,
                  }))}
                />
                <AdminWebinarRecordings
                  webinarId={w.id}
                  recordings={w.recordings}
                  canAttach={w.status === "ENDED" || w.status === "LIVE"}
                />
              </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
