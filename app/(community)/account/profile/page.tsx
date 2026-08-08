import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { activeGoalKeys } from "@/lib/goals";
import { hydrateProfileContactFromApplication } from "@/lib/profileContact";
import { getTikTokUsername } from "@/lib/memberDisplay";
import { ensureTikTokSocialLink } from "@/lib/tiktokStats";
import ProfileEditForm from "../ProfileEditForm";
import TagPicker from "@/components/TagPicker";
import DisplayNamePreference from "@/components/DisplayNamePreference";
import NameIdentityForm from "../NameIdentityForm";
import AccountPageShell from "@/components/account/AccountPageShell";
import { networkBadgeColor } from "@/lib/mnCn";

export default async function AccountProfilePage() {
  const { user, profile } = await requireProfile();
  const contact = await hydrateProfileContactFromApplication(user.id);
  await ensureTikTokSocialLink(user.id);

  const refreshedProfile = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: { socialLinks: true, username: true },
  });

  const [userBadges, certificates, tiktokStats, selfAssignableTags, myTags, prefsRow] =
    await Promise.all([
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
      prisma.tag.findMany({ where: { selfAssignable: true }, orderBy: { name: "asc" } }),
      prisma.userTag.findMany({ where: { userId: user.id }, include: { tag: true } }),
      prisma.user.findUnique({
        where: { id: user.id },
        select: { effect: true },
      }),
    ]);

  const effectEnabled = prefsRow?.effect ?? false;
  const myTagIds = myTags.map((ut) => ut.tagId);
  const adminOnlyTags = myTags.map((ut) => ut.tag).filter((tag) => !tag.selfAssignable);
  const socialLinks =
    (refreshedProfile?.socialLinks as Record<string, string> | null) ??
    ((profile.socialLinks as Record<string, string> | null) ?? {});

  return (
    <AccountPageShell
      crumbs={[{ label: "Profile" }]}
      title={
        <>
          <span className="text-gradient">PROFILE</span>
        </>
      }
      description="Badges, identity, socials, and the tags other members see."
    >
      <h2 className="font-display text-lg tracking-wide text-off-white/70">Badges</h2>
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

      <h2 className="mt-10 font-display text-lg tracking-wide text-off-white/70">
        Certificates
      </h2>
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

      <h2 className="mt-10 font-display text-lg tracking-wide text-off-white/70">
        Name & username
      </h2>
      <div className="mt-3">
        <NameIdentityForm name={user.name ?? ""} username={profile.username ?? ""} />
      </div>

      <h2 className="mt-10 font-display text-lg tracking-wide text-off-white/70">
        Display name
      </h2>
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

      <h2 className="mt-10 font-display text-lg tracking-wide text-off-white/70">
        Creator profile
      </h2>
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

      <h2 className="mt-10 font-display text-lg tracking-wide text-off-white/70">Tags</h2>
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
    </AccountPageShell>
  );
}
