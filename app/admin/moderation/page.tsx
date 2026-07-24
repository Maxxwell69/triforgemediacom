import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<string, string> = {
  MESSAGE_DELETED: "Message deleted",
  USER_MUTED: "User muted",
  USER_UNMUTED: "User unmuted",
};

const TYPE_STYLES: Record<string, string> = {
  MESSAGE_DELETED: "text-orange",
  USER_MUTED: "text-orange",
  USER_UNMUTED: "text-cyan",
};

export default async function AdminModerationPage() {
  const actions = await prisma.moderationAction.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      moderator: { select: { name: true, email: true } },
      targetUser: { select: { name: true, email: true } },
    },
  });

  const channelIds = Array.from(
    new Set(actions.map((a) => a.channelId).filter((id): id is string => !!id))
  );
  const channels = channelIds.length
    ? await prisma.channel.findMany({
        where: { id: { in: channelIds } },
        select: { id: true, name: true },
      })
    : [];
  const channelNames = Object.fromEntries(channels.map((c) => [c.id, c.name]));

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="font-display text-5xl tracking-wide">
        MODERATION <span className="text-gradient">LOG</span>
      </h1>
      <p className="mt-2 font-body text-off-white/60">
        Every message deletion, mute, and unmute performed by mods and admins &mdash; for
        accountability.
      </p>

      <div className="mt-8 flex flex-col gap-2">
        {actions.length === 0 && (
          <p className="glass rounded-2xl p-8 text-center font-body text-off-white/50">
            No moderation actions yet.
          </p>
        )}
        {actions.map((action) => (
          <div key={action.id} className="glass flex flex-col gap-2 rounded-xl p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span
                className={`font-body text-xs font-semibold uppercase tracking-wide ${
                  TYPE_STYLES[action.type] || "text-off-white/70"
                }`}
              >
                {TYPE_LABELS[action.type] || action.type}
              </span>
              <span className="font-body text-xs text-off-white/40">
                {action.createdAt.toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
              </span>
            </div>
            <p className="font-body text-sm text-off-white/80">
              <span className="text-off-white/50">By</span>{" "}
              {action.moderator.name || action.moderator.email}
              {action.targetUser && (
                <>
                  {" "}
                  <span className="text-off-white/50">on</span>{" "}
                  {action.targetUser.name || action.targetUser.email}
                </>
              )}
              {action.channelId && (
                <>
                  {" "}
                  <span className="text-off-white/50">in</span> #
                  {channelNames[action.channelId] || "deleted channel"}
                </>
              )}
            </p>
            {action.messageSnapshot && (
              <p className="rounded-lg border border-off-white/10 bg-off-white/5 px-3 py-2 font-body text-xs text-off-white/60">
                &ldquo;{action.messageSnapshot}&rdquo;
              </p>
            )}
            {action.reason && (
              <p className="font-body text-xs text-off-white/40">Reason: {action.reason}</p>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
