import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { canAccessChannel, getUserGroupIds, hasTikTaskAccess } from "@/lib/groups";
import Logo from "@/components/Logo";
import ChannelSidebar from "@/components/ChannelSidebar";
import SignOutButton from "@/components/SignOutButton";

export default async function AppShell({ children }: { children: React.ReactNode }) {
  const { user, profile } = await requireProfile();

  const [allChannels, xpAgg, userGroupIds, tikTaskAccess] = await Promise.all([
    prisma.channel.findMany({
      orderBy: { createdAt: "asc" },
      include: { groups: { select: { id: true } } },
    }),
    prisma.xPEvent.aggregate({ where: { userId: user.id }, _sum: { amount: true } }),
    getUserGroupIds(user.id),
    hasTikTaskAccess(user.id),
  ]);
  const channels = allChannels.filter((c) => canAccessChannel(user.role, c, userGroupIds));
  const totalXp = xpAgg._sum.amount ?? 0;

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 shrink-0 flex-col border-r border-off-white/10 bg-off-white/[0.02] px-4 py-5 print:hidden">
        <div className="mb-6 px-2">
          <Logo height={22} />
        </div>

        {tikTaskAccess && (
          <Link
            href="/apps/tiktask"
            className="mb-2 flex items-center justify-between rounded-lg border border-orange/30 bg-orange/10 px-3 py-2 font-body text-sm font-semibold text-orange transition hover:bg-orange/15"
          >
            TikTask
            <span>→</span>
          </Link>
        )}

        <div className="mb-4 flex flex-col gap-0.5">
          <Link
            href="/members"
            className="rounded-lg px-3 py-1.5 font-body text-sm text-off-white/60 transition hover:bg-off-white/5 hover:text-off-white/90"
          >
            Members
          </Link>
          <Link
            href="/rewards"
            className="rounded-lg px-3 py-1.5 font-body text-sm text-off-white/60 transition hover:bg-off-white/5 hover:text-off-white/90"
          >
            Rewards
          </Link>
          <Link
            href="/learn"
            className="rounded-lg px-3 py-1.5 font-body text-sm text-off-white/60 transition hover:bg-off-white/5 hover:text-off-white/90"
          >
            Learn
          </Link>
          <Link
            href="/account"
            className="rounded-lg px-3 py-1.5 font-body text-sm text-off-white/60 transition hover:bg-off-white/5 hover:text-off-white/90"
          >
            Account
          </Link>
        </div>

        <ChannelSidebar channels={channels} />

        <div className="mt-auto flex flex-col gap-3 border-t border-off-white/10 pt-4">
          <div className="flex items-center justify-between px-2 font-body text-xs text-off-white/50">
            <span>🔥 {profile.streakCount} day streak</span>
            <span>{totalXp} XP</span>
          </div>
          <div className="flex items-center justify-between px-2">
            <span className="truncate font-body text-sm text-off-white/80">
              {user.name || user.email}
            </span>
            <SignOutButton />
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
