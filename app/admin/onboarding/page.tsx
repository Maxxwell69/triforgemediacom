import { prisma } from "@/lib/prisma";
import { requireOnboardingModule } from "@/lib/onboarding/module";
import { getOrCreateOnboardingModule } from "@/lib/onboarding/config";
import {
  createOnboardingStep,
  deleteOnboardingStep,
  moveOnboardingStep,
  updateOnboardingSettings,
  updateOnboardingStep,
} from "./actions";

export const dynamic = "force-dynamic";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white outline-none focus:border-cyan/60";

export default async function AdminOnboardingPage() {
  requireOnboardingModule();
  const [module, courses] = await Promise.all([
    getOrCreateOnboardingModule(),
    prisma.course.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true } }),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-5xl tracking-wide">
        ONBOARD<span className="text-gradient">ING</span>
      </h1>
      <p className="mt-2 font-body text-off-white/60">
        Member checklist after first login. Separate from profile setup. New members get it
        automatically; existing members only if you assign it.
      </p>

      <form action={updateOnboardingSettings} className="glass mt-8 flex flex-col gap-4 rounded-2xl p-6">
        <h2 className="font-display text-xl tracking-wide text-off-white/80">Settings</h2>
        <label className="flex items-center gap-2 font-body text-sm text-off-white/70">
          <input
            type="checkbox"
            name="enabled"
            defaultChecked={module.enabled}
            className="accent-orange"
          />
          Show the checklist to members (SKU must also be on)
        </label>
        <label className="font-body text-sm text-off-white/70">
          Dismiss disclaimer
          <textarea
            name="dismissalDisclaimerText"
            required
            rows={3}
            defaultValue={module.dismissalDisclaimerText}
            className={`${fieldClass} mt-1`}
          />
        </label>
        <fieldset>
          <legend className="font-body text-sm text-off-white/70">Required courses</legend>
          <p className="mt-1 font-body text-xs text-off-white/40">
            Checklist cannot complete until these courses are finished.
          </p>
          <div className="mt-2 flex flex-col gap-1.5">
            {courses.length === 0 && (
              <p className="font-body text-xs text-off-white/40">No courses yet.</p>
            )}
            {courses.map((course) => (
              <label
                key={course.id}
                className="flex items-center gap-2 font-body text-sm text-off-white/75"
              >
                <input
                  type="checkbox"
                  name="requiredCourseIds"
                  value={course.id}
                  defaultChecked={module.requiredCourseIds.includes(course.id)}
                  className="accent-orange"
                />
                {course.title}
              </label>
            ))}
          </div>
        </fieldset>
        <button
          type="submit"
          className="self-start rounded-lg bg-orange px-5 py-2 font-body text-sm font-semibold text-off-white shadow-glow"
        >
          Save settings
        </button>
      </form>

      <section className="mt-10">
        <h2 className="font-display text-2xl tracking-wide text-off-white/80">Steps</h2>
        <p className="mt-1 font-body text-sm text-off-white/50">
          ALL steps show to everyone. CN / MN steps only show for that track.
        </p>

        <form action={createOnboardingStep} className="glass mt-4 flex flex-col gap-3 rounded-2xl p-6">
          <h3 className="font-display text-lg tracking-wide text-off-white/80">Add step</h3>
          <input name="title" required placeholder="Step title" className={fieldClass} />
          <textarea
            name="description"
            rows={2}
            placeholder="Optional details"
            className={fieldClass}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="font-body text-sm text-off-white/70">
              Track
              <select name="trackScope" defaultValue="ALL" className={`${fieldClass} mt-1`}>
                <option value="ALL">All members</option>
                <option value="CN">CN only</option>
                <option value="MN">MN only</option>
              </select>
            </label>
            <label className="font-body text-sm text-off-white/70">
              Action
              <select name="actionType" defaultValue="CONFIRM" className={`${fieldClass} mt-1`}>
                <option value="CONFIRM">Confirm / check off</option>
                <option value="LINK">Open a link</option>
                <option value="COURSE_LINK">Open a course</option>
                <option value="CUSTOM">Custom path</option>
              </select>
            </label>
          </div>
          <label className="font-body text-sm text-off-white/70">
            Target (path, URL, or course id)
            <input
              name="actionTarget"
              placeholder="/account/profile, https://…, or a course id"
              className={`${fieldClass} mt-1`}
            />
          </label>
          {courses.length > 0 && (
            <p className="font-body text-xs text-off-white/40">
              Course ids: {courses.map((c) => `${c.title} → ${c.id}`).join(" · ")}
            </p>
          )}
          <button
            type="submit"
            className="self-start rounded-lg bg-cyan/90 px-4 py-2 font-body text-sm font-semibold text-charcoal"
          >
            Add step
          </button>
        </form>

        <div className="mt-4 flex flex-col gap-3">
          {module.steps.length === 0 && (
            <p className="glass rounded-xl p-4 font-body text-sm text-off-white/40">
              No steps yet. Add the first one above.
            </p>
          )}
          {module.steps.map((step, index) => (
            <div key={step.id} className="glass flex flex-col gap-3 rounded-xl p-4">
              <form action={updateOnboardingStep.bind(null, step.id)} className="flex flex-col gap-2">
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
                <button
                  type="submit"
                  className="self-start rounded-lg bg-cyan/90 px-3 py-1.5 font-body text-xs font-semibold text-charcoal"
                >
                  Save step
                </button>
              </form>
              <div className="flex flex-wrap gap-2">
                <form action={moveOnboardingStep.bind(null, step.id, "up")}>
                  <button
                    type="submit"
                    disabled={index === 0}
                    className="rounded-lg border border-off-white/15 px-3 py-1.5 font-body text-xs text-off-white/60 disabled:opacity-30"
                  >
                    Up
                  </button>
                </form>
                <form action={moveOnboardingStep.bind(null, step.id, "down")}>
                  <button
                    type="submit"
                    disabled={index === module.steps.length - 1}
                    className="rounded-lg border border-off-white/15 px-3 py-1.5 font-body text-xs text-off-white/60 disabled:opacity-30"
                  >
                    Down
                  </button>
                </form>
                <form action={deleteOnboardingStep.bind(null, step.id)}>
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
    </main>
  );
}
