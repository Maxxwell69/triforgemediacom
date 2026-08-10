import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { adjustUserPoints } from "../actions";
import { getUserPointsTotal } from "@/lib/points";
import UserRoleSelect from "@/components/admin/UserRoleSelect";
import BanButton from "@/components/admin/BanButton";
import UserGroupsEditor from "@/components/admin/UserGroupsEditor";
import UserTagsEditor from "@/components/admin/UserTagsEditor";
import UserBadgesEditor from "@/components/admin/UserBadgesEditor";
import ResendInviteButton from "@/components/admin/ResendInviteButton";
import AdminAlertsToggle from "@/components/admin/AdminAlertsToggle";
import DirectoryVisibilityToggle from "@/components/admin/DirectoryVisibilityToggle";
import EffectCheckbox from "@/components/admin/EffectCheckbox";
import PersonalTasksToggle from "@/components/admin/PersonalTasksToggle";
import StartDmButton from "@/components/admin/StartDmButton";
import MemberAvatar from "@/components/MemberAvatar";
import CreatorInsightsPanel from "@/components/CreatorInsightsPanel";
import AdminTikTokLinkForm from "@/components/admin/AdminTikTokLinkForm";
import { getMemberDisplayName, getMemberAvatarUrl, getMemberInitial } from "@/lib/memberDisplay";
import { PLATFORM_LABELS } from "@/lib/platforms";
import { canInitiateDm } from "@/lib/dmAccess";
import { countryLabel, resolveApplyTrack } from "@/lib/applyTrack";
import { networkBadgeColor } from "@/lib/mnCn";
import { isOnline } from "@/lib/presence";
import { loadCreatorInsights } from "@/lib/creatorInsights";
import { refreshUserCreatorInsightsFormAction } from "../actions";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "text-cyan",
  INVITED: "text-off-white/50",
  BANNED: "text-orange",
  PENDING_APPLICATION: "text-off-white/50",
};

const REDEMPTION_STATUS_STYLES: Record<string, string> = {
  PENDING: "text-orange",
  FULFILLED: "text-cyan",
  CANCELLED: "text-off-white/40",
};

const SUBMISSION_STATUS_STYLES: Record<string, string> = {
  PENDING: "text-orange",
  APPROVED: "text-cyan",
  REJECTED: "text-off-white/40",
};

const XP_SOURCE_LABELS: Record<string, string> = {
  TASK_COMPLETION: "TikTask",
  MANUAL_ADJUSTMENT: "Manual adjustment",
  REWARD_REDEMPTION: "Reward redeemed",
  REWARD_REFUND: "Reward refunded",
  COURSE_COMPLETION: "Course completed",
  SOCIAL_SHARE: "Social share",
};

function formatDate(date: Date | null): string {
  if (!date) return "—";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function formatDateTime(date: Date | null): string {
  if (!date) return "—";
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function AdminUserDetailPage({
  params,
  searchParams,
}: {
  params: { userId: string };
  searchParams?: { insights?: string; insights_message?: string };
}) {
  const session = await auth();
  const currentUserId = session!.user.id;
  const canDm = await canInitiateDm(currentUserId, session!.user.role);
  const insightsStatus = searchParams?.insights;
  const insightsMessage = searchParams?.insights_message;

  const [user, allGroups, allTags, allBadges, insights] = await Promise.all([
    prisma.user.findUnique({
      where: { id: params.userId },
      include: {
        profile: true,
        application: { include: { reviewedBy: { select: { name: true, email: true } } } },
        groupMemberships: { include: { group: true } },
        tags: { include: { tag: true } },
        userBadges: { include: { badge: true }, orderBy: { awardedAt: "desc" } },
        tiktokConnection: true,
        enrollments: {
          include: { course: { include: { lessons: { select: { id: true } } } } },
          orderBy: { enrolledAt: "desc" },
        },
        certificates: true,
        rewardRedemptions: {
          include: { reward: { select: { name: true } } },
          orderBy: { redeemedAt: "desc" },
          take: 20,
        },
        assignmentSubmissions: {
          include: { assignment: { include: { lesson: { include: { course: { select: { title: true } } } } } } },
          orderBy: { submittedAt: "desc" },
          take: 20,
        },
        xpEvents: { orderBy: { createdAt: "desc" }, take: 25 },
      },
    }),
    prisma.group.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, color: true } }),
    prisma.tag.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, color: true } }),
    prisma.badge.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, icon: true } }),
    loadCreatorInsights(params.userId).catch((err) => {
      console.error("Admin user insights load failed:", err);
      return null;
    }),
  ]);

  if (!user) notFound();

  const isSelf = user.id === currentUserId;
  const isBanned = user.status === "BANNED";
  const groups = user.groupMemberships.map((m) => m.group);
  const tagIds = user.tags.map((t) => t.tagId);
  const badgeIds = user.userBadges.map((b) => b.badgeId);

  const lessonIds = user.enrollments.flatMap((e) => e.course.lessons.map((l) => l.id));
  const completedLessonIds =
    lessonIds.length > 0
      ? new Set(
          (
            await prisma.lessonProgress.findMany({
              where: { userId: user.id, lessonId: { in: lessonIds }, completedAt: { not: null } },
              select: { lessonId: true },
            })
          ).map((p) => p.lessonId)
        )
      : new Set<string>();

  const totalPoints = await getUserPointsTotal(user.id);

  const displayName = getMemberDisplayName(user);
  const avatarUrl = getMemberAvatarUrl(user);
  const initial = getMemberInitial(user);

  const answers = (user.application?.answers as Record<string, unknown> | null) ?? null;
  const hasAgency = answers?.hasAgency === "yes";
  const signupHandleRaw =
    typeof answers?.handle === "string" ? answers.handle.trim() : "";
  const signupHandle = signupHandleRaw
    ? signupHandleRaw.startsWith("@")
      ? signupHandleRaw
      : `@${signupHandleRaw.replace(/^@/, "")}`
    : null;
  const signupSocialLink =
    typeof answers?.socialLink === "string" && answers.socialLink.trim()
      ? answers.socialLink.trim()
      : null;
  const signupPlatform =
    typeof answers?.platform === "string" ? answers.platform : null;
  const countryCode =
    user.profile?.country ||
    (typeof answers?.country === "string" ? answers.country : null);
  const phone =
    user.profile?.phone || (typeof answers?.phone === "string" ? answers.phone : null);
  const trackInfo =
    answers?.country && typeof answers.country === "string"
      ? resolveApplyTrack({ country: answers.country, hasAgency })
      : answers
        ? {
            track: hasAgency ? ("MN" as const) : ("CN" as const),
            mnReason: hasAgency ? ("agency" as const) : null,
          }
        : null;
  const trackLabel = trackInfo
    ? trackInfo.track === "CN"
      ? "CN · US/CA · no agency"
      : trackInfo.mnReason === "country"
        ? "MN · outside US/CA"
        : "MN · has agency"
    : null;

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <Link href="/admin/users" className="font-body text-sm text-off-white/50 transition hover:text-off-white">
        &larr; All users
      </Link>

      {/* Header */}
      <div className="glass mt-4 flex flex-col gap-4 rounded-2xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <MemberAvatar
              avatarUrl={avatarUrl}
              initial={initial}
              size={56}
              textSize="text-xl"
              online={isOnline(user.lastSeenAt)}
            />
            <div>
              <p className="font-display text-2xl tracking-wide text-off-white">
                {displayName}
                {isSelf && <span className="ml-2 text-xs font-body text-off-white/40">(you)</span>}
              </p>
              <p className="font-body text-sm text-off-white/50">{user.email}</p>
              {signupHandle && (
                <p className="mt-1 font-body text-sm text-cyan">
                  Signup handle · <span className="font-semibold">{signupHandle}</span>
                  {signupPlatform ? (
                    <span className="text-off-white/40"> · {signupPlatform}</span>
                  ) : null}
                </p>
              )}
            </div>
          </div>
          <span
            className={`font-body text-xs font-semibold uppercase tracking-wide ${
              STATUS_STYLES[user.status] || "text-off-white/50"
            }`}
          >
            {user.status}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-off-white/10 pt-4">
          <div className="flex items-center gap-2">
            <span className="font-body text-xs text-off-white/40">Role</span>
            <UserRoleSelect userId={user.id} currentRole={user.role} disabled={isSelf} />
          </div>
          <BanButton userId={user.id} banned={isBanned} disabled={isSelf} />
          {user.status === "INVITED" && <ResendInviteButton userId={user.id} />}
          {user.role === "ADMIN" && (
            <AdminAlertsToggle userId={user.id} receivesAlerts={user.receivesAdminAlerts} />
          )}
          <DirectoryVisibilityToggle userId={user.id} hidden={user.hiddenFromDirectory} />
          <EffectCheckbox userId={user.id} effect={user.effect} />
          <PersonalTasksToggle userId={user.id} enabled={user.personalTasksEnabled} />
          {canDm && !isSelf && user.status === "ACTIVE" && (
            <StartDmButton userId={user.id} userName={displayName} />
          )}
        </div>
      </div>

      {/* Overview stats */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Points" value={String(totalPoints)} />
        <StatCard label="Member since" value={formatDate(user.createdAt)} />
        <StatCard label="Streak" value={user.profile ? `${user.profile.streakCount} days` : "—"} />
        <StatCard
          label="Platform"
          value={user.profile ? PLATFORM_LABELS[user.profile.platform] : "Not set"}
        />
        <StatCard
          label="Last login"
          value={user.lastLoginAt ? formatDateTime(user.lastLoginAt) : "Never"}
        />
        <StatCard
          label="Presence"
          value={
            isOnline(user.lastSeenAt)
              ? "Online now"
              : user.lastSeenAt
                ? `Last seen ${formatDateTime(user.lastSeenAt)}`
                : "—"
          }
        />
      </div>

      {/* Creator insights — admin view of tik.tools profile intel */}
      <section className="mt-6">
        <div className="glass rounded-2xl p-6">
          <h2 className="font-display text-lg tracking-wide text-off-white/80">
            CREATOR INSIGHTS
          </h2>
          <p className="mt-1 font-body text-xs text-off-white/40">
            TikTok reach, engagement ratios, bio link, and Diamond Rush league (when your tik.tools
            tier returns it). Same private panel the member sees on Account → Insights.
          </p>
          {insightsStatus === "refreshed" && (
            <p className="mt-3 rounded-lg border border-cyan/30 bg-cyan/10 px-4 py-3 font-body text-sm text-cyan">
              Creator insights updated from tik.tools.
            </p>
          )}
          {insightsStatus === "error" && (
            <p className="mt-3 rounded-lg border border-orange/30 bg-orange/10 px-4 py-3 font-body text-sm text-orange">
              {insightsMessage || "Couldn't refresh creator insights."}
            </p>
          )}
          <div className="mt-4">
            <AdminTikTokLinkForm
              userId={user.id}
              currentUrl={
                ((user.profile?.socialLinks as Record<string, string> | null) ?? {}).tiktok ?? ""
              }
            />
          </div>
        </div>
        <div className="mt-4">
          {insights ? (
            <CreatorInsightsPanel
              insights={insights}
              eyebrow="Creator insights · admin only"
              actions={
                <form action={refreshUserCreatorInsightsFormAction}>
                  <input type="hidden" name="userId" value={user.id} />
                  <button
                    type="submit"
                    className="rounded-lg border border-cyan/40 px-3 py-1.5 font-body text-xs font-semibold text-cyan transition hover:bg-cyan/10"
                  >
                    Refresh insights
                  </button>
                </form>
              }
            />
          ) : (
            <div className="glass flex flex-col items-start gap-3 rounded-2xl p-6">
              <p className="font-body text-sm text-off-white/55">
                No TikTok stats cached yet. Save a TikTok URL above, then refresh to pull creator
                insights from tik.tools.
              </p>
              <form action={refreshUserCreatorInsightsFormAction}>
                <input type="hidden" name="userId" value={user.id} />
                <button
                  type="submit"
                  className="rounded-lg bg-gradient-to-r from-orange to-cyan px-5 py-2 font-body text-sm font-semibold text-charcoal transition hover:opacity-90"
                >
                  Fetch creator insights
                </button>
              </form>
            </div>
          )}
        </div>
      </section>

      {/* Private contact — admin only; never shown on /members */}
      <section className="glass mt-6 rounded-2xl p-6">
        <h2 className="font-display text-lg tracking-wide text-off-white/80">
          PRIVATE CONTACT
        </h2>
        <p className="mt-1 font-body text-xs text-off-white/40">
          Visible to admins and the member only — not shown on the public member directory.
        </p>
        <div className="mt-3 grid grid-cols-1 gap-3 font-body text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs text-off-white/40">Phone</p>
            <p className="mt-0.5 text-off-white/80">
              {phone ? (
                <a href={`tel:${phone}`} className="text-cyan hover:underline">
                  {phone}
                </a>
              ) : (
                "—"
              )}
            </p>
          </div>
          <div>
            <p className="text-xs text-off-white/40">Country</p>
            <p className="mt-0.5 text-off-white/80">{countryLabel(countryCode)}</p>
          </div>
        </div>
      </section>

      {/* Groups / Tags / Badges */}
      <section className="glass mt-6 rounded-2xl p-6">
        <h2 className="font-display text-lg tracking-wide text-off-white/80">
          GROUPS, TAGS &amp; BADGES
        </h2>
        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          {groups.length === 0 && <span className="font-body text-xs text-off-white/30">No groups</span>}
          {groups.map((g) => {
            const color = networkBadgeColor(g.name, g.color, user.effect);
            return (
              <span
                key={g.id}
                className="rounded-full border px-2 py-0.5 font-body text-xs"
                style={{ borderColor: `${color}66`, color }}
              >
                {g.name}
              </span>
            );
          })}
          {user.tags.map((ut) => {
            const color = networkBadgeColor(ut.tag.name, ut.tag.color, user.effect);
            return (
              <span
                key={ut.tagId}
                className="rounded-full border px-2 py-0.5 font-body text-xs font-medium"
                style={{ borderColor: `${color}66`, color }}
              >
                {ut.tag.name}
              </span>
            );
          })}
          <UserGroupsEditor userId={user.id} allGroups={allGroups} memberGroupIds={groups.map((g) => g.id)} />
          <UserTagsEditor userId={user.id} allTags={allTags} memberTagIds={tagIds} />
          <UserBadgesEditor userId={user.id} allBadges={allBadges} memberBadgeIds={badgeIds} />
        </div>
        {user.userBadges.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-off-white/10 pt-4">
            {user.userBadges.map((ub) => (
              <span
                key={ub.id}
                title={`Awarded ${formatDate(ub.awardedAt)}`}
                className="flex items-center gap-1 rounded-full border border-off-white/15 px-2.5 py-1 font-body text-xs text-off-white/80"
              >
                <span aria-hidden="true">{ub.badge.icon || "🏆"}</span>
                {ub.badge.name}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Application */}
      {user.application && (
        <section className="glass mt-6 rounded-2xl p-6">
          <h2 className="font-display text-lg tracking-wide text-off-white/80">APPLICATION</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 font-body text-sm sm:grid-cols-3 lg:grid-cols-4">
            <div>
              <p className="text-xs text-off-white/40">Signup handle</p>
              <p className="mt-0.5 font-semibold text-cyan">{signupHandle || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-off-white/40">Platform (apply)</p>
              <p className="mt-0.5 text-off-white/80">{signupPlatform || "—"}</p>
            </div>
            <div className="col-span-2 sm:col-span-1 lg:col-span-2">
              <p className="text-xs text-off-white/40">Social link (apply)</p>
              <p className="mt-0.5 truncate text-off-white/80">
                {signupSocialLink ? (
                  <a
                    href={signupSocialLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan hover:underline"
                  >
                    {signupSocialLink}
                  </a>
                ) : (
                  "—"
                )}
              </p>
            </div>
            <div>
              <p className="text-xs text-off-white/40">Track</p>
              <p className="mt-0.5 text-off-white/80">{trackLabel || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-off-white/40">Submitted</p>
              <p className="mt-0.5 text-off-white/80">{formatDate(user.application.submittedAt)}</p>
            </div>
            <div>
              <p className="text-xs text-off-white/40">Status</p>
              <p className="mt-0.5 text-off-white/80">{user.application.status}</p>
            </div>
            <div>
              <p className="text-xs text-off-white/40">Reviewed</p>
              <p className="mt-0.5 text-off-white/80">
                {user.application.reviewedAt
                  ? `${formatDate(user.application.reviewedAt)}${
                      user.application.reviewedBy ? ` · ${user.application.reviewedBy.name}` : " · auto"
                    }`
                  : "—"}
              </p>
            </div>
          </div>
          {user.application.tiktokNetworkRequested && (
            <p className="mt-3 border-t border-off-white/10 pt-3 font-body text-xs text-cyan">
              Requested the Forge Creator Network on TikTok
              {user.application.tiktokNetworkRequestedAt &&
                ` on ${formatDate(user.application.tiktokNetworkRequestedAt)}`}
            </p>
          )}
        </section>
      )}

      {/* Courses */}
      <section className="glass mt-6 rounded-2xl p-6">
        <h2 className="font-display text-lg tracking-wide text-off-white/80">COURSES</h2>
        {user.enrollments.length === 0 ? (
          <p className="mt-3 font-body text-sm text-off-white/40">Not enrolled in any courses yet.</p>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            {user.enrollments.map((enrollment) => {
              const totalLessons = enrollment.course.lessons.length;
              const completedCount = enrollment.course.lessons.filter((l) =>
                completedLessonIds.has(l.id)
              ).length;
              const pct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
              const certificate = user.certificates.find((c) => c.courseId === enrollment.courseId);
              return (
                <div key={enrollment.id} className="rounded-xl border border-off-white/10 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-body text-sm font-medium text-off-white">{enrollment.course.title}</p>
                    <span
                      className={`font-body text-xs font-semibold uppercase tracking-wide ${
                        enrollment.completedAt ? "text-cyan" : "text-off-white/50"
                      }`}
                    >
                      {enrollment.completedAt ? "Completed" : "In progress"}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-off-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-orange to-cyan"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 font-body text-xs text-off-white/50">
                    <span>
                      {completedCount}/{totalLessons} lessons &middot; enrolled {formatDate(enrollment.enrolledAt)}
                    </span>
                    {enrollment.completedAt && (
                      <span className="text-off-white/50">
                        Completed {formatDate(enrollment.completedAt)}
                        {certificate && " · Certificate issued"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Points / XP history + adjust */}
      <section className="glass mt-6 rounded-2xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg tracking-wide text-off-white/80">
            POINTS &amp; XP HISTORY
          </h2>
          <form action={adjustUserPoints} className="flex items-center gap-1.5">
            <input type="hidden" name="userId" value={user.id} />
            <input
              type="number"
              name="amount"
              placeholder="±XP"
              required
              className="w-20 rounded-lg border border-off-white/15 bg-off-white/5 px-2 py-1 font-body text-xs text-off-white outline-none transition focus:border-cyan/60"
            />
            <input
              type="text"
              name="note"
              placeholder="Note (optional)"
              maxLength={280}
              className="w-44 rounded-lg border border-off-white/15 bg-off-white/5 px-2 py-1 font-body text-xs text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60"
            />
            <button
              type="submit"
              className="rounded-lg border border-cyan/40 px-2.5 py-1 font-body text-xs font-semibold text-cyan transition hover:bg-cyan/10"
            >
              Apply
            </button>
          </form>
        </div>
        {user.xpEvents.length === 0 ? (
          <p className="mt-3 font-body text-sm text-off-white/40">No XP activity yet.</p>
        ) : (
          <div className="mt-3 flex flex-col gap-1.5">
            {user.xpEvents.map((event) => (
              <div
                key={event.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-off-white/5 py-1.5 font-body text-sm last:border-0"
              >
                <div className="min-w-0">
                  <span className="text-off-white/70">{XP_SOURCE_LABELS[event.source] || event.source}</span>
                  {event.note && <span className="ml-2 text-xs text-off-white/40">{event.note}</span>}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={event.amount >= 0 ? "text-cyan" : "text-orange"}>
                    {event.amount >= 0 ? "+" : ""}
                    {event.amount}
                  </span>
                  <span className="text-xs text-off-white/40">{formatDateTime(event.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Rewards */}
      {user.rewardRedemptions.length > 0 && (
        <section className="glass mt-6 rounded-2xl p-6">
          <h2 className="font-display text-lg tracking-wide text-off-white/80">REWARD REDEMPTIONS</h2>
          <div className="mt-3 flex flex-col gap-1.5">
            {user.rewardRedemptions.map((r) => (
              <div
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-off-white/5 py-1.5 font-body text-sm last:border-0"
              >
                <span className="text-off-white/70">{r.reward.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-off-white/50">{r.pointsSpent} pts</span>
                  <span className={`text-xs font-semibold uppercase ${REDEMPTION_STATUS_STYLES[r.status]}`}>
                    {r.status}
                  </span>
                  <span className="text-xs text-off-white/40">{formatDate(r.redeemedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Assignments */}
      {user.assignmentSubmissions.length > 0 && (
        <section className="glass mt-6 rounded-2xl p-6">
          <h2 className="font-display text-lg tracking-wide text-off-white/80">ASSIGNMENT SUBMISSIONS</h2>
          <div className="mt-3 flex flex-col gap-1.5">
            {user.assignmentSubmissions.map((s) => (
              <div
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-off-white/5 py-1.5 font-body text-sm last:border-0"
              >
                <div className="min-w-0">
                  <span className="text-off-white/70">{s.assignment.title}</span>
                  <span className="ml-2 text-xs text-off-white/40">{s.assignment.lesson.course.title}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-xs font-semibold uppercase ${SUBMISSION_STATUS_STYLES[s.status]}`}>
                    {s.status}
                  </span>
                  <span className="text-xs text-off-white/40">{formatDate(s.submittedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-xl p-4">
      <p className="font-body text-xs uppercase tracking-wide text-off-white/40">{label}</p>
      <p className="mt-1 font-display text-xl text-off-white">{value}</p>
    </div>
  );
}
