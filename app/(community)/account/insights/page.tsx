import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { parseTikTokUniqueId } from "@/lib/tiktools";
import { ensureTikTokSocialLink, ensureTikTokStatsIfMissing } from "@/lib/tiktokStats";
import { loadCreatorInsights } from "@/lib/creatorInsights";
import CreatorInsightsPanel from "@/components/CreatorInsightsPanel";
import AccountPageShell from "@/components/account/AccountPageShell";
import { refreshTikTokStatsAction } from "../actions";

export default async function AccountInsightsPage({
  searchParams,
}: {
  searchParams?: { tiktok?: string; tiktok_message?: string };
}) {
  const { user, profile } = await requireProfile();

  await ensureTikTokSocialLink(user.id);
  await ensureTikTokStatsIfMissing(user.id).catch((err) => {
    console.error("Auto TikTok stats fetch failed:", err);
  });

  const refreshedProfile = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: { socialLinks: true },
  });

  const [tiktokStats, insights] = await Promise.all([
    prisma.tikTokStatsSnapshot.findUnique({ where: { userId: user.id } }),
    loadCreatorInsights(user.id),
  ]);

  const socialLinks =
    (refreshedProfile?.socialLinks as Record<string, string> | null) ??
    ((profile.socialLinks as Record<string, string> | null) ?? {});
  const tiktokUniqueId = parseTikTokUniqueId(socialLinks.tiktok);

  return (
    <AccountPageShell
      crumbs={[{ label: "Creator Insights" }]}
      title={
        <>
          CREATOR <span className="text-gradient">INSIGHTS</span>
        </>
      }
      description="Private analytics for you — other members only see your public TikTok link."
    >
      {(searchParams?.tiktok === "refreshed" || searchParams?.tiktok === "connected") && (
        <p className="mb-3 rounded-lg border border-cyan/30 bg-cyan/10 px-4 py-3 font-body text-sm text-cyan">
          {searchParams.tiktok === "connected"
            ? "TikTok connected."
            : "TikTok stats updated."}
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
            TikTok URL in{" "}
            <Link href="/account/profile" className="text-cyan hover:underline">
              Profile
            </Link>
            , save, then fetch stats here.
          </p>
        </div>
      )}
    </AccountPageShell>
  );
}
