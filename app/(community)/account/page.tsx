import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { getUserPointsTotal } from "@/lib/points";
import { activeGoalKeys } from "@/lib/goals";
import { formatCount } from "@/lib/formatCount";
import ProfileEditForm from "./ProfileEditForm";
import ChangeEmailForm from "./ChangeEmailForm";
import ChangePasswordForm from "./ChangePasswordForm";
import TagPicker from "@/components/TagPicker";
import { disconnectTikTok, refreshTikTokStatsAction } from "./actions";

export default async function AccountPage({
  searchParams,
}: {
  searchParams?: { tiktok?: string; tiktok_message?: string };
}) {
  const { user, profile } = await requireProfile();
  const [points, userBadges, certificates, tiktokConnection, selfAssignableTags, myTags] =
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
      prisma.tikTokConnection.findUnique({ where: { userId: user.id } }),
      prisma.tag.findMany({ where: { selfAssignable: true }, orderBy: { name: "asc" } }),
      prisma.userTag.findMany({ where: { userId: user.id }, include: { tag: true } }),
    ]);

  const myTagIds = myTags.map((ut) => ut.tagId);
  const adminOnlyTags = myTags.map((ut) => ut.tag).filter((tag) => !tag.selfAssignable);
  const socialLinks = (profile.socialLinks as Record<string, string> | null) ?? {};

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-5xl tracking-wide">
          YOUR <span className="text-gradient">ACCOUNT</span>
        </h1>
        <p className="mt-2 font-body text-off-white/60">
          Update your creator profile and account settings.
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

        <h2 className="mt-10 font-display text-2xl tracking-wide text-off-white/80">Badges</h2>
        <div className="mt-4">
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

        <h2 className="mt-10 font-display text-2xl tracking-wide text-off-white/80">
          Certificates
        </h2>
        <div className="mt-4">
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

        <h2 className="mt-10 font-display text-2xl tracking-wide text-off-white/80">Profile</h2>
        <div className="mt-4">
          <ProfileEditForm
            defaultValues={{
              platform: profile.platform,
              goals: activeGoalKeys(profile.goals),
              bio: profile.bio ?? "",
              tiktokUrl: socialLinks.tiktok ?? "",
              twitchUrl: socialLinks.twitch ?? "",
              youtubeUrl: socialLinks.youtube ?? "",
              pinnedTiktokVideoUrl: profile.pinnedTiktokVideoUrl ?? "",
            }}
          />
        </div>

        <h2 className="mt-10 font-display text-2xl tracking-wide text-off-white/80">Tags</h2>
        <div className="mt-4">
          <div className="glass flex flex-col gap-4 rounded-2xl p-6">
            {adminOnlyTags.length > 0 && (
              <div>
                <p className="mb-2 font-body text-xs font-semibold uppercase tracking-wide text-off-white/40">
                  Awarded by admin
                </p>
                <div className="flex flex-wrap gap-2">
                  {adminOnlyTags.map((tag) => (
                    <span
                      key={tag.id}
                      title={tag.description ?? undefined}
                      className="rounded-full border px-3 py-1.5 font-body text-xs font-semibold"
                      style={{ borderColor: `${tag.color}66`, color: tag.color }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="mb-2 font-body text-xs font-semibold uppercase tracking-wide text-off-white/40">
                Tap to add or remove &mdash; shown on your profile so other members can find you
              </p>
              <TagPicker tags={selfAssignableTags} myTagIds={myTagIds} />
            </div>
          </div>
        </div>

        <h2 className="mt-10 font-display text-2xl tracking-wide text-off-white/80">
          TikTok stats
        </h2>
        <div className="mt-4">
          {searchParams?.tiktok === "connected" && (
            <p className="mb-3 rounded-lg border border-cyan/30 bg-cyan/10 px-4 py-3 font-body text-sm text-cyan">
              TikTok connected!
            </p>
          )}
          {searchParams?.tiktok === "error" && (
            <p className="mb-3 rounded-lg border border-orange/30 bg-orange/10 px-4 py-3 font-body text-sm text-orange">
              {searchParams.tiktok_message || "Couldn't connect your TikTok account."}
            </p>
          )}

          {tiktokConnection ? (
            <div className="glass flex flex-col gap-4 rounded-2xl p-6">
              <div className="flex items-center gap-3">
                {tiktokConnection.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- external TikTok CDN avatar
                  <img
                    src={tiktokConnection.avatarUrl}
                    alt=""
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-orange to-cyan font-display text-charcoal">
                    🎵
                  </div>
                )}
                <div>
                  <p className="font-body text-sm font-semibold text-off-white">
                    {tiktokConnection.displayName || "TikTok account connected"}
                  </p>
                  <p className="font-body text-xs text-off-white/40">
                    {tiktokConnection.statsUpdatedAt
                      ? `Stats updated ${tiktokConnection.statsUpdatedAt.toLocaleDateString([], { dateStyle: "medium" })}`
                      : "Connected via TikTok Login"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl border border-off-white/10 py-3">
                  <p className="font-display text-xl text-off-white">
                    {formatCount(tiktokConnection.followerCount ?? 0)}
                  </p>
                  <p className="font-body text-xs text-off-white/40">Followers</p>
                </div>
                <div className="rounded-xl border border-off-white/10 py-3">
                  <p className="font-display text-xl text-off-white">
                    {formatCount(tiktokConnection.likesCount ?? 0)}
                  </p>
                  <p className="font-body text-xs text-off-white/40">Likes</p>
                </div>
                <div className="rounded-xl border border-off-white/10 py-3">
                  <p className="font-display text-xl text-off-white">
                    {formatCount(tiktokConnection.videoCount ?? 0)}
                  </p>
                  <p className="font-body text-xs text-off-white/40">Videos</p>
                </div>
              </div>

              <div className="flex gap-2">
                <form action={refreshTikTokStatsAction}>
                  <button
                    type="submit"
                    className="rounded-lg border border-cyan/40 px-3 py-1.5 font-body text-xs font-semibold text-cyan transition hover:bg-cyan/10"
                  >
                    Refresh stats
                  </button>
                </form>
                <form action={disconnectTikTok}>
                  <button
                    type="submit"
                    className="rounded-lg border border-off-white/15 px-3 py-1.5 font-body text-xs text-off-white/60 transition hover:border-orange/40 hover:text-orange"
                  >
                    Disconnect
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="glass flex flex-col items-center gap-3 rounded-2xl p-6 text-center">
              <p className="font-body text-sm text-off-white/60">
                Connect your TikTok account to show your real follower, like, and video counts
                right on your community profile.
              </p>
              <button
                type="button"
                disabled
                title="Our TikTok app is pending approval from TikTok"
                className="cursor-not-allowed rounded-lg bg-off-white/10 px-6 py-2.5 font-body text-sm font-semibold text-off-white/40"
              >
                🎵 Connect TikTok
              </button>
              <p className="font-body text-xs text-off-white/40">
                Waiting for TikTok approval for our app.
              </p>
            </div>
          )}
        </div>

        <h2 className="mt-10 font-display text-2xl tracking-wide text-off-white/80">
          Change email
        </h2>
        <div className="mt-4">
          <ChangeEmailForm currentEmail={user.email ?? ""} />
        </div>

        <h2 className="mt-10 font-display text-2xl tracking-wide text-off-white/80">
          Change password
        </h2>
        <div className="mt-4">
          <ChangePasswordForm />
        </div>
      </div>
    </main>
  );
}
