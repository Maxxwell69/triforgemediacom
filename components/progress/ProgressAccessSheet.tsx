"use client";

import { useState, useTransition } from "react";
import VideoEmbed from "@/components/VideoEmbed";
import { applyToProgression } from "@/app/(community)/progress/actions";

export default function ProgressAccessSheet({
  headline,
  body,
  videoUrl,
  applicationStatus,
}: {
  headline: string;
  body: string;
  videoUrl: string | null;
  applicationStatus: "PENDING" | "REJECTED" | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();
  const pending = applicationStatus === "PENDING" || done;

  return (
    <section className="glass mt-8 rounded-2xl p-6 sm:p-8">
      <p className="font-body text-xs font-semibold uppercase tracking-[0.2em] text-orange">
        Media Network
      </p>
      <h2 className="mt-2 font-display text-3xl tracking-wide text-off-white">{headline}</h2>
      <p className="mt-3 whitespace-pre-wrap font-body text-sm leading-relaxed text-off-white/65">
        {body}
      </p>

      <div className="mt-6">
        {videoUrl ? (
          <VideoEmbed url={videoUrl} />
        ) : (
          <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-dashed border-off-white/20 bg-charcoal/60">
            <p className="font-body text-sm text-off-white/40">Video explainer coming soon</p>
          </div>
        )}
      </div>

      {pending ? (
        <p className="mt-6 font-body text-sm text-cyan">
          Your application is in with the team. We&apos;ll email you when you&apos;re added as a Recruit.
        </p>
      ) : (
        <form
          className="mt-8 flex flex-col gap-4"
          action={(formData) => {
            startTransition(async () => {
              const result = await applyToProgression(formData);
              if (result?.error) setError(result.error);
              else {
                setError(null);
                setDone(true);
              }
            });
          }}
        >
          {applicationStatus === "REJECTED" ? (
            <p className="font-body text-sm text-off-white/60">
              Your previous application was declined. You can apply again.
            </p>
          ) : (
            <p className="font-body text-sm text-off-white/60">
              Apply to start Creator Progression. Admins review Media Network requests before you join as a
              Recruit.
            </p>
          )}
          <label className="font-body text-sm text-off-white/70">
            Why do you want to join Creator Progression?
            <textarea
              name="whyJoin"
              required
              minLength={20}
              rows={4}
              className="mt-1 w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white outline-none transition focus:border-cyan/60"
            />
          </label>
          <label className="font-body text-sm text-off-white/70">
            What are you working toward? (optional)
            <textarea
              name="goals"
              rows={3}
              className="mt-1 w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white outline-none transition focus:border-cyan/60"
            />
          </label>
          {error && <p className="font-body text-sm text-orange">{error}</p>}
          <button
            type="submit"
            disabled={isPending}
            className="self-start rounded-lg bg-orange px-5 py-2 font-body text-sm font-semibold text-off-white shadow-glow transition hover:brightness-110 disabled:opacity-40"
          >
            {isPending ? "Submitting…" : "Apply to start"}
          </button>
        </form>
      )}
    </section>
  );
}
