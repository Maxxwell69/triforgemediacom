import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { getUserPointsTotal } from "@/lib/points";
import RewardCard from "@/components/RewardCard";
import LeaderboardSection, {
  parseLeaderboardPeriod,
} from "@/components/LeaderboardSection";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "text-orange",
  FULFILLED: "text-cyan",
  CANCELLED: "text-off-white/40",
};

export default async function RewardsPage({
  searchParams,
}: {
  searchParams?: { period?: string };
}) {
  const { user } = await requireProfile();
  const period = parseLeaderboardPeriod(searchParams?.period);

  const [rewards, points, redemptions] = await Promise.all([
    prisma.reward.findMany({ where: { isActive: true }, orderBy: { costPoints: "asc" } }),
    getUserPointsTotal(user.id),
    prisma.rewardRedemption.findMany({
      where: { userId: user.id },
      include: { reward: { select: { name: true } } },
      orderBy: { redeemedAt: "desc" },
    }),
  ]);

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-5xl tracking-wide">
              REWARDS <span className="text-gradient">STORE</span>
            </h1>
            <p className="mt-2 font-body text-off-white/60">
              Spend your points on perks. Redemptions are reviewed by the team.
            </p>
          </div>
          <div className="glass rounded-2xl px-6 py-3 text-right">
            <p className="font-body text-xs text-off-white/50">Your balance</p>
            <p className="font-display text-3xl text-gradient">{points} pts</p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rewards.length === 0 && (
            <p className="glass col-span-full rounded-2xl p-8 text-center font-body text-off-white/50">
              No rewards available right now. Check back soon.
            </p>
          )}
          {rewards.map((reward) => (
            <RewardCard key={reward.id} reward={reward} userPoints={points} />
          ))}
        </div>

        <section className="mt-12">
          <h2 className="font-display text-2xl tracking-wide text-off-white/80">
            Your redemption history
          </h2>
          <div className="mt-4 flex flex-col gap-2">
            {redemptions.length === 0 && (
              <p className="glass rounded-2xl p-6 text-center font-body text-sm text-off-white/40">
                You haven&apos;t redeemed anything yet.
              </p>
            )}
            {redemptions.map((r) => (
              <div
                key={r.id}
                className="glass flex flex-wrap items-center justify-between gap-3 rounded-xl p-4"
              >
                <div>
                  <p className="font-body text-sm font-medium text-off-white">{r.reward.name}</p>
                  <p className="font-body text-xs text-off-white/40">
                    {r.redeemedAt.toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-body text-sm text-off-white/60">
                    -{r.pointsSpent} pts
                  </span>
                  <span
                    className={`font-body text-xs font-semibold uppercase tracking-wide ${
                      STATUS_STYLES[r.status] || "text-off-white/50"
                    }`}
                  >
                    {r.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-12 max-w-2xl">
          <LeaderboardSection viewerId={user.id} period={period} periodHrefBase="/rewards" />
        </div>
      </div>
    </main>
  );
}
