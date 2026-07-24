"use client";

import { useFormState, useFormStatus } from "react-dom";
import { platformOptions } from "@/lib/validations/apply";
import { PLATFORM_LABELS as platformLabels } from "@/lib/platforms";
import { GOAL_OPTIONS } from "@/lib/goals";
import { completeOnboarding } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 rounded-lg bg-orange px-8 py-3 font-body font-semibold text-off-white shadow-glow transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Saving..." : "Enter the community"}
    </button>
  );
}

export default function OnboardingForm() {
  const [state, formAction] = useFormState(completeOnboarding, null);

  return (
    <form action={formAction} className="glass flex flex-col gap-6 rounded-2xl p-8">
      {state?.error && (
        <p className="rounded-lg border border-orange/30 bg-orange/10 px-4 py-3 text-sm font-body text-orange">
          {state.error}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <span className="font-body text-sm font-medium text-off-white/80">
          Main platform
        </span>
        <select name="platform" required defaultValue="" className={inputClass}>
          <option value="" disabled>
            Select a platform
          </option>
          {platformOptions.map((p) => (
            <option key={p} value={p}>
              {platformLabels[p]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <span className="font-body text-sm font-medium text-off-white/80">
          What are you working on right now? (pick at least one)
        </span>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {GOAL_OPTIONS.map((goal) => (
            <label
              key={goal.key}
              className="flex items-center gap-2 rounded-lg border border-off-white/15 bg-off-white/5 px-4 py-2.5 font-body text-sm text-off-white/80 transition hover:border-cyan/40"
            >
              <input
                type="checkbox"
                name="goals"
                value={goal.key}
                className="h-4 w-4 rounded border-off-white/30 bg-transparent accent-orange"
              />
              {goal.label}
            </label>
          ))}
        </div>
      </div>

      <label htmlFor="bio" className="flex flex-col gap-1.5">
        <span className="font-body text-sm font-medium text-off-white/80">
          Bio (optional)
        </span>
        <textarea
          id="bio"
          name="bio"
          rows={3}
          maxLength={500}
          className={inputClass}
          placeholder="A short intro for your community profile"
        />
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <label htmlFor="tiktokUrl" className="flex flex-col gap-1.5">
          <span className="font-body text-sm font-medium text-off-white/80">TikTok</span>
          <input
            id="tiktokUrl"
            name="tiktokUrl"
            type="url"
            className={inputClass}
            placeholder="https://tiktok.com/@you"
          />
        </label>
        <label htmlFor="twitchUrl" className="flex flex-col gap-1.5">
          <span className="font-body text-sm font-medium text-off-white/80">Twitch</span>
          <input
            id="twitchUrl"
            name="twitchUrl"
            type="url"
            className={inputClass}
            placeholder="https://twitch.tv/you"
          />
        </label>
        <label htmlFor="youtubeUrl" className="flex flex-col gap-1.5">
          <span className="font-body text-sm font-medium text-off-white/80">YouTube</span>
          <input
            id="youtubeUrl"
            name="youtubeUrl"
            type="url"
            className={inputClass}
            placeholder="https://youtube.com/@you"
          />
        </label>
      </div>

      <SubmitButton />
    </form>
  );
}

const inputClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-4 py-2.5 font-body text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60 focus:ring-1 focus:ring-cyan/60";
