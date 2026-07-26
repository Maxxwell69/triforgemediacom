import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { getUserPointsTotal } from "@/lib/points";
import { canAccessChannel, getUserGroupIds, hasTikTaskAccess } from "@/lib/groups";
import { isAdminRole } from "@/lib/rbac";
import { getOrGenerateTodayTasks } from "@/lib/tiktask";
import DashboardCard from "@/components/DashboardCard";

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

  const [allChannels, userGroupIds, tikTaskAccess, points, enrollments, memberCount, pendingRedemptions] =
    await Promise.all([
      prisma.channel.findMany({ include: { groups: { select: { id: true } } } }),
      getUserGroupIds(user.id),
      hasTikTaskAccess(user.id),
      getUserPointsTotal(user.id),
      prisma.enrollment.findMany({ where: { userId: user.id }, select: { completedAt: true } }),
      prisma.user.count({ where: { status: "ACTIVE", profile: { isNot: null } } }),
      isAdmin
        ? prisma.rewardRedemption.count({ where: { status: "PENDING" } })
        : Promise.resolve(0),
    ]);

  const visibleChannelCount = allChannels.filter((c) =>
    canAccessChannel(user.role, c, userGroupIds)
  ).length;
  const completedCourseCount = enrollments.filter((e) => e.completedAt).length;

  let tikTaskStat: string | null = null;
  if (tikTaskAccess) {
    const tasks = await getOrGenerateTodayTasks(profile.userId, profile);
    const doneCount = tasks.filter((t) => t.status === "DONE").length;
    tikTaskStat = `${doneCount}/${tasks.length} done today`;
  }

  const firstName = (user.name || user.email || "there").split(" ")[0].split("@")[0];

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="font-display text-5xl tracking-wide">
          {getGreeting()}, <span className="text-gradient">{firstName}</span>
        </h1>
        <p className="mt-2 font-body text-off-white/60">
          🔥 {profile.streakCount} day streak {" \u00b7 "} {points} XP {" \u00b7 "} here&apos;s
          what&apos;s happening.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <DashboardCard
            href="/channels"
            icon="💬"
            title="Chat"
            description="Jump into the conversation with the community."
            stat={`${visibleChannelCount} channel${visibleChannelCount === 1 ? "" : "s"}`}
            accent="cyan"
          />

          {tikTaskAccess && (
            <DashboardCard
              href="/apps/tiktask"
              icon="⚡"
              title="TikTask"
              description="Your personalized daily creator tasks."
              stat={tikTaskStat}
              accent="orange"
            />
          )}

          <DashboardCard
            href="/learn"
            icon="🎓"
            title="Learning Center"
            description="Courses, lessons, quizzes, and certificates."
            stat={`${completedCourseCount} course${completedCourseCount === 1 ? "" : "s"} completed`}
            accent="cyan"
          />

          <DashboardCard
            href="/rewards"
            icon="🎁"
            title="Rewards"
            description="Spend your points on real perks."
            stat={`${points} points available`}
            accent="orange"
          />

          <DashboardCard
            href="/members"
            icon="👥"
            title="Members"
            description="See who else is in the community."
            stat={`${memberCount} active member${memberCount === 1 ? "" : "s"}`}
            accent="cyan"
          />

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
      </div>
    </main>
  );
}
