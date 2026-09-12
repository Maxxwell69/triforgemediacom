import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireOnboardingModule } from "@/lib/onboarding/access";
import { getOnboardingProgram } from "@/lib/onboarding/config";
import { deleteOnboardingProgram, deleteOnboardingStep, moveOnboardingStep, updateOnboardingStep } from "../actions";
import OnboardingStepCreateForm from "@/components/admin/OnboardingStepCreateForm";
import OnboardingSettingsForm from "@/components/admin/OnboardingSettingsForm";

export const dynamic = "force-dynamic";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white outline-none focus:border-cyan/60";

export default async function AdminOnboardingProgramPage({
  params,
}: {
  params: { programId: string };
}) {
  requireOnboardingModule();
  const [program, courses] = await Promise.all([
    getOnboardingProgram(params.programId),
    prisma.course.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true } }),
  ]);
  if (!program) notFound();

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/admin/onboarding" className="font-body text-xs text-cyan hover:underline">
        ← All checklists
      </Link>
      <h1 className="mt-3 font-display text-5xl tracking-wide">
        {program.title.toUpperCase()}
      </h1>
      <p className="mt-2 font-body text-off-white/60">
        Edit steps and settings for this checklist. Members only see it after first login or
        when you assign it.
      </p>

      <section className="mt-8">
        <h2 className="font-display text-2xl tracking-wide text-off-white/80">Steps</h2>
        <p className="mt-1 font-body text-sm text-off-white/50">
          ALL steps show to everyone. CN / MN steps only show for that track.
        </p>

        <OnboardingStepCreateForm programId={program.id} />

        <div className="mt-4 flex flex-col gap-3">
          {program.steps.length === 0 && (
            <p className="glass rounded-xl p-4 font-body text-sm text-off-white/40">
              No steps yet. Add the first one above — that is what members see on Home.
            </p>
          )}
          {program.steps.map((step, index) => (
            <div key={step.id} className="glass flex flex-col gap-3 rounded-xl p-4">
              <form action={updateOnboardingStep} className="flex flex-col gap-2">
                <input type="hidden" name="stepId" value={step.id} />
                <input name="title" required defaultValue={step.title} className={fieldClass} />
                <textarea
                  name="description"
                  rows={2}
                  defaultValue={step.description ?? ""}
                  className={fieldClass}
                />
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <select name="trackScope" defaultValue={step.trackScope} className={fieldClass}>
                    <option value="ALL">All members</option>
                    <option value="CN">CN only</option>
                    <option value="MN">MN only</option>
                  </select>
                  <select name="actionType" defaultValue={step.actionType} className={fieldClass}>
                    <option value="CONFIRM">Confirm / check off</option>
                    <option value="LINK">Open a link</option>
                    <option value="COURSE_LINK">Open a course</option>
                    <option value="CUSTOM">Custom path</option>
                  </select>
                </div>
                <input
                  name="actionTarget"
                  defaultValue={step.actionTarget ?? ""}
                  placeholder="Path, URL, or course id"
                  className={fieldClass}
                />
                <label className="font-body text-xs text-off-white/60">
                  XP
                  <input
                    name="xpReward"
                    type="number"
                    min={0}
                    max={10000}
                    defaultValue={step.xpReward}
                    className={`${fieldClass} mt-1`}
                  />
                </label>
                <button
                  type="submit"
                  className="self-start rounded-lg bg-cyan/90 px-3 py-1.5 font-body text-xs font-semibold text-charcoal"
                >
                  Save step
                </button>
              </form>
              <div className="flex flex-wrap gap-2">
                <form action={moveOnboardingStep}>
                  <input type="hidden" name="stepId" value={step.id} />
                  <input type="hidden" name="direction" value="up" />
                  <button
                    type="submit"
                    disabled={index === 0}
                    className="rounded-lg border border-off-white/15 px-3 py-1.5 font-body text-xs text-off-white/60 disabled:opacity-30"
                  >
                    Up
                  </button>
                </form>
                <form action={moveOnboardingStep}>
                  <input type="hidden" name="stepId" value={step.id} />
                  <input type="hidden" name="direction" value="down" />
                  <button
                    type="submit"
                    disabled={index === program.steps.length - 1}
                    className="rounded-lg border border-off-white/15 px-3 py-1.5 font-body text-xs text-off-white/60 disabled:opacity-30"
                  >
                    Down
                  </button>
                </form>
                <form action={deleteOnboardingStep}>
                  <input type="hidden" name="stepId" value={step.id} />
                  <button
                    type="submit"
                    className="rounded-lg border border-orange/30 px-3 py-1.5 font-body text-xs font-semibold text-orange"
                  >
                    Delete
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </section>

      <OnboardingSettingsForm
        programId={program.id}
        title={program.title}
        description={program.description ?? ""}
        kind={program.kind}
        assignOnFirstLogin={program.assignOnFirstLogin}
        enabled={program.enabled}
        disclaimer={program.dismissalDisclaimerText}
        requiredCourseIds={program.requiredCourseIds}
        completionXpReward={program.completionXpReward}
        courses={courses}
      />

      <form action={deleteOnboardingProgram} className="mt-8">
        <input type="hidden" name="programId" value={program.id} />
        <button
          type="submit"
          className="rounded-lg border border-orange/30 px-4 py-2 font-body text-xs font-semibold text-orange"
        >
          Delete this checklist
        </button>
      </form>
    </main>
  );
}
