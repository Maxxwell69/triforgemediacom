"use client";

import { useTransition } from "react";
import { setOnboardingLive } from "@/app/admin/onboarding/actions";

export default function OnboardingLiveToggle({ active }: { active: boolean }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="glass mt-8 flex flex-col gap-3 rounded-2xl p-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-display text-xl tracking-wide text-off-white">
          {active ? "Live for members" : "Not live yet"}
        </p>
        <p className="mt-1 font-body text-sm text-off-white/55">
          {active
            ? "Members see assigned checklists on Home, and new members get first-login lists. Deactivate to hide that while you edit."
            : "Set up checklists and steps here first. Members will not see onboarding until you activate it."}
        </p>
      </div>
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await setOnboardingLive(!active);
          })
        }
        className={`shrink-0 rounded-lg px-5 py-2.5 font-body text-sm font-semibold shadow-glow disabled:opacity-40 ${
          active
            ? "border border-orange/40 bg-transparent text-orange"
            : "bg-orange text-off-white"
        }`}
      >
        {isPending ? "Saving…" : active ? "Deactivate" : "Activate"}
      </button>
    </div>
  );
}
