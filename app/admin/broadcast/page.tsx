import { prisma } from "@/lib/prisma";
import { isAiEmailConfigured } from "@/lib/aiEmail";
import { backfillNetworkMemberships } from "@/lib/mnCn";
import BroadcastComposer from "@/components/admin/BroadcastComposer";

export const dynamic = "force-dynamic";

export default async function AdminBroadcastPage() {
  // Repair CN/MN group+tag for anyone routed by apply/import before those
  // memberships were written — so By tag / By group / CN track all agree.
  await backfillNetworkMemberships();

  const [tags, groups, recentBroadcasts] = await Promise.all([
    prisma.tag.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.group.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.broadcast.findMany({
      orderBy: { sentAt: "desc" },
      take: 20,
      include: { sentBy: { select: { name: true, email: true } } },
    }),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-5xl tracking-wide">
        BROAD<span className="text-gradient">CAST</span>
      </h1>
      <p className="mt-2 font-body text-off-white/60">
        Send a one-off announcement email to the whole community, CN or MN track, a tag, a
        group, or a single member. Type a rough topic and let AI draft it, or write it yourself.
      </p>

      <div className="mt-8">
        <BroadcastComposer tags={tags} groups={groups} aiConfigured={isAiEmailConfigured()} />
      </div>

      <div className="mt-10">
        <h2 className="font-display text-2xl tracking-wide text-off-white/80">Recent sends</h2>
        {recentBroadcasts.length === 0 ? (
          <p className="mt-3 font-body text-off-white/50">No broadcasts sent yet.</p>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            {recentBroadcasts.map((b) => (
              <div key={b.id} className="glass rounded-xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-body font-semibold text-off-white">{b.subject}</p>
                  <p className="font-body text-xs text-off-white/40">
                    {b.sentAt.toLocaleDateString()} &middot; {b.sentBy.name || b.sentBy.email}
                  </p>
                </div>
                <p className="mt-1 font-body text-xs text-off-white/50">
                  {b.audienceLabel} &middot; {b.recipientCount} recipient
                  {b.recipientCount === 1 ? "" : "s"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
