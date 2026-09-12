"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  dismissMemberOnboarding,
  toggleMemberOnboardingStep,
} from "@/app/(community)/onboarding/actions";

export type HomeOnboardingStep = {
  id: string;
  title: string;
  description: string | null;
  href: string | null;
  done: boolean;
  xpReward: number;
};

export default function HomeOnboardingCard({
  steps,
  disclaimer,
  requiredCourses,
  completionXpReward,
}: {
  steps: HomeOnboardingStep[];
  disclaimer: string;
  requiredCourses: { done: number; total: number };
  completionXpReward: number;
}) {
  const [pending, startTransition] = useTransition();
  const [dismissOpen, setDismissOpen] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const doneCount = steps.filter((s) => s.done).length;

  function onToggle(stepId: string, done: boolean) {
    setError(null);
    startTransition(async () => {
      try {
        await toggleMemberOnboardingStep(stepId, done);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not update step");
      }
    });
  }

  function onDismiss() {
    if (!acknowledged) return;
    setError(null);
    startTransition(async () => {
      try {
        await dismissMemberOnboarding();
        setDismissOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not dismiss");
      }
    });
  }

  return (
    <section className="glass rounded-2xl border border-orange/30 bg-orange/5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl tracking-wide">
            GETTING <span className="text-gradient">STARTED</span>
          </h2>
          <p className="mt-1 font-body text-sm text-off-white/60">
            {doneCount}/{steps.length} step{steps.length === 1 ? "" : "s"} done
            {requiredCourses.total > 0
              ? ` · ${requiredCourses.done}/${requiredCourses.total} required course${requiredCourses.total === 1 ? "" : "s"}`
              : ""}
            {completionXpReward > 0 ? ` · +${completionXpReward} XP when finished` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDismissOpen(true)}
          className="rounded-lg border border-off-white/20 px-3 py-1.5 font-body text-xs text-off-white/60 transition hover:border-off-white/40 hover:text-off-white"
        >
          Dismiss
        </button>
      </div>

      {error && <p className="mt-3 font-body text-sm text-orange">{error}</p>}

      {steps.length === 0 ? (
        <p className="mt-4 font-body text-sm text-off-white/50">
          No steps for your track yet. Finish any required courses, or wait for an admin to add
          steps.
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {steps.map((step) => (
            <li
              key={step.id}
              className="flex items-start gap-3 rounded-xl border border-off-white/10 bg-charcoal/40 px-3 py-2.5"
            >
              <input
                type="checkbox"
                checked={step.done}
                disabled={pending}
                onChange={(e) => onToggle(step.id, e.target.checked)}
                className="mt-1 accent-orange"
                aria-label={step.title}
              />
              <div className="min-w-0 flex-1">
                <p
                  className={`font-body text-sm font-medium ${
                    step.done ? "text-off-white/45 line-through" : "text-off-white"
                  }`}
                >
                  {step.title}
                  {step.xpReward > 0 && (
                    <span className="ml-2 font-body text-xs font-semibold text-cyan no-underline">
                      +{step.xpReward} XP
                    </span>
                  )}
                </p>
                {step.description && (
                  <p className="mt-0.5 font-body text-xs text-off-white/45">{step.description}</p>
                )}
                {step.href && (
                  <Link
                    href={step.href}
                    className="mt-1 inline-block font-body text-xs font-semibold text-cyan hover:underline"
                  >
                    Open →
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {dismissOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/80 p-4">
          <div className="glass w-full max-w-md rounded-2xl border border-orange/30 p-6">
            <h3 className="font-display text-xl tracking-wide">Dismiss onboarding?</h3>
            <p className="mt-3 whitespace-pre-wrap font-body text-sm text-off-white/75">
              {disclaimer}
            </p>
            <label className="mt-4 flex items-start gap-2 font-body text-sm text-off-white/70">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="mt-0.5 accent-orange"
              />
              I understand and want to dismiss this checklist
            </label>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setDismissOpen(false);
                  setAcknowledged(false);
                }}
                className="rounded-lg border border-off-white/20 px-4 py-2 font-body text-sm text-off-white/70"
              >
                Keep it
              </button>
              <button
                type="button"
                disabled={!acknowledged || pending}
                onClick={onDismiss}
                className="rounded-lg bg-orange px-4 py-2 font-body text-sm font-semibold text-off-white shadow-glow disabled:opacity-40"
              >
                Dismiss checklist
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
