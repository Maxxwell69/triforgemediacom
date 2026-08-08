import Link from "next/link";
import { requireProfile } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ensureUserInHomeGroup } from "@/lib/groups";

export const dynamic = "force-dynamic";

export default async function GroupsPage() {
  const { user } = await requireProfile();
  await ensureUserInHomeGroup(user.id);

  const [memberships, openGroups, pendingApps] = await Promise.all([
    prisma.groupMember.findMany({
      where: { userId: user.id },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            description: true,
            color: true,
            isHome: true,
            joinMode: true,
            _count: { select: { members: true, channels: true } },
          },
        },
      },
      orderBy: { addedAt: "asc" },
    }),
    prisma.group.findMany({
      where: {
        isHome: false,
        joinMode: "APPLY",
        members: { none: { userId: user.id } },
      },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        color: true,
        _count: { select: { members: true } },
      },
    }),
    prisma.groupApplication.findMany({
      where: { userId: user.id, status: "PENDING" },
      select: { groupId: true },
    }),
  ]);

  const pendingGroupIds = new Set(pendingApps.map((a) => a.groupId));

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-5xl tracking-wide">
          GROUPS <span className="text-gradient">& SPACES</span>
        </h1>
        <p className="mt-2 font-body text-off-white/60">
          Home is the main hub. Other spaces can invite you or accept applications.
        </p>

        <section className="mt-10">
          <h2 className="font-display text-2xl tracking-wide text-off-white/80">Your spaces</h2>
          <div className="mt-4 flex flex-col gap-2">
            {memberships.map(({ group, role }) => (
              <Link
                key={group.id}
                href={`/groups/${group.id}`}
                className="glass flex items-center justify-between gap-4 rounded-xl p-4 transition hover:border-cyan/30"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="h-4 w-4 shrink-0 rounded-full border border-off-white/20"
                    style={{ backgroundColor: group.color }}
                  />
                  <div className="min-w-0">
                    <p className="truncate font-body text-sm font-medium text-off-white">
                      {group.name}
                      {group.isHome ? (
                        <span className="ml-2 text-xs text-cyan">Home</span>
                      ) : null}
                    </p>
                    <p className="truncate font-body text-xs text-off-white/40">
                      {group._count.members} members · {group._count.channels} channels · {role}
                    </p>
                  </div>
                </div>
                <span className="font-body text-sm text-off-white/40">→</span>
              </Link>
            ))}
          </div>
        </section>

        {openGroups.length > 0 && (
          <section className="mt-10">
            <h2 className="font-display text-2xl tracking-wide text-off-white/80">
              Open to apply
            </h2>
            <div className="mt-4 flex flex-col gap-2">
              {openGroups.map((group) => (
                <Link
                  key={group.id}
                  href={`/groups/${group.id}`}
                  className="glass flex items-center justify-between gap-4 rounded-xl p-4 transition hover:border-orange/30"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="h-4 w-4 shrink-0 rounded-full border border-off-white/20"
                      style={{ backgroundColor: group.color }}
                    />
                    <div className="min-w-0">
                      <p className="truncate font-body text-sm font-medium text-off-white">
                        {group.name}
                      </p>
                      <p className="truncate font-body text-xs text-off-white/40">
                        {group._count.members} members
                        {pendingGroupIds.has(group.id) ? " · application pending" : ""}
                      </p>
                    </div>
                  </div>
                  <span className="font-body text-xs font-semibold text-orange">
                    {pendingGroupIds.has(group.id) ? "Pending" : "Apply"}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
