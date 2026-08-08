import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { getUserPointsTotal } from "@/lib/points";
import { activeGoalKeys } from "@/lib/goals";
import { hydrateProfileContactFromApplication } from "@/lib/profileContact";
import { getTikTokUsername } from "@/lib/memberDisplay";
import { parseTikTokUniqueId } from "@/lib/tiktools";
import { ensureTikTokSocialLink, ensureTikTokStatsIfMissing } from "@/lib/tiktokStats";
import ProfileEditForm from "./ProfileEditForm";
import ChangeEmailForm from "./ChangeEmailForm";
import ChangePasswordForm from "./ChangePasswordForm";
import TagPicker from "@/components/TagPicker";
import DisplayNamePreference from "@/components/DisplayNamePreference";
import NameIdentityForm from "./NameIdentityForm";
import CreatorInsightsPanel from "@/components/CreatorInsightsPanel";
import BroadcastEmailPreference from "@/components/account/BroadcastEmailPreference";
import BookingSchedulePanel from "@/components/account/BookingSchedulePanel";
import AccountFeatureLink from "@/components/account/AccountFeatureLink";
import { refreshTikTokStatsAction } from "./actions";
import { networkBadgeColor } from "@/lib/mnCn";
import { loadCreatorInsights } from "@/lib/creatorInsights";
import { isAdminRole } from "@/lib/rbac";
import { bookingPageUrl } from "@/lib/booking";

export default async function AccountPage({
  searchParams,
}: {
  searchParams?: { tiktok?: string; tiktok_message?: string };
}) {
  const { user, profile } = await requireProfile();
  const contact = await hydrateProfileContactFromApplication(user.id);

  await ensureTikTokSocialLink(user.id);
  await ensureTikTokStatsIfMissing(user.id).catch((err) => {
    console.error("Auto TikTok stats fetch failed:", err);
  });

  const refreshedProfile = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: { socialLinks: true, username: true },
  });

  const isStaff = isAdminRole(user.role);

  const [points, userBadges, certificates, tiktokStats, insights, selfAssignableTags, myTags, prefsRow, bookingPage] =
    await Promise.all([
      getUserPointsTotal(user.id),
      prisma.userBadge.findMany({
        where: { userId: user.id },
        include: { badge: true },
        orderBy: { awardedAt: "desc" },
      }),
      prisma.certificate.findMany({
        where: { userId: user.id },
        include: { course: { select: { title: true } } },
        orderBy: { issuedAt: "desc" },
      }),
      prisma.tikTokStatsSnapshot.findUnique({ where: { userId: user.id } }),
      loadCreatorInsights(user.id),
      prisma.tag.findMany({ where: { selfAssignable: true }, orderBy: { name: "asc" } }),
      prisma.userTag.findMany({ where: { userId: user.id }, include: { tag: true } }),
      prisma.user.findUnique({
        where: { id: user.id },
        select: { effect: true, broadcastEmailsOptIn: true },
      }),
      isStaff
        ? prisma.bookingPage.findUnique({
            where: { hostUserId: user.id },
            include: {
              weeklyWindows: { orderBy: [{ dayOfWeek: "asc" }, { startMinute: "asc" }] },
            },
          })
        : Promise.resolve(null),
    ]);
  const effectEnabled = prefsRow?.effect ?? false;
  const broadcastEmailsOptIn = prefsRow?.broadcastEmailsOptIn ?? true;

  const myTagIds = myTags.map((ut) => ut.tagId);
  const adminOnlyTags = myTags.map((ut) => ut.tag).filter((tag) => !tag.selfAssignable);
  const socialLinks =
    (refreshedProfile?.socialLinks as Record<string, string> | null) ??
    ((profile.socialLinks as Record<string, string> | null) ?? {});
  const tiktokUniqueId = parseTikTokUniqueId(socialLinks.tiktok);

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-5xl tracking-wide">
          YOUR <span className="text-gradient">ACCOUNT</span>
        </h1>
        <p className="mt-2 font-body text-off-white/60">
          Jump into hub tools, or manage security and profile settings below.
        </p>

        <div className="mt-6 flex gap-4">
          <div className="glass flex-1 rounded-xl p-4 text-center">
            <p className="font-display text-3xl text-gradient">{points}</p>
            <p className="mt-1 font-body text-xs uppercase tracking-wide text-off-white/50">
              Points
            </p>
          </div>
          <div className="glass flex-1 rounded-xl p-4 text-center">
            <p className="font-display text-3xl">🔥 {profile.streakCount}</p>
            <p className="mt-1 font-body text-xs uppercase tracking-wide text-off-white/50">
              Day streak
            </p>
          </div>
        </div>

        {/* ---------- Major features ---------- */}
        <h2 className="mt-10 font-display text-2xl tracking-wide text-off-white/80">
          Features
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <AccountFeatureLink
            href="/calendar"
            title="Calendar"
            description="See scheduled hub meetings, events, and webinars."
            accent="cyan"
          />
          {isStaff && (
            <AccountFeatureLink
              href="#booking"
              title="Booking"
              description="Set weekly availability and share your booking link."
              accent="orange"
            />
          )}
          <AccountFeatureLink
            href="#insights"
            title="Creator Insights"
            description="Private TikTok stats and live status for your account."
            accent="orange"
          />
          <AccountFeatureLink
            href="#profile"
            title="Profile"
            description="Name, socials, tags, badges, and display preferences."
            accent="cyan"
          />
          <AccountFeatureLink
            href="#security"
            title="Security"
            description="Email, password, and announcement preferences."
            accent="cyan"
          />
          {isStaff && (
            <AccountFeatureLink
              href="/admin/calendar"
              title="Hub Events"
              description="Schedule meetings and events for the member calendar."
              accent="orange"
            />
          )}
        </div>

        {/* ---------- Security ---------- */}
        <section id="security" className="scroll-mt-8">
          <h2 className="mt-12 font-display text-2xl tracking-wide text-off-white/80">
            Security
          </h2>
          <p className="mt-1 font-body text-sm text-off-white/45">
            Keep your login and notification preferences up to date.
          </p>

          <h3 className="mt-6 font-display text-lg tracking-wide text-off-white/70">
            Email preferences
          </h3>
          <BroadcastEmailPreference initialOptIn={broadcastEmailsOptIn} />

          <h3 className="mt-8 font-display text-lg tracking-wide text-off-white/70">
            Change email
          </h3>
          <div className="mt-3">
            <ChangeEmailForm currentEmail={user.email ?? ""} />
          </div>

          <h3 className="mt-8 font-display text-lg tracking-wide text-off-white/70">
            Change password
          </h3>
          <div className="mt-3">
            <ChangePasswordForm />
          </div>
        </section>

        {/* ---------- Booking (staff) ---------- */}
        {isStaff && (
          <section id="booking" className="scroll-mt-8">
            <h2 className="mt-12 font-display text-2xl tracking-wide text-off-white/80">
              Booking
            </h2>
            <p className="mt-1 font-body text-sm text-off-white/45">
              Share a link so people can schedule time with you.
            </p>
            <div className="mt-4">
              <BookingSchedulePanel
                page={
                  bookingPage
                    ? {
                        id: bookingPage.id,
                        slug: bookingPage.slug,
                        title: bookingPage.title,
                        description: bookingPage.description,
                        timezone: bookingPage.timezone,
                        durationMins: bookingPage.durationMins,
                        bufferMins: bookingPage.bufferMins,
                        aheadDays: bookingPage.aheadDays,
                        isActive: bookingPage.isActive,
                        bookingUrl: bookingPageUrl(bookingPage.slug),
                        weeklyWindows: bookingPage.weeklyWindows.map((w) => ({
                          dayOfWeek: w.dayOfWeek,
                          startMinute: w.startMinute,
                          endMinute: w.endMinute,
                        })),
                      }
                    : null
                }
              />
            </div>
          </section>
        )}

        {/* ---------- Creator insights ---------- */}
        <section id="insights" className="scroll-mt-8">
          <h2 className="mt-12 font-display text-2xl tracking-wide text-off-white/80">
            Creator insights
          </h2>
          <p className="mt-1 font-body text-xs text-off-white/40">
            Private analytics for you — other members only see your public TikTok link.
          </p>
          <div className="mt-4">
            {searchParams?.tiktok === "refreshed" && (
              <p className="mb-3 rounded-lg border border-cyan/30 bg-cyan/10 px-4 py-3 font-body text-sm text-cyan">
                TikTok stats updated.
              </p>
            )}
            {searchParams?.tiktok === "error" && (
              <p className="mb-3 rounded-lg border border-orange/30 bg-orange/10 px-4 py-3 font-body text-sm text-orange">
                {searchParams.tiktok_message || "Couldn't refresh TikTok stats."}
              </p>
            )}

            {insights ? (
              <CreatorInsightsPanel
                insights={insights}
                actions={
                  <form action={refreshTikTokStatsAction}>
                    <button
                      type="submit"
                      className="rounded-lg border border-cyan/40 px-3 py-1.5 font-body text-xs font-semibold text-cyan transition hover:bg-cyan/10"
                    >
                      Refresh stats
                    </button>
                  </form>
                }
              />
            ) : tiktokStats || tiktokUniqueId ? (
              <div className="glass flex flex-col items-center gap-3 rounded-2xl p-6 text-center">
                <p className="font-body text-sm text-off-white/60">
                  Pull followers, likes, video count, and whether you&apos;re live
                  {tiktokUniqueId ? (
                    <>
                      {" "}
                      from <span className="text-off-white">@{tiktokUniqueId}</span>
                    </>
                  ) : null}
                  .
                </p>
                <form action={refreshTikTokStatsAction}>
                  <button
                    type="submit"
                    className="rounded-lg bg-gradient-to-r from-orange to-cyan px-6 py-2.5 font-body text-sm font-semibold text-charcoal transition hover:opacity-90"
                  >
                    Fetch TikTok stats
                  </button>
                </form>
              </div>
            ) : (
              <div className="glass rounded-2xl p-6 text-center">
                <p className="font-body text-sm text-off-white/60">
                  We couldn&apos;t find a TikTok handle on your profile or application. Add your
                  TikTok URL in Profile below, save, then fetch stats here.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ---------- Profile ---------- */}
        <section id="profile" className="scroll-mt-8">
          <h2 className="mt-12 font-display text-2xl tracking-wide text-off-white/80">
            Profile
          </h2>

          <h3 className="mt-6 font-display text-lg tracking-wide text-off-white/70">Badges</h3>
          <div className="mt-3">
            {userBadges.length === 0 ? (
              <p className="glass rounded-2xl p-6 text-center font-body text-sm text-off-white/40">
                Complete a course in the Learning Center to earn your first badge.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {userBadges.map(({ badge, awardedAt }) => (
                  <div
                    key={badge.id}
                    className="glass flex flex-col items-center gap-1 rounded-xl p-4 text-center"
                  >
                    <span className="text-3xl">{badge.icon || "🏆"}</span>
                    <p className="font-body text-sm font-medium text-off-white">{badge.name}</p>
                    <p className="font-body text-xs text-off-white/40">
                      {awardedAt.toLocaleDateString([], { dateStyle: "medium" })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <h3 className="mt-8 font-display text-lg tracking-wide text-off-white/70">
            Certificates
          </h3>
          <div className="mt-3">
            {certificates.length === 0 ? (
              <p className="glass rounded-2xl p-6 text-center font-body text-sm text-off-white/40">
                Complete a certificate-eligible course to earn one.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {certificates.map((cert) => (
                  <Link
                    key={cert.id}
                    href={`/learn/${cert.courseId}/certificate`}
                    className="glass flex items-center justify-between gap-3 rounded-xl p-4 transition hover:border-cyan/40"
                  >
                    <div>
                      <p className="font-body text-sm font-medium text-off-white">
                        🎓 {cert.course.title}
                      </p>
                      <p className="mt-0.5 font-body text-xs text-off-white/40">
                        Issued {cert.issuedAt.toLocaleDateString([], { dateStyle: "medium" })}
                      </p>
                    </div>
                    <span className="font-body text-xs text-cyan">View &rarr;</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <h3 className="mt-8 font-display text-lg tracking-wide text-off-white/70">
            Name & username
          </h3>
          <div className="mt-3">
            <NameIdentityForm name={user.name ?? ""} username={profile.username ?? ""} />
          </div>

          <h3 className="mt-8 font-display text-lg tracking-wide text-off-white/70">
            Display name
          </h3>
          <div className="mt-3">
            <DisplayNamePreference
              showRealName={profile.showRealName}
              realName={user.name ?? null}
              tiktokUsername={
                getTikTokUsername({
                  name: user.name ?? null,
                  profile: {
                    socialLinks,
                    username: refreshedProfile?.username ?? profile.username,
                  },
                  tiktokStatsSnapshot: tiktokStats,
                }) ?? null
              }
            />
          </div>

          <h3 className="mt-8 font-display text-lg tracking-wide text-off-white/70">
            Creator profile
          </h3>
          <div className="mt-3">
            <ProfileEditForm
              defaultValues={{
                platform: profile.platform,
                goals: activeGoalKeys(profile.goals),
                bio: profile.bio ?? "",
                phone: contact.phone ?? "",
                country: contact.country ?? "",
                tiktokUrl: socialLinks.tiktok ?? "",
                twitchUrl: socialLinks.twitch ?? "",
                youtubeUrl: socialLinks.youtube ?? "",
                pinnedTiktokVideoUrl: profile.pinnedTiktokVideoUrl ?? "",
              }}
            />
          </div>

          <h3 className="mt-8 font-display text-lg tracking-wide text-off-white/70">Tags</h3>
          <div className="mt-3">
            <div className="glass flex flex-col gap-4 rounded-2xl p-6">
              {adminOnlyTags.length > 0 && (
                <div>
                  <p className="mb-2 font-body text-xs font-semibold uppercase tracking-wide text-off-white/40">
                    Awarded by admin
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {adminOnlyTags.map((tag) => {
                      const color = networkBadgeColor(tag.name, tag.color, effectEnabled);
                      return (
                        <span
                          key={tag.id}
                          title={tag.description ?? undefined}
                          className="rounded-full border px-3 py-1.5 font-body text-xs font-semibold"
                          style={{ borderColor: `${color}66`, color }}
                        >
                          {tag.name}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
              <div>
                <p className="mb-2 font-body text-xs font-semibold uppercase tracking-wide text-off-white/40">
                  Tap to add or remove — shown on your profile so other members can find you
                </p>
                <TagPicker tags={selfAssignableTags} myTagIds={myTagIds} />
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
