"use client";

import { useFormState, useFormStatus } from "react-dom";
import { platformOptions } from "@/lib/validations/apply";
import { PLATFORM_LABELS as platformLabels } from "@/lib/platforms";
import { GOAL_OPTIONS } from "@/lib/goals";
import { COUNTRY_OPTIONS } from "@/lib/applyTrack";

export type ProfileFormState = { error?: string; success?: boolean } | null;

export type ProfileFormDefaults = {
  platform?: string;
  goals?: string[];
  bio?: string;
  phone?: string;
  country?: string;
  tiktokUrl?: string;
  twitchUrl?: string;
  youtubeUrl?: string;
  pinnedTiktokVideoUrl?: string;
};

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 rounded-lg bg-orange px-8 py-3 font-body font-semibold text-off-white shadow-glow transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

export default function ProfileForm({
  action,
  defaultValues,
  submitLabel,
  pendingLabel,
}: {
  action: (prevState: ProfileFormState, formData: FormData) => Promise<ProfileFormState>;
  defaultValues?: ProfileFormDefaults;
  submitLabel: string;
  pendingLabel: string;
}) {
  const [state, formAction] = useFormState(action, null);
  const goals = defaultValues?.goals ?? [];

  return (
    <form action={formAction} className="glass flex flex-col gap-6 rounded-2xl p-8">
      {state?.error && (
        <p className="rounded-lg border border-orange/30 bg-orange/10 px-4 py-3 text-sm font-body text-orange">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="rounded-lg border border-cyan/30 bg-cyan/10 px-4 py-3 text-sm font-body text-cyan">
          Saved.
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <span className="font-body text-sm font-medium text-off-white/80">Main platform</span>
        <select
          name="platform"
          required
          defaultValue={defaultValues?.platform ?? ""}
          className={inputClass}
        >
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
                defaultChecked={goals.includes(goal.key)}
                className="h-4 w-4 rounded border-off-white/30 bg-transparent accent-orange"
              />
              {goal.label}
            </label>
          ))}
        </div>
      </div>

      <label htmlFor="bio" className="flex flex-col gap-1.5">
        <span className="font-body text-sm font-medium text-off-white/80">Bio (optional)</span>
        <textarea
          id="bio"
          name="bio"
          rows={3}
          maxLength={500}
          defaultValue={defaultValues?.bio ?? ""}
          className={inputClass}
          placeholder="A short intro for your community profile"
        />
      </label>

      <div className="rounded-xl border border-off-white/10 bg-off-white/[0.03] p-4">
        <p className="mb-3 font-body text-xs text-off-white/45">
          Phone and country are private &mdash; only you and TriForge admins can see them. They are
          not shown on your public member profile.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label htmlFor="phone" className="flex flex-col gap-1.5">
            <span className="font-body text-sm font-medium text-off-white/80">Phone</span>
            <input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={defaultValues?.phone ?? ""}
              className={inputClass}
              placeholder="(555) 555-5555"
            />
          </label>
          <label htmlFor="country" className="flex flex-col gap-1.5">
            <span className="font-body text-sm font-medium text-off-white/80">Country</span>
            <select
              id="country"
              name="country"
              defaultValue={defaultValues?.country ?? ""}
              className={inputClass}
            >
              <option value="">Select your country</option>
              {COUNTRY_OPTIONS.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <label htmlFor="tiktokUrl" className="flex flex-col gap-1.5">
          <span className="font-body text-sm font-medium text-off-white/80">TikTok</span>
          <input
            id="tiktokUrl"
            name="tiktokUrl"
            type="url"
            defaultValue={defaultValues?.tiktokUrl ?? ""}
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
            defaultValue={defaultValues?.twitchUrl ?? ""}
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
            defaultValue={defaultValues?.youtubeUrl ?? ""}
            className={inputClass}
            placeholder="https://youtube.com/@you"
          />
        </label>
      </div>

      <label htmlFor="pinnedTiktokVideoUrl" className="flex flex-col gap-1.5">
        <span className="font-body text-sm font-medium text-off-white/80">
          Feature a TikTok video (optional)
        </span>
        <input
          id="pinnedTiktokVideoUrl"
          name="pinnedTiktokVideoUrl"
          type="url"
          defaultValue={defaultValues?.pinnedTiktokVideoUrl ?? ""}
          className={inputClass}
          placeholder="https://www.tiktok.com/@you/video/1234567890123456789"
        />
        <span className="font-body text-xs text-off-white/40">
          Paste a link to one of your videos and it&apos;ll play right on your community profile.
        </span>
      </label>

      <SubmitButton label={submitLabel} pendingLabel={pendingLabel} />
    </form>
  );
}

const inputClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-4 py-2.5 font-body text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60 focus:ring-1 focus:ring-cyan/60";
