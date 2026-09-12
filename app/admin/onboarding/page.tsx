import Link from "next/link";
import { requireOnboardingModule } from "@/lib/onboarding/access";
import { listOnboardingPrograms } from "@/lib/onboarding/config";
import { onboardingKindLabel } from "@/lib/onboarding/labels";
import OnboardingProgramCreateForm from "@/components/admin/OnboardingProgramCreateForm";

export const dynamic = "force-dynamic";

export default async function AdminOnboardingPage() {
  requireOnboardingModule();
  const programs = await listOnboardingPrograms();

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-5xl tracking-wide">
        ONBOARD<span className="text-gradient">ING</span>
      </h1>
      <p className="mt-2 font-body text-off-white/60">
        Create different checklists — Getting Started for new members, campaign follow-through,
        or any custom path. Assign them from a member profile.
      </p>

      <OnboardingProgramCreateForm />

      <div className="mt-8 flex flex-col gap-3">
        {programs.map((program) => (
          <Link
            key={program.id}
            href={`/admin/onboarding/${program.id}`}
            className="glass rounded-xl p-4 transition hover:border-cyan/40"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-display text-xl tracking-wide text-off-white">{program.title}</p>
                <p className="mt-1 font-body text-xs text-off-white/50">
                  {onboardingKindLabel(program.kind)}
                  {program.assignOnFirstLogin ? " · auto on first login" : ""}
                  {!program.enabled ? " · off" : ""}
                </p>
                {program.description && (
                  <p className="mt-2 font-body text-sm text-off-white/60">{program.description}</p>
                )}
              </div>
              <p className="font-body text-xs text-off-white/45">
                {program._count.steps} step{program._count.steps === 1 ? "" : "s"} ·{" "}
                {program._count.progress} assigned
              </p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
