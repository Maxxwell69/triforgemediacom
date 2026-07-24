"use client";

import { useState } from "react";
import { updateReward } from "@/app/admin/rewards/actions";
import RewardActiveToggle from "./RewardActiveToggle";

type Reward = {
  id: string;
  name: string;
  description: string | null;
  costPoints: number;
  imageUrl: string | null;
  stock: number | null;
  isActive: boolean;
};

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white outline-none transition focus:border-cyan/60";

export default function RewardRow({ reward }: { reward: Reward }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <form
        action={async (formData) => {
          await updateReward(formData);
          setEditing(false);
        }}
        className="glass flex flex-col gap-3 rounded-xl p-4"
      >
        <input type="hidden" name="id" value={reward.id} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input name="name" defaultValue={reward.name} required className={fieldClass} />
          <input
            name="imageUrl"
            defaultValue={reward.imageUrl ?? ""}
            placeholder="Image URL (optional)"
            className={fieldClass}
          />
        </div>
        <textarea
          name="description"
          defaultValue={reward.description ?? ""}
          rows={2}
          className={fieldClass}
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            name="costPoints"
            defaultValue={reward.costPoints}
            min={1}
            required
            placeholder="Cost (points)"
            className={fieldClass}
          />
          <input
            type="number"
            name="stock"
            defaultValue={reward.stock ?? ""}
            min={0}
            placeholder="Stock (blank = unlimited)"
            className={fieldClass}
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="rounded-lg bg-cyan/90 px-4 py-1.5 font-body text-sm font-semibold text-charcoal transition hover:brightness-110"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="font-body text-sm text-off-white/50 hover:text-off-white"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div
      className={`glass flex items-center justify-between gap-4 rounded-xl p-4 ${
        !reward.isActive ? "opacity-50" : ""
      }`}
    >
      <div className="min-w-0 flex-1">
        <p className="font-body text-sm font-medium text-off-white">{reward.name}</p>
        {reward.description && (
          <p className="mt-0.5 truncate font-body text-xs text-off-white/50">
            {reward.description}
          </p>
        )}
        <p className="mt-1 font-body text-xs text-off-white/40">
          {reward.costPoints} pts
          {" \u00b7 "}
          {reward.stock === null ? "Unlimited stock" : `${reward.stock} in stock`}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-lg border border-off-white/15 px-3 py-1 font-body text-xs text-off-white/70 transition hover:border-cyan/40 hover:text-cyan"
        >
          Edit
        </button>
        <RewardActiveToggle id={reward.id} isActive={reward.isActive} />
      </div>
    </div>
  );
}
