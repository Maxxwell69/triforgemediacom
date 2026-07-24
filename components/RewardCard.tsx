"use client";

import { useState, useTransition } from "react";
import { redeemReward } from "@/app/(community)/rewards/actions";

type Reward = {
  id: string;
  name: string;
  description: string | null;
  costPoints: number;
  imageUrl: string | null;
  stock: number | null;
};

export default function RewardCard({
  reward,
  userPoints,
}: {
  reward: Reward;
  userPoints: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [redeemed, setRedeemed] = useState(false);

  const outOfStock = reward.stock !== null && reward.stock <= 0;
  const canAfford = userPoints >= reward.costPoints;
  const disabled = isPending || outOfStock || !canAfford || redeemed;

  return (
    <div className="glass flex flex-col gap-3 rounded-2xl p-5">
      <div className="flex h-32 w-full items-center justify-center overflow-hidden rounded-xl bg-off-white/5">
        {reward.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={reward.imageUrl}
            alt={reward.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-4xl">🎁</span>
        )}
      </div>
      <div>
        <p className="font-body font-semibold text-off-white">{reward.name}</p>
        {reward.description && (
          <p className="mt-1 font-body text-sm text-off-white/50">{reward.description}</p>
        )}
      </div>
      <div className="mt-auto flex items-center justify-between gap-3">
        <span className="font-body text-sm font-semibold text-cyan">
          {reward.costPoints} pts
        </span>
        {reward.stock !== null && (
          <span className="font-body text-xs text-off-white/40">
            {outOfStock ? "Out of stock" : `${reward.stock} left`}
          </span>
        )}
      </div>
      {error && <p className="font-body text-xs text-orange">{error}</p>}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            try {
              await redeemReward(reward.id);
              setRedeemed(true);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Failed to redeem reward");
            }
          });
        }}
        className="w-full rounded-lg bg-orange px-4 py-2 font-body text-sm font-semibold text-off-white shadow-glow transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
      >
        {redeemed
          ? "Redeemed!"
          : isPending
            ? "Redeeming..."
            : outOfStock
              ? "Out of stock"
              : !canAfford
                ? "Not enough points"
                : "Redeem"}
      </button>
    </div>
  );
}
