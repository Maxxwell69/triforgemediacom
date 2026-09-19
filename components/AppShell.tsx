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
import { getSupportTicketUnreadCount } from "@/lib/supportReads";
import { getSuggestionUnreadCount } from "@/lib/suggestionReads";
import { getChatDisplayName } from "@/lib/memberDisplay";
import { isLegacyBugChannelName } from "@/lib/bugs";
import HubBugNavLink from "@/components/HubBugNavLink";
import SupportNavLink from "@/components/support/SupportNavLink";
import SuggestionNavLink from "@/components/suggestions/SuggestionNavLink";
import GroupServerRail from "@/components/groups/GroupServerRail";
import EnsureDefaultHomeGroup from "@/components/groups/EnsureDefaultHomeGroup";
import {
  ACTIVE_GROUP_COOKIE,
  filterChannelsForActiveGroup,
  resolveActiveGroupId,
} from "@/lib/activeGroup";
import { hubHas } from "@/lib/hub/modules";
import { channelVoiceEnabled } from "@/lib/voiceAccess";
import NotificationBell from "@/components/NotificationBell";
import { canSeeMemberProgressNav, maybeAutoEnrollProgression } from "@/lib/progression/access";
import { syncSpecialtyGroupAccess } from "@/lib/progression/engine";
import { getOnboardingMenuLock } from "@/lib/onboarding/engine";
import { canSeeOnboardingMenuItem } from "@/lib/onboarding/menu";
import OnboardingMenuGate from "@/components/onboarding/OnboardingMenuGate";

async function countUnreadHubNotifications(userId: string): Promise<number> {
  try {
    return await prisma.hubNotification.count({ where: { userId, readAt: null } });
  } catch (err) {
    console.error("hubNotification count failed:", err);
    return 0;
  }
}

export default async function AppShell({ children }: { children: React.ReactNode }) {
  const { user, profile } = await requireProfile();

  await touchPresence(user.id).catch(() => {});
  await ensureUserInHomeGroup(user.id).catch(() => {});
  if (hubHas("progression")) {
    await maybeAutoEnrollProgression(user.id, user.role).catch(() => {});
    await syncSpecialtyGroupAccess(user.id).catch(() => {});
  }

  const unreadNotifications = await countUnreadHubNotifications(user.id).catch(() => 0);

  const [
    allChannels,
    xpAgg,
    userGroupIds,
    tikTaskAccess,
    personalTasksAccess,
    tiktokConnection,
    tiktokStats,
    hubBugUnread,
    supportUnread,
    suggestionUnread,
    assignedProjectCount,
    homeGroup,
    showProgress,
    allGroups,
    menuLock,
  ] = await Promise.all([
    prisma.channel.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        groups: { select: { id: true, isHome: true, grantsVoiceAccess: true } },
      },
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
    hubHas("support")
      ? getSupportTicketUnreadCount(user.id, user.role)
      : Promise.resolve(0),
    hubHas("support")
      ? getSuggestionUnreadCount(user.id)
      : Promise.resolve(0),
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
    canSeeMemberProgressNav(user.role),
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
    getOnboardingMenuLock(user.id, user.role),
  ]);

  const accessible = allChannels.filter(
    (c) => canAccessChannel(user.role, c, userGroupIds) && !isLegacyBugChannelName(c.name)
  );

  const isAdmin = isAdminRole(user.role);
  const canMenu = (id: string) => canSeeOnboardingMenuItem(menuLock, id);
  const showGroupChrome = canMenu("groups") || canMenu("chat");
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

  const rail = showGroupChrome ? (
    <GroupServerRail spaces={spaces} activeGroupId={activeGroupId} />
  ) : undefined;

  const sidebar = (
    <>
      <div className="mb-4 px-2 md:block">
        <Logo height={22} href="/home" variant="chrome" />
      </div>

      {showGroupChrome && (
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
            hasVoice: channelVoiceEnabled(c),
          }))}
        />
      </div>
      )}

      <div className="mb-4 border-t border-off-white/10 pt-4">
        <p className="mb-2 px-3 font-body text-[11px] font-semibold uppercase tracking-wider text-off-white/35">
          Menu
        </p>
        <div className="flex flex-col gap-0.5">
          {canMenu("groups") && (
            <Link
              href="/groups"
              className="rounded-lg px-3 py-1.5 font-body text-sm text-off-white/60 transition hover:bg-off-white/5 hover:text-off-white/90"
            >
              Groups
            </Link>
          )}
          <Link
            href="/home"
            className="rounded-lg px-3 py-1.5 font-body text-sm text-off-white/60 transition hover:bg-off-white/5 hover:text-off-white/90"
          >
            Dashboard
          </Link>
          {canMenu("live") && hubHas("tiktokInsights") && (
            <Link
              href="/live"
              className="rounded-lg px-3 py-1.5 font-body text-sm text-orange/90 transition hover:bg-orange/10 hover:text-orange"
            >
              Live
            </Link>
          )}
          {canMenu("streamingKit") && hubHas("streamingKit") && (
            <Link
              href="/streaming-kit"
              className="rounded-lg px-3 py-1.5 font-body text-sm text-off-white/60 transition hover:bg-off-white/5 hover:text-off-white/90"
            >
              Streaming kit
            </Link>
          )}
          {canMenu("projects") && showMyProjects && hubHas("projects") && (
            <Link
              href="/apps/projects"
              className="rounded-lg px-3 py-1.5 font-body text-sm text-off-white/60 transition hover:bg-off-white/5 hover:text-off-white/90"
            >
              Projects
            </Link>
          )}
          {canMenu("personalTasks") && personalTasksAccess && hubHas("personalTasks") && (
            <Link
              href="/apps/tasks"
              className="rounded-lg px-3 py-1.5 font-body text-sm text-off-white/60 transition hover:bg-off-white/5 hover:text-off-white/90"
            >
              My Tasks
            </Link>
          )}
          {canMenu("campaigns") && hubHas("hubCampaigns") && (
            <Link
              href="/campaigns"
              className="rounded-lg px-3 py-1.5 font-body text-sm text-off-white/60 transition hover:bg-off-white/5 hover:text-off-white/90"
            >
              Campaigns
            </Link>
          )}
          {canMenu("calendar") && hubHas("calendar") && (
            <Link
              href="/calendar"
              className="rounded-lg px-3 py-1.5 font-body text-sm text-off-white/60 transition hover:bg-off-white/5 hover:text-off-white/90"
            >
              Calendar
            </Link>
          )}
          {canMenu("members") && (
            <Link
              href="/members"
              className="rounded-lg px-3 py-1.5 font-body text-sm text-off-white/60 transition hover:bg-off-white/5 hover:text-off-white/90"
            >
              Members
            </Link>
          )}
          {canMenu("progress") && showProgress && (
            <Link
              href="/progress"
              className="rounded-lg px-3 py-1.5 font-body text-sm text-off-white/60 transition hover:bg-off-white/5 hover:text-off-white/90"
            >
              Progress
            </Link>
          )}
          {canMenu("shop") && hubHas("shop") && (
            <Link
              href="/shop"
              className="rounded-lg px-3 py-1.5 font-body text-sm text-off-white/60 transition hover:bg-off-white/5 hover:text-off-white/90"
            >
              Shop
            </Link>
          )}
          {canMenu("rewards") && hubHas("rewards") && (
            <Link
              href="/rewards"
              className="rounded-lg px-3 py-1.5 font-body text-sm text-off-white/60 transition hover:bg-off-white/5 hover:text-off-white/90"
            >
              Rewards
            </Link>
          )}
          {canMenu("learn") && hubHas("learning") && (
            <Link
              href="/learn"
              className="rounded-lg px-3 py-1.5 font-body text-sm text-off-white/60 transition hover:bg-off-white/5 hover:text-off-white/90"
            >
              Learn
            </Link>
          )}
          {canMenu("webinars") && hubHas("webinars") && (
            <Link
              href="/webinars"
              className="rounded-lg px-3 py-1.5 font-body text-sm text-off-white/60 transition hover:bg-off-white/5 hover:text-off-white/90"
            >
              Webinars
            </Link>
          )}
          {canMenu("hubBug") && hubHas("hubBug") && (
            <HubBugNavLink initialCount={hubBugUnread} />
          )}
          {canMenu("support") && hubHas("support") && (
            <SupportNavLink initialCount={supportUnread} />
          )}
          {canMenu("suggestions") && hubHas("support") && (
            <SuggestionNavLink initialCount={suggestionUnread} />
          )}
          <Link
            href="/hubs"
            className="rounded-lg px-3 py-1.5 font-body text-sm text-off-white/60 transition hover:bg-off-white/5 hover:text-off-white/90"
          >
            Hubs
          </Link>
          <Link
            href="/account"
            className="rounded-lg px-3 py-1.5 font-body text-sm text-off-white/60 transition hover:bg-off-white/5 hover:text-off-white/90"
          >
            Account
          </Link>
          <Link
            href="/notifications"
            className="flex items-center justify-between rounded-lg px-3 py-1.5 font-body text-sm text-off-white/60 transition hover:bg-off-white/5 hover:text-off-white/90"
          >
            Notifications
            {unreadNotifications > 0 ? (
              <span className="rounded-full bg-orange px-1.5 font-body text-[10px] font-semibold text-off-white">
                {unreadNotifications > 99 ? "99+" : unreadNotifications}
              </span>
            ) : null}
          </Link>
          {canMenu("tiktask") && tikTaskAccess && hubHas("tiktask") && (
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
          <div className="flex items-center gap-1">
            <NotificationBell unread={unreadNotifications} />
            <SignOutButton />
          </div>
        </div>
      </div>
    </>
  );

  return (
    <MobileShell
      rail={rail}
      sidebar={sidebar}
      showAdminFab={isAdmin}
      headerRight={<NotificationBell unread={unreadNotifications} />}
    >
      <OnboardingMenuGate userId={user.id} role={user.role} allowedIds={menuLock} />
      <EnsureDefaultHomeGroup
        homeGroupId={homeGroup?.id ?? null}
        hasCookie={Boolean(activeGroupCookie)}
      />
      <PresenceBeacon />
      {children}
    </MobileShell>
  );
}
