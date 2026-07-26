import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { getUserPointsTotal } from "@/lib/points";
import { PLATFORM_LABELS } from "@/lib/platforms";
import ShareButton from "@/components/ShareButton";

export const dynamic = "force-dynamic";

const SOCIAL_LINK_META: Record<string, { label: string; icon: string }> = {
  tiktok: { label: "TikTok", icon: "🎵" },
  twitch: { label: "Twitch", icon: "🎮" },
  youtube: { label: "YouTube", icon: "▶️" },
};

function profileShareUrl(userId: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${base}/members/${userId}`;
}

export default async function MemberProfilePage({
  params,
}: {
  params: { userId: string };
}) {
  await requireProfile();

  const member = await prisma.user.findFirst({
    where: { id: params.userId, status: "ACTIVE", profile: { isNot: null } },
    include: { profile: true, groupMemberships: { include: { group: true } } },
  });
  if (!member || !member.profile) notFound();

  const points = await getUserPointsTotal(member.id);
  const initial = (member.name || member.email).trim().charAt(0).toUpperCase();
  const groups = member.groupMemberships.map((m) => m.group);
  const socialLinks = (member.profile.socialLinks as Record<string, string> | null) ?? {};
  const socialEntries = Object.entries(socialLinks).filter(([, url]) => !!url);

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/members"
          className="font-body text-sm text-off-white/50 transition hover:text-off-white"
        >
          &larr; All members
        </Link>

        <div className="glass mt-4 flex flex-col gap-5 rounded-2xl p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange to-cyan font-display text-2xl text-charcoal">
                {initial}
              </div>
              <div>
                <p className="font-display text-2xl tracking-wide text-off-white">
                  {member.name || "Unnamed"}
                </p>
                {member.profile.platform && (
                  <span className="mt-1 inline-block rounded-full border border-cyan/30 px-2 py-0.5 font-body text-xs text-cyan">
                    {PLATFORM_LABELS[member.profile.platform]}
                  </span>
                )}
              </div>
            </div>

            <ShareButton
              title={member.name || "TriForge Media creator"}
              text={`Check out ${member.name || "this creator"} on TriForge Media.`}
              url={profileShareUrl(member.id)}
              label="Share profile"
            />
          </div>

          {member.profile.bio && (
            <p className="font-body text-sm leading-relaxed text-off-white/70">
              {member.profile.bio}
            </p>
          )}

          {groups.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {groups.map((g) => (
                <span
                  key={g.id}
                  className="rounded-full border px-2 py-0.5 font-body text-xs"
                  style={{ borderColor: `${g.color}66`, color: g.color }}
                >
                  {g.name}
                </span>
              ))}
            </div>
          )}

          <p className="font-body text-sm text-off-white/50">{points} points</p>

          {socialEntries.length > 0 && (
            <div className="border-t border-off-white/10 pt-5">
              <p className="mb-3 font-body text-xs font-semibold uppercase tracking-wide text-off-white/40">
                Socials
              </p>
              <div className="flex flex-col gap-2">
                {socialEntries.map(([key, url]) => {
                  const meta = SOCIAL_LINK_META[key] ?? { label: key, icon: "🔗" };
                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between gap-3 rounded-lg border border-off-white/10 px-4 py-2.5"
                    >
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex min-w-0 items-center gap-2 font-body text-sm text-off-white/80 transition hover:text-cyan"
                      >
                        <span aria-hidden="true">{meta.icon}</span>
                        <span className="truncate">{meta.label}</span>
                      </a>
                      <ShareButton
                        title={`${member.name || "This creator"} on ${meta.label}`}
                        url={url}
                        label="Share"
                        className="shrink-0 rounded-lg border border-off-white/15 px-2.5 py-1 font-body text-xs text-off-white/60 transition hover:border-cyan/40 hover:text-cyan"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
