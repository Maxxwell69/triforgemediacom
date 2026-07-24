import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { getUserPointsTotals } from "@/lib/points";
import { PLATFORM_LABELS } from "@/lib/platforms";

export const dynamic = "force-dynamic";

export default async function MembersPage() {
  await requireProfile();

  const members = await prisma.user.findMany({
    where: { status: "ACTIVE", profile: { isNot: null } },
    include: { profile: true, groupMemberships: { include: { group: true } } },
    orderBy: { createdAt: "asc" },
  });

  const pointsTotals = await getUserPointsTotals(members.map((m) => m.id));

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="font-display text-5xl tracking-wide">
          THE <span className="text-gradient">COMMUNITY</span>
        </h1>
        <p className="mt-2 font-body text-off-white/60">
          {members.length} active member{members.length === 1 ? "" : "s"}
        </p>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => {
            const initial = (member.name || member.email).trim().charAt(0).toUpperCase();
            const groups = member.groupMemberships.map((m) => m.group);
            const platform = member.profile?.platform;

            return (
              <div key={member.id} className="glass flex flex-col gap-3 rounded-2xl p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange to-cyan font-display text-lg text-charcoal">
                    {initial}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-body font-medium text-off-white">
                      {member.name || "Unnamed"}
                    </p>
                    {platform && (
                      <span className="inline-block rounded-full border border-cyan/30 px-2 py-0.5 font-body text-xs text-cyan">
                        {PLATFORM_LABELS[platform]}
                      </span>
                    )}
                  </div>
                </div>

                {groups.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {groups.map((g) => (
                      <span
                        key={g.id}
                        className="rounded-full border px-2 py-0.5 font-body text-xs"
                        style={{ borderColor: `${g.color}66`, color: g.color }}
                      >
                        {g.name}
                      </span>
                    ))}
                  </div>
                )}

                <p className="font-body text-sm text-off-white/50">
                  {pointsTotals[member.id] ?? 0} points
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
