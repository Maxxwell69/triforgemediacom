import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { canAccessChannel, getUserGroupIds, hasTikTaskAccess } from "@/lib/groups";
import { isAdminRole } from "@/lib/rbac";
import { canInitiateDm, isTrueAdmin } from "@/lib/dmAccess";
import Logo from "@/components/Logo";
import ChannelSidebar from "@/components/ChannelSidebar";
import SignOutButton from "@/components/SignOutButton";
import MobileShell from "@/components/MobileShell";
import { getChannelUnreadCounts } from "@/lib/channelReads";
import { getChatDisplayName } from "@/lib/memberDisplay";

export default async function AppShell({ children }: { children: React.ReactNode }) {
  const { user, profile } = await requireProfile();

  const [allChannels, xpAgg, userGroupIds, tikTaskAccess, canDm, dmCount, tiktokConnection] =
    await Promise.all([
      prisma.channel.findMany({
        orderBy: { createdAt: "asc" },
        include: { groups: { select: { id: true } } },
      }),
      prisma.xPEvent.aggregate({ where: { userId: user.id }, _sum: { amount: true } }),
      getUserGroupIds(user.id),
      hasTikTaskAccess(user.id),
      canInitiateDm(user.id, user.role),
      isTrueAdmin(user.role)
        ? prisma.directConversation.count()
        : prisma.directConversation.count({
            where: { participants: { some: { userId: user.id } } },
          }),
      prisma.tikTokConnection.findUnique({
        where: { userId: user.id },
        select: { displayName: true, avatarUrl: true },
      }),
    ]);
  const channels = allChannels.filter((c) => canAccessChannel(user.role, c, userGroupIds));
  const unreadCounts = await getChannelUnreadCounts(
    user.id,
    channels.map((c) => c.id)
  );
  const totalXp = xpAgg._sum.amount ?? 0;
  const isAdmin = isAdminRole(user.role);
  const showDms = canDm || dmCount > 0 || isTrueAdmin(user.role);
  const sidebarLabel = getChatDisplayName({
    name: user.name ?? null,
    profile: { socialLinks: profile.socialLinks, username: profile.username },
    tiktokConnection: tiktokConnection
      ? { displayName: tiktokConnection.displayName, avatarUrl: tiktokConnection.avatarUrl }
      : null,
  });

  const sidebar = (
    <>
      <div className="mb-6 px-2 md:block">
        <Logo height={22} href="/home" />
      </div>

      <Link
        href="/home"
        className="mb-2 flex items-center justify-between rounded-lg px-3 py-1.5 font-body text-sm text-off-white/60 transition hover:bg-off-white/5 hover:text-off-white/90"
      >
        Dashboard
      </Link>

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
          href="/webinars"
          className="rounded-lg px-3 py-1.5 font-body text-sm text-off-white/60 transition hover:bg-off-white/5 hover:text-off-white/90"
        >
          Webinars
        </Link>
        <Link
          href="/account"
          className="rounded-lg px-3 py-1.5 font-body text-sm text-off-white/60 transition hover:bg-off-white/5 hover:text-off-white/90"
        >
          Account
        </Link>
      </div>

      {showDms && (
        <Link
          href="/dms"
          className="mb-3 rounded-lg px-3 py-1.5 font-body text-sm text-off-white/60 transition hover:bg-off-white/5 hover:text-off-white/90"
        >
          Direct messages
        </Link>
      )}

      <ChannelSidebar
        channels={channels.map((c) => ({
          id: c.id,
          name: c.name,
          unreadCount: unreadCounts[c.id] ?? 0,
        }))}
      />

      <div className="mt-auto flex flex-col gap-3 border-t border-off-white/10 pt-4">
        {isAdmin && (
          <Link
            href="/admin"
            className="flex items-center justify-between rounded-lg border border-cyan/30 bg-cyan/10 px-3 py-2 font-body text-sm font-semibold text-cyan transition hover:bg-cyan/15"
          >
            Admin Panel
            <span>→</span>
          </Link>
        )}
        <div className="flex items-center justify-between px-2 font-body text-xs text-off-white/50">
          <span>🔥 {profile.streakCount} day streak</span>
          <span>{totalXp} XP</span>
        </div>
        <div className="flex items-center justify-between px-2">
          <span className="truncate font-body text-sm text-off-white/80">
            {sidebarLabel === "Member" ? user.email : sidebarLabel}
          </span>
          <SignOutButton />
        </div>
      </div>
    </>
  );

  return (
    <MobileShell sidebar={sidebar} showAdminFab={isAdmin}>
      {children}
    </MobileShell>
  );
}
