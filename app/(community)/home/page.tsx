import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { getUserPointsTotal } from "@/lib/points";
import { canAccessChannel, getUserGroupIds, hasTikTaskAccess } from "@/lib/groups";
import { isAdminRole } from "@/lib/rbac";
import { getOrGenerateTodayTasks } from "@/lib/tiktask";
import DashboardCard from "@/components/DashboardCard";
import CompanySocialPanel from "@/components/CompanySocialPanel";
import { hubHas } from "@/lib/hub/modules";
import { canSeeMemberProgressNav } from "@/lib/progression/access";
import { loadHubAnnouncement } from "@/lib/announcement";
import VideoEmbed from "@/components/VideoEmbed";
import { listVisibleHubCampaigns } from "@/lib/hubCampaigns";
import { loadMemberOnboardings, loadRequiredCourseLinks, stepHref, getOnboardingMenuLock } from "@/lib/onboarding/engine";
import { canSeeOnboardingMenuItem } from "@/lib/onboarding/menu";
import HomeOnboardingCard from "@/components/onboarding/HomeOnboardingCard";
import HubDashboardLogo from "@/components/hub/HubDashboardLogo";

export const dynamic = "force-dynamic";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function HomePage() {
  const { user, profile } = await requireProfile();
  const isAdmin = isAdminRole(user.role);

  const [allChannels, userGroupIds, tikTaskAccess, points, enrollments, memberCount, pendingRedemptions, announcement] =
    await Promise.all([
      prisma.channel.findMany({ include: { groups: { select: { id: true, isHome: true } } } }),
      getUserGroupIds(user.id),
      hasTikTaskAccess(user.id),
      getUserPointsTotal(user.id),
      prisma.enrollment.findMany({ where: { userId: user.id }, select: { completedAt: true } }),
      prisma.user.count({
        where: { status: "ACTIVE", profile: { isNot: null }, hiddenFromDirectory: false },
      }),
      isAdmin
        ? prisma.rewardRedemption.count({ where: { status: "PENDING" } })
        : Promise.resolve(0),
      loadHubAnnouncement(),
    ]);

  const visibleChannelCount = allChannels.filter((c) =>
    canAccessChannel(user.role, c, userGroupIds)
  ).length;
  const completedCourseCount = enrollments.filter((e) => e.completedAt).length;

  let tikTaskStat: string | null = null;
  if (tikTaskAccess && hubHas("tiktask")) {
    const tasks = await getOrGenerateTodayTasks(profile.userId, profile);
    const doneCount = tasks.filter((t) => t.status === "DONE").length;
    tikTaskStat = `${doneCount}/${tasks.length} done today`;
  }

  const firstName = (user.name || user.email || "there").split(" ")[0].split("@")[0];
  const [showProgress, menuLock] = await Promise.all([
    canSeeMemberProgressNav(user.role),
    hubHas("onboardingChecklist") ? getOnboardingMenuLock(user.id, user.role) : Promise.resolve(null),
  ]);
  const canMenu = (id: string) => canSeeOnboardingMenuItem(menuLock, id);

  const onboardingCards = hubHas("onboardingChecklist")
    ? (await loadMemberOnboardings(user.id)).filter((card) => card.progress.status === "IN_PROGRESS")
    : [];
  const onboardingCourseLinks = await Promise.all(
    onboardingCards.map((card) => loadRequiredCourseLinks(user.id, card.config.requiredCourseIds))
  );
  const courseIdsFromSteps = Array.from(
    new Set(
      onboardingCards.flatMap((card) =>
        card.steps
          .filter((step) => step.actionType === "COURSE_LINK" && step.actionTarget)
          .map((step) => step.actionTarget as string)
      )
    )
  );
  const stepCourses =
    courseIdsFromSteps.length > 0
      ? await prisma.course.findMany({
          where: { id: { in: courseIdsFromSteps } },
          select: { id: true, title: true },
        })
      : [];
  const stepCourseTitle = new Map(stepCourses.map((course) => [course.id, course.title]));

  let campaignStat: string | null = null;
  if (hubHas("hubCampaigns")) {
    try {
      const visibleCampaigns = await listVisibleHubCampaigns(user.id, user.role);
      const openCount = visibleCampaigns.filter((c) => c.status === "OPEN").length;
      campaignStat = `${openCount} open`;
    } catch (err) {
      console.error("hubCampaign list failed:", err);
    }
  }

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <HubDashboardLogo />
        {announcement?.isActive && (
          <div className="glass mb-8 flex flex-col gap-3 rounded-2xl border border-orange/30 bg-orange/5 p-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-xl" aria-hidden="true">
                📣
              </span>
              <p className="font-body text-sm text-off-white/90">{announcement.message}</p>
            </div>
            {announcement.videoUrl ? (
              <div className="max-w-2xl">
                <VideoEmbed url={announcement.videoUrl} />
              </div>
            ) : null}
          </div>
        )}

        <h1 className="font-display text-5xl tracking-wide">
          {getGreeting()}, <span className="text-gradient">{firstName}</span>
        </h1>
        <p className="mt-2 font-body text-off-white/60">
          🔥 {profile.streakCount} day streak {" \u00b7 "} {points} XP {" \u00b7 "} here&apos;s
          what&apos;s happening.
        </p>

        {onboardingCards.length > 0 && (
          <div className="mt-8 flex flex-col gap-4">
            {onboardingCards.map((card, index) => (
              <HomeOnboardingCard
                key={card.config.id}
                moduleId={card.config.id}
                title={card.config.title}
                steps={card.steps.map((step) => ({
                  id: step.id,
                  title: step.title,
                  description: step.description,
                  href: stepHref(step),
                  courseTitle:
                    step.actionType === "COURSE_LINK" && step.actionTarget
                      ? stepCourseTitle.get(step.actionTarget) ?? null
                      : null,
                  done: card.completedStepIds.includes(step.id),
                  xpReward: step.xpReward,
                }))}
                disclaimer={card.config.dismissalDisclaimerText}
                requiredCourses={onboardingCourseLinks[index] ?? []}
                completionXpReward={card.config.completionXpReward}
                explainerVideoUrl={card.config.explainerVideoUrl}
              />
            ))}
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {canMenu("chat") && hubHas("chat") && (
            <DashboardCard
              href="/channels"
              icon="💬"
              title="Chat"
              description="Jump into the conversation with the community."
              stat={`${visibleChannelCount} channel${visibleChannelCount === 1 ? "" : "s"}`}
              accent="cyan"
            />
          )}

          {canMenu("live") && hubHas("tiktokInsights") && (
            <DashboardCard
              href="/live"
              icon="🔴"
              title="Who's Live"
              description="Community creators currently live on TikTok."
              accent="orange"
            />
          )}

          {canMenu("streamingKit") && hubHas("streamingKit") && (
            <DashboardCard
              href="/streaming-kit"
              icon="🎬"
              title="Streaming kit"
              description="Forge logos, frames, and overlays for OBS and LIVE Studio."
              accent="orange"
            />
          )}

          {canMenu("tiktask") && tikTaskAccess && hubHas("tiktask") && (
            <DashboardCard
              href="/apps/tiktask"
              icon="⚡"
              title="TikTask"
              description="Your personalized daily creator tasks."
              stat={tikTaskStat}
              accent="orange"
            />
          )}

          {canMenu("learn") && hubHas("learning") && (
            <DashboardCard
              href="/learn"
              icon="🎓"
              title="Learning Center"
              description="Courses, lessons, quizzes, and certificates."
              stat={`${completedCourseCount} course${completedCourseCount === 1 ? "" : "s"} completed`}
              accent="cyan"
            />
          )}

          {canMenu("webinars") && hubHas("webinars") && (
            <DashboardCard
              href="/webinars"
              icon="🎥"
              title="Webinars"
              description="Join live sessions with the TriForge team."
              accent="orange"
            />
          )}

          {canMenu("campaigns") && hubHas("hubCampaigns") && (
            <DashboardCard
              href="/campaigns"
              icon="🎯"
              title="Campaigns"
              description="Sign up for interviews, meetings, games, and battles."
              stat={campaignStat}
              accent="cyan"
            />
          )}

          {canMenu("progress") && showProgress && (
            <DashboardCard
              href="/progress"
              icon="🛤️"
              title="Progression"
              description="Your creator ladder, missions, certs, and badges."
              accent="cyan"
            />
          )}

          {canMenu("shop") && hubHas("shop") && (
            <DashboardCard
              href="/shop"
              icon="🛍️"
              title="Shop"
              description="Merch and digital downloads — pay on the hub."
              accent="orange"
            />
          )}

          {canMenu("support") && hubHas("support") && (
            <DashboardCard
              href="/support"
              icon="🎧"
              title="Support"
              description="FAQ and tickets — replies stay in the hub."
              accent="cyan"
            />
          )}

          {canMenu("suggestions") && hubHas("support") && (
            <DashboardCard
              href="/suggestions"
              icon="💡"
              title="Suggestions"
              description="Pitch hub ideas. Staff tags Accepted, Working on it, Applied, or Rejected."
              accent="orange"
            />
          )}

          {canMenu("rewards") && hubHas("rewards") && (
            <DashboardCard
              href="/rewards"
              icon="🎁"
              title="Rewards"
              description="Spend points on perks — or check the XP leaderboard."
              stat={`${points} points available`}
              accent="orange"
            />
          )}

          {canMenu("groups") && (
            <DashboardCard
              href="/groups"
              icon="🏠"
              title="Groups"
              description="Home hub plus inviteable spaces."
              accent="cyan"
            />
          )}

          {canMenu("members") && (
            <DashboardCard
              href="/members"
              icon="👥"
              title="Members"
              description="See who else is in the community."
              stat={`${memberCount} active member${memberCount === 1 ? "" : "s"}`}
              accent="cyan"
            />
          )}

          <DashboardCard
            href="/account"
            icon="⚙️"
            title="Account"
            description="Update your profile, platforms, and password."
            accent="cyan"
          />

          {isAdmin && (
            <DashboardCard
              href="/admin"
              icon="🛠️"
              title="Admin Panel"
              description="Manage applications, users, courses, and rewards."
              stat={
                pendingRedemptions > 0
                  ? `${pendingRedemptions} pending redemption${pendingRedemptions === 1 ? "" : "s"}`
                  : "All caught up"
              }
              accent="orange"
            />
          )}
        </div>

        {!menuLock && hubHas("companySocial") && <CompanySocialPanel />}
      </div>
    </main>
  );
}
