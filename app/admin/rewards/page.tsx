import { prisma } from "@/lib/prisma";
import { createReward } from "./actions";
import RewardRow from "@/components/admin/RewardRow";
import RedemptionActions from "@/components/admin/RedemptionActions";
import ImageUploadField from "@/components/ImageUploadField";

export const dynamic = "force-dynamic";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "text-orange",
  FULFILLED: "text-cyan",
  CANCELLED: "text-off-white/40",
};

export default async function AdminRewardsPage() {
  const [rewards, redemptions] = await Promise.all([
    prisma.reward.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.rewardRedemption.findMany({
      orderBy: { redeemedAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        reward: { select: { name: true } },
      },
    }),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-5xl tracking-wide">
        REWARDS <span className="text-gradient">STORE</span>
      </h1>
      <p className="mt-2 font-body text-off-white/60">
        Manage what members can redeem their points for, and process incoming redemptions.
      </p>

      <form action={createReward} className="glass mt-8 flex flex-col gap-3 rounded-2xl p-6">
        <h2 className="font-display text-xl tracking-wide text-off-white/80">New reward</h2>
        <input name="name" required placeholder="e.g. TriForge Hoodie" className={fieldClass} />
        <textarea
          name="description"
          rows={2}
          placeholder="Optional description"
          className={fieldClass}
        />
        <ImageUploadField name="imageUrl" folder="reward-images" label="Image" />
        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            name="costPoints"
            min={1}
            required
            placeholder="Cost (points)"
            className={fieldClass}
          />
          <input
            type="number"
            name="stock"
            min={0}
            placeholder="Stock (blank = unlimited)"
            className={fieldClass}
          />
        </div>
        <button
          type="submit"
          className="self-start rounded-lg bg-orange px-6 py-2 font-body font-semibold text-off-white shadow-glow transition hover:brightness-110"
        >
          Add reward
        </button>
      </form>

      <div className="mt-8 flex flex-col gap-2">
        {rewards.length === 0 && (
          <p className="glass rounded-2xl p-8 text-center font-body text-off-white/50">
            No rewards yet.
          </p>
        )}
        {rewards.map((reward) => (
          <RewardRow key={reward.id} reward={reward} />
        ))}
      </div>

      <section className="mt-12">
        <h2 className="font-display text-2xl tracking-wide text-off-white/80">Redemptions</h2>
        <div className="mt-4 flex flex-col gap-2">
          {redemptions.length === 0 && (
            <p className="glass rounded-2xl p-8 text-center font-body text-off-white/50">
              No redemptions yet.
            </p>
          )}
          {redemptions.map((r) => (
            <div
              key={r.id}
              className="glass flex flex-wrap items-center justify-between gap-3 rounded-xl p-4"
            >
              <div className="min-w-0">
                <p className="truncate font-body text-sm font-medium text-off-white">
                  {r.reward.name}
                </p>
                <p className="truncate font-body text-xs text-off-white/50">
                  {r.user.name || r.user.email}
                  {" \u00b7 "}
                  {r.redeemedAt.toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-body text-sm text-off-white/60">-{r.pointsSpent} pts</span>
                <span
                  className={`font-body text-xs font-semibold uppercase tracking-wide ${
                    STATUS_STYLES[r.status] || "text-off-white/50"
                  }`}
                >
                  {r.status}
                </span>
                {r.status === "PENDING" && <RedemptionActions redemptionId={r.id} />}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
