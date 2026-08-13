import Link from "next/link";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import {
  canAccessChannel,
  ensureUserInHomeGroup,
  getHomeGroup,
  getUserGroupIds,
  hasTikTaskAccess,
} from "@/lib/groups";
import { hasPersonalTasksAccess } from "@/lib/personalTasks";
import { isAdminRole } from "@/lib/rbac";
import { touchPresence } from "@/lib/presence";
import Logo from "@/components/Logo";
import ChannelSidebar from "@/components/ChannelSidebar";
import SignOutButton from "@/components/SignOutButton";
import MobileShell from "@/components/MobileShell";
import PresenceBeacon from "@/components/PresenceBeacon";
import { aggregateUnreadByGroup, getChannelUnreadCounts } from "@/lib/channelReads";
import { getBugReportUnreadCount } from "@/lib/bugReads";
import { getChatDisplayName } from "@/lib/memberDisplay";
import { isLegacyBugChannelName } from "@/lib/bugs";
import HubBugNavLink from "@/components/HubBugNavLink";
import GroupServerRail from "@/components/groups/GroupServerRail";
import EnsureDefaultHomeGroup from "@/components/groups/EnsureDefaultHomeGroup";
import {
  ACTIVE_GROUP_COOKIE,
  filterChannelsForActiveGroup,
  resolveActiveGroupId,
} from "@/lib/activeGroup";
import { hubHas } from "@/lib/hub/modules";

export default async function AppShell({ children }: { children: React.ReactNode }) {
  const { user, profile } = await requireProfile();

  await touchPresence(user.id).catch(() => {});
  await ensureUserInHomeGroup(user.id).catch(() => {});

  const [
    allChannels,
    xpAgg,
    userGroupIds,
    tikTaskAccess,
    personalTasksAccess,
    tiktokConnection,
    tiktokStats,
    hubBugUnread,
    assignedProjectCount,
    homeGroup,
    allGroups,
  ] = await Promise.all([
    prisma.channel.findMany({
      orderBy: { createdAt: "asc" },
      include: { groups: { select: { id: true, isHome: true } } },
    }),
    prisma.xPEvent.aggregate({ where: { userId: user.id }, _sum: { amount: true } }),
    getUserGroupIds(user.id),
    hasTikTaskAccess(user.id),
    hasPersonalTasksAccess(user.id),
    prisma.tikTokConnection.findUnique({
      where: { userId: user.id },
      select: { displayName: true, avatarUrl: true },
    }),
    prisma.tikTokStatsSnapshot.findUnique({
      where: { userId: user.id },
      select: { nickname: true, avatarUrl: true, uniqueId: true },
    }),
    getBugReportUnreadCount(user.id),
    prisma.project.count({
      where: {
        status: { not: "ARCHIVED" },
        OR: [
          { members: { some: { userId: user.id } } },
          { tasks: { some: { assigneeId: user.id } } },
        ],
      },
    }),
    getHomeGroup(),
    prisma.group.findMany({
      select: {
        id: true,
        name: true,
        color: true,
        imageUrl: true,
        isHome: true,
        showInList: true,
      },
      orderBy: [{ isHome: "desc" }, { name: "asc" }],
    }),
  ]);

  const accessible = allChannels.filter(
    (c) => canAccessChannel(user.role, c, userGroupIds) && !isLegacyBugChannelName(c.name)
  );

  const isAdmin = isAdminRole(user.role);
  // Network categories (showInList=false) stay out of the rail / active-space switcher.
  const listableGroups = allGroups.filter((g) => g.isHome || g.showInList);
  const allowedGroupIds = isAdmin
    ? listableGroups.map((g) => g.id)
    : listableGroups.filter((g) => userGroupIds.includes(g.id)).map((g) => g.id);

  const activeGroupCookie = cookies().get(ACTIVE_GROUP_COOKIE)?.value;
  const activeGroupId = resolveActiveGroupId(
    activeGroupCookie,
    allowedGroupIds,
    homeGroup?.id ?? null
  );

  const channels = filterChannelsForActiveGroup(
    accessible,
    activeGroupId,
    homeGroup?.id ?? null
  );

  const unreadCounts = await getChannelUnreadCounts(
    user.id,
    accessible.map((c) => c.id)
  );

  const homeGroupId = homeGroup?.id ?? null;
  const unreadByGroup = aggregateUnreadByGroup(accessible, unreadCounts, homeGroupId);

  const totalXp = xpAgg._sum.amount ?? 0;
  const showMyProjects = !isAdmin && assignedProjectCount > 0;
  const sidebarLabel = getChatDisplayName({
    name: user.name ?? null,
    profile: { socialLinks: profile.socialLinks, username: profile.username },
    tiktokConnection: tiktokConnection
      ? { displayName: tiktokConnection.displayName, avatarUrl: tiktokConnection.avatarUrl }
      : null,
    tiktokStatsSnapshot: tiktokStats,
  });

  const spaces = (isAdmin
    ? listableGroups
    : listableGroups.filter((g) => userGroupIds.includes(g.id))
  ).map((g) => ({
    id: g.id,
    name: g.name,
    color: g.color,
    imageUrl: g.imageUrl,
    isHome: g.isHome,
    unreadCount: unreadByGroup[g.id] ?? 0,
  }));

  const activeSpace =
    spaces.find((g) => g.id === activeGroupId) ??
    (homeGroupId ? spaces.find((g) => g.id === homeGroupId) ?? null : null);

  const rail = (
    <GroupServerRail spaces={spaces} activeGroupId={activeGroupId} />
  );

  const sidebar = (
    <>
      <div className="mb-4 px-2 md:block">
        <Logo height={22} href="/home" />
      </div>

      {/* Active group + channels sit above the hub menu */}
      <div className="mb-4">
        <ChannelSidebar
          space={
            activeSpace
              ? {
                  id: activeSpace.id,
                  name: activeSpace.name,
                  color: activeSpace.color,
                  imageUrl: activeSpace.imageUrl,
                }
              : null
          }
          channels={channels.map((c) => ({
            id: c.id,
            name: c.name,
            unreadCount: unreadCounts[c.id] ?? 0,
          }))}
        />
      </div>

      <div className="mb-4 border-t border-off-white/10 pt-4">
        <p className="mb-2 px-3 font-body text-[11px] font-semibold uppercase tracking-wider text-off-white/35">
          Menu
        </p>
        <div className="flex flex-col gap-0.5">
          <Link
            href="/groups"
            className="rounded-lg px-3 py-1.5 font-body text-sm text-off-white/60 transition hover:bg-off-white/5 hover:text-off-white/90"
          >
            Groups
          </Link>
          <Link
            href="/home"
            className="rounded-lg px-3 py-1.5 font-body text-sm text-off-white/60 transition hover:bg-off-white/5 hover:text-off-white/90"
          >
            Dashboard
          </Link>
          {hubHas("tiktokInsights") && (
            <Link
              href="/live"
              className="rounded-lg px-3 py-1.5 font-body text-sm text-orange/90 transition hover:bg-orange/10 hover:text-orange"
            >
              Live
            </Link>
          )}
          {showMyProjects && hubHas("projects") && (
            <Link
              href="/apps/projects"
              className="rounded-lg px-3 py-1.5 font-body text-sm text-off-white/60 transition hover:bg-off-white/5 hover:text-off-white/90"
            >
              Projects
            </Link>
          )}
          {personalTasksAccess && hubHas("personalTasks") && (
            <Link
              href="/apps/tasks"
              className="rounded-lg px-3 py-1.5 font-body text-sm text-off-white/60 transition hover:bg-off-white/5 hover:text-off-white/90"
            >
              My Tasks
            </Link>
          )}
          {hubHas("calendar") && (
            <Link
              href="/calendar"
              className="rounded-lg px-3 py-1.5 font-body text-sm text-off-white/60 transition hover:bg-off-white/5 hover:text-off-white/90"
            >
              Calendar
            </Link>
          )}
          <Link
            href="/members"
            className="rounded-lg px-3 py-1.5 font-body text-sm text-off-white/60 transition hover:bg-off-white/5 hover:text-off-white/90"
          >
            Members
          </Link>
          {hubHas("rewards") && (
            <Link
              href="/rewards"
              className="rounded-lg px-3 py-1.5 font-body text-sm text-off-white/60 transition hover:bg-off-white/5 hover:text-off-white/90"
            >
              Rewards
            </Link>
          )}
          {hubHas("learning") && (
            <Link
              href="/learn"
              className="rounded-lg px-3 py-1.5 font-body text-sm text-off-white/60 transition hover:bg-off-white/5 hover:text-off-white/90"
            >
              Learn
            </Link>
          )}
          {hubHas("webinars") && (
            <Link
              href="/webinars"
              className="rounded-lg px-3 py-1.5 font-body text-sm text-off-white/60 transition hover:bg-off-white/5 hover:text-off-white/90"
            >
              Webinars
            </Link>
          )}
          {hubHas("hubBug") && (
            <HubBugNavLink initialCount={hubBugUnread} />
          )}
          <Link
            href="/account"
            className="rounded-lg px-3 py-1.5 font-body text-sm text-off-white/60 transition hover:bg-off-white/5 hover:text-off-white/90"
          >
            Account
          </Link>
          {tikTaskAccess && hubHas("tiktask") && (
            <Link
              href="/apps/tiktask"
              className="rounded-lg py-1.5 pl-6 pr-3 font-body text-sm text-off-white/45 transition hover:bg-off-white/5 hover:text-off-white/75"
            >
              TikTask
            </Link>
          )}
        </div>
      </div>

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
    <MobileShell rail={rail} sidebar={sidebar} showAdminFab={isAdmin}>
      <EnsureDefaultHomeGroup
        homeGroupId={homeGroup?.id ?? null}
        hasCookie={Boolean(activeGroupCookie)}
      />
      <PresenceBeacon />
      {children}
    </MobileShell>
  );
}
