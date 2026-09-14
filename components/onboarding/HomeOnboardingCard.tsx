"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import VideoEmbed from "@/components/VideoEmbed";
import {
  dismissMemberOnboarding,
  toggleMemberOnboardingStep,
} from "@/app/(community)/onboarding/actions";

export type HomeOnboardingStep = {
  id: string;
  title: string;
  description: string | null;
  href: string | null;
  courseTitle?: string | null;
  done: boolean;
  xpReward: number;
};

export type HomeOnboardingCourse = {
  id: string;
  title: string;
  href: string;
  done: boolean;
};

export default function HomeOnboardingCard({
  moduleId,
  title,
  steps,
  disclaimer,
  requiredCourses,
  completionXpReward,
  explainerVideoUrl,
}: {
  moduleId: string;
  title: string;
  steps: HomeOnboardingStep[];
  disclaimer: string;
  requiredCourses: HomeOnboardingCourse[];
  completionXpReward: number;
  explainerVideoUrl?: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [dismissOpen, setDismissOpen] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const doneCount = steps.filter((s) => s.done).length;
  const requiredDone = requiredCourses.filter((course) => course.done).length;
  const stepCourseHrefs = new Set(steps.map((step) => step.href).filter(Boolean));
  const extraRequiredCourses = requiredCourses.filter((course) => !stepCourseHrefs.has(course.href));

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
        await dismissMemberOnboarding(moduleId);
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
            {title}
          </h2>
          <p className="mt-1 font-body text-sm text-off-white/60">
            {doneCount}/{steps.length} step{steps.length === 1 ? "" : "s"} done
            {requiredCourses.length > 0
              ? ` · ${requiredDone}/${requiredCourses.length} required course${requiredCourses.length === 1 ? "" : "s"}`
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

      {explainerVideoUrl ? (
        <div className="mt-4 max-w-2xl">
          <VideoEmbed url={explainerVideoUrl} />
        </div>
      ) : null}

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
                    className="mt-2 inline-flex items-center rounded-lg border border-cyan/40 bg-cyan/10 px-3 py-1.5 font-body text-xs font-semibold text-cyan transition hover:bg-cyan/15"
                  >
                    {step.courseTitle ? `Open ${step.courseTitle}` : "Open"} →
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {extraRequiredCourses.length > 0 && (
        <div className="mt-4">
          <p className="font-body text-xs font-semibold uppercase tracking-wide text-off-white/40">
            Required courses
          </p>
          <ul className="mt-2 flex flex-col gap-2">
            {extraRequiredCourses.map((course) => (
              <li key={course.id}>
                <Link
                  href={course.href}
                  className="inline-flex items-center rounded-lg border border-cyan/40 bg-cyan/10 px-3 py-1.5 font-body text-xs font-semibold text-cyan transition hover:bg-cyan/15"
                >
                  {course.done ? `Review ${course.title}` : `Open ${course.title}`} →
                </Link>
              </li>
            ))}
          </ul>
        </div>
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
