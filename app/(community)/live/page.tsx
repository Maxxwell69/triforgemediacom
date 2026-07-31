import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { formatCount } from "@/lib/formatCount";
import { getMemberDisplayName, getMemberAvatarUrl, getMemberInitial } from "@/lib/memberDisplay";
import MemberAvatar from "@/components/MemberAvatar";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export default async function LivePage() {
  await requireProfile();

  const liveCreators = await prisma.tikTokStatsSnapshot.findMany({
    where: {
      isLive: true,
      user: {
        status: "ACTIVE",
        hiddenFromDirectory: false,
        profile: { isNot: null },
      },
    },
    include: {
      user: {
        include: {
          profile: { select: { socialLinks: true, username: true, showRealName: true } },
          tiktokConnection: { select: { displayName: true, avatarUrl: true } },
        },
      },
    },
    orderBy: [{ liveViewerCount: "desc" }, { liveCheckedAt: "desc" }],
  });

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-5xl tracking-wide">
              WHO&apos;S <span className="text-gradient">LIVE</span>
            </h1>
            <p className="mt-2 font-body text-off-white/60">
              Community creators currently live on TikTok
              {liveCreators.length > 0
                ? ` · ${liveCreators.length} live now`
                : ""}
            </p>
          </div>
          <Link
            href="/members?tag=LIVE"
            className="font-body text-sm text-cyan transition hover:underline"
          >
            Filter members by LIVE tag →
          </Link>
        </div>

        {liveCreators.length === 0 ? (
          <div className="glass mt-10 rounded-2xl p-10 text-center">
            <p className="font-display text-2xl tracking-wide text-off-white/80">
              Nobody&apos;s live right now
            </p>
            <p className="mt-2 font-body text-sm text-off-white/50">
              This list refreshes automatically every few minutes. Check back when creators go
              live.
            </p>
            <Link
              href="/members"
              className="mt-6 inline-block font-body text-sm text-cyan transition hover:underline"
            >
              Browse all members
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {liveCreators.map((snap) => {
              const member = {
                ...snap.user,
                tiktokStatsSnapshot: {
                  nickname: snap.nickname,
                  avatarUrl: snap.avatarUrl,
                  uniqueId: snap.uniqueId,
                },
              };
              const displayName = getMemberDisplayName(member);
              const avatarUrl = getMemberAvatarUrl(member) || snap.avatarUrl;
              const initial = getMemberInitial(member);
              const tiktokUrl = `https://www.tiktok.com/@${snap.uniqueId}/live`;

              return (
                <div
                  key={snap.userId}
                  className="glass flex flex-col gap-3 rounded-2xl border border-orange/30 p-5"
                >
                  <div className="flex items-center gap-3">
                    <MemberAvatar avatarUrl={avatarUrl} initial={initial} size={48} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-body font-semibold text-off-white">
                          {displayName}
                        </p>
                        <span className="rounded bg-orange/20 px-1.5 py-0.5 font-body text-[10px] font-semibold uppercase tracking-wide text-orange">
                          Live
                        </span>
                      </div>
                      <p className="font-body text-xs text-off-white/40">@{snap.uniqueId}</p>
                    </div>
                  </div>

                  {(snap.liveTitle || snap.liveViewerCount != null) && (
                    <p className="font-body text-sm text-off-white/70">
                      {snap.liveTitle || "Live on TikTok"}
                      {snap.liveViewerCount != null
                        ? ` · ${formatCount(snap.liveViewerCount)} watching`
                        : null}
                    </p>
                  )}

                  <div className="mt-auto flex gap-2">
                    <Link
                      href={`/members/${snap.userId}`}
                      className="rounded-lg border border-off-white/15 px-3 py-1.5 font-body text-xs text-off-white/70 transition hover:border-cyan/40 hover:text-cyan"
                    >
                      Profile
                    </Link>
                    <a
                      href={tiktokUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-gradient-to-r from-orange to-cyan px-3 py-1.5 font-body text-xs font-semibold text-charcoal transition hover:opacity-90"
                    >
                      Watch on TikTok
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
