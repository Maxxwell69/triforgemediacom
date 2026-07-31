import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserPointsTotals } from "@/lib/points";
import { backfillNetworkMemberships } from "@/lib/mnCn";
import { adjustUserPoints } from "./actions";
import UserRoleSelect from "@/components/admin/UserRoleSelect";
import BanButton from "@/components/admin/BanButton";
import UserGroupsEditor from "@/components/admin/UserGroupsEditor";
import UserTagsEditor from "@/components/admin/UserTagsEditor";
import UserBadgesEditor from "@/components/admin/UserBadgesEditor";
import AddMemberForm from "@/components/admin/AddMemberForm";
import ResendInviteButton from "@/components/admin/ResendInviteButton";
import AdminAlertsToggle from "@/components/admin/AdminAlertsToggle";
import DirectoryVisibilityToggle from "@/components/admin/DirectoryVisibilityToggle";

export const dynamic = "force-dynamic";

const statusStyles: Record<string, string> = {
  ACTIVE: "text-cyan",
  INVITED: "text-off-white/50",
  BANNED: "text-orange",
  PENDING_APPLICATION: "text-off-white/50",
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams?: { track?: string };
}) {
  const session = await auth();
  const currentUserId = session!.user.id;
  const trackFilter =
    searchParams?.track === "CN" || searchParams?.track === "MN"
      ? searchParams.track
      : null;

  await backfillNetworkMemberships();

  const [users, allGroups, allTags, allBadges] = await Promise.all([
    prisma.user.findMany({
      where: {
        status: { in: ["ACTIVE", "INVITED", "BANNED"] },
        ...(trackFilter
          ? {
              OR: [
                { tags: { some: { tag: { name: trackFilter } } } },
                { groupMemberships: { some: { group: { name: trackFilter } } } },
                { application: { is: { answers: { path: ["track"], equals: trackFilter } } } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        groupMemberships: { include: { group: true } },
        tags: { select: { tagId: true } },
        userBadges: { select: { badgeId: true } },
      },
    }),
    prisma.group.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, color: true } }),
    prisma.tag.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, color: true } }),
    prisma.badge.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, icon: true } }),
  ]);

  const pointsTotals = await getUserPointsTotals(users.map((u) => u.id));

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="font-display text-5xl tracking-wide">
        USER <span className="text-gradient">MANAGEMENT</span>
      </h1>
      <p className="mt-2 font-body text-off-white/60">{users.length} members</p>

      <div className="mt-5 flex flex-wrap gap-2">
        {(
          [
            { href: "/admin/users", label: "All", active: !trackFilter },
            {
              href: "/admin/users?track=CN",
              label: "Creator Network (CN)",
              active: trackFilter === "CN",
            },
            {
              href: "/admin/users?track=MN",
              label: "Media Network (MN)",
              active: trackFilter === "MN",
            },
          ] as const
        ).map((opt) => (
          <Link
            key={opt.href}
            href={opt.href}
            className={`rounded-full border px-3 py-1.5 font-body text-xs font-semibold transition ${
              opt.active
                ? "border-orange bg-orange/20 text-orange"
                : "border-off-white/15 text-off-white/50 hover:border-off-white/30 hover:text-off-white/80"
            }`}
          >
            {opt.label}
          </Link>
        ))}
      </div>

      <div className="mt-8">
        <AddMemberForm />
      </div>

      <div className="mt-10 flex flex-col gap-2">
        {users.map((user) => {
          const isSelf = user.id === currentUserId;
          const isBanned = user.status === "BANNED";
          const groups = user.groupMemberships.map((m) => m.group);
          const tagIds = user.tags.map((t) => t.tagId);
          const badgeIds = user.userBadges.map((b) => b.badgeId);

          return (
            <div key={user.id} className="glass flex flex-col gap-3 rounded-xl p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0">
                  <Link
                    href={`/admin/users/${user.id}`}
                    className="truncate font-body font-medium text-off-white transition hover:text-cyan hover:underline"
                  >
                    {user.name || "Unnamed"}
                    {isSelf && <span className="ml-2 text-xs text-off-white/40">(you)</span>}
                  </Link>
                  <p className="truncate font-body text-sm text-off-white/50">{user.email}</p>
                </div>

                <div className="flex items-center gap-4">
                  <span
                    className={`font-body text-xs font-semibold uppercase tracking-wide ${
                      statusStyles[user.status] || "text-off-white/50"
                    }`}
                  >
                    {user.status}
                  </span>
                  {user.status === "INVITED" && <ResendInviteButton userId={user.id} />}
                  {user.role === "ADMIN" && (
                    <AdminAlertsToggle userId={user.id} receivesAlerts={user.receivesAdminAlerts} />
                  )}
                  <DirectoryVisibilityToggle userId={user.id} hidden={user.hiddenFromDirectory} />
                  <UserRoleSelect userId={user.id} currentRole={user.role} disabled={isSelf} />
                  <BanButton userId={user.id} banned={isBanned} disabled={isSelf} />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-off-white/10 pt-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  {groups.length === 0 && (
                    <span className="font-body text-xs text-off-white/30">No groups</span>
                  )}
                  {groups.map((g) => (
                    <span
                      key={g.id}
                      className="rounded-full border px-2 py-0.5 font-body text-xs"
                      style={{ borderColor: `${g.color}66`, color: g.color }}
                    >
                      {g.name}
                    </span>
                  ))}
                  <UserGroupsEditor
                    userId={user.id}
                    allGroups={allGroups}
                    memberGroupIds={groups.map((g) => g.id)}
                  />
                  <UserTagsEditor userId={user.id} allTags={allTags} memberTagIds={tagIds} />
                  <UserBadgesEditor userId={user.id} allBadges={allBadges} memberBadgeIds={badgeIds} />
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-body text-sm text-off-white/70">
                    {pointsTotals[user.id] ?? 0} pts
                  </span>
                  <form action={adjustUserPoints} className="flex items-center gap-1.5">
                    <input type="hidden" name="userId" value={user.id} />
                    <input
                      type="number"
                      name="amount"
                      placeholder="±XP"
                      required
                      className="w-16 rounded-lg border border-off-white/15 bg-off-white/5 px-2 py-1 font-body text-xs text-off-white outline-none transition focus:border-cyan/60"
                    />
                    <input
                      type="text"
                      name="note"
                      placeholder="Note (optional)"
                      maxLength={280}
                      className="w-36 rounded-lg border border-off-white/15 bg-off-white/5 px-2 py-1 font-body text-xs text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60"
                    />
                    <button
                      type="submit"
                      className="rounded-lg border border-cyan/40 px-2.5 py-1 font-body text-xs font-semibold text-cyan transition hover:bg-cyan/10"
                    >
                      Apply
                    </button>
                  </form>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
