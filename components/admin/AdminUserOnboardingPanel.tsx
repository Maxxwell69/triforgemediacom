import { assignMemberOnboarding } from "@/app/admin/onboarding/assign-actions";
import { onboardingKindLabel, onboardingStatusLabel } from "@/lib/onboarding/labels";
import type { OnboardingKind, OnboardingLogAction, OnboardingProgressStatus } from "@prisma/client";

type Step = { id: string; title: string };

type ProgressRow = {
  moduleId: string;
  status: OnboardingProgressStatus;
  completedStepIds: string[];
  dismissedAt: Date | null;
  assignedAt: Date | null;
  completedAt: Date | null;
  assignedBy: { name: string | null; email: string | null } | null;
  module: { title: string; kind: OnboardingKind; steps: Step[] };
};

export default function AdminUserOnboardingPanel({
  userId,
  programs,
  progressRows,
  logs,
}: {
  userId: string;
  programs: { id: string; title: string; kind: OnboardingKind; enabled: boolean }[];
  progressRows: ProgressRow[];
  logs: { id: string; action: OnboardingLogAction; createdAt: Date; module: { title: string } }[];
}) {
  return (
    <section className="glass mt-6 rounded-2xl p-6">
      <h2 className="font-display text-lg tracking-wide text-off-white/80">ONBOARDING</h2>
      <p className="mt-1 font-body text-xs text-off-white/45">
        Assign Getting Started, a campaign path, or any custom checklist.
      </p>

      {progressRows.length === 0 && (
        <p className="mt-3 font-body text-sm text-off-white/40">No checklists assigned yet.</p>
      )}

      <div className="mt-4 flex flex-col gap-4">
        {progressRows.map((progress) => {
          const completedTitles = progress.module.steps
            .filter((step) => progress.completedStepIds.includes(step.id))
            .map((step) => step.title);
          return (
            <div key={progress.moduleId} className="rounded-xl border border-off-white/10 p-4">
              <p className="font-display text-lg tracking-wide text-off-white">
                {progress.module.title}
              </p>
              <p className="font-body text-xs text-off-white/45">
                {onboardingKindLabel(progress.module.kind)}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3 font-body text-sm sm:grid-cols-3">
                <div>
                  <p className="text-xs text-off-white/40">Status</p>
                  <p className="mt-0.5 font-semibold text-off-white">
                    {onboardingStatusLabel(progress.status)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-off-white/40">Assigned</p>
                  <p className="mt-0.5 text-off-white/80">
                    {progress.assignedBy
                      ? `${progress.assignedBy.name || progress.assignedBy.email || "Admin"} · ${formatWhen(progress.assignedAt)}`
                      : "Automatic (first login)"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-off-white/40">Last dismissed</p>
                  <p className="mt-0.5 text-off-white/80">{formatWhen(progress.dismissedAt)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-off-white/40">Completed steps</p>
                  <p className="mt-0.5 text-off-white/80">
                    {completedTitles.length > 0 ? completedTitles.join(" · ") : "None"}
                  </p>
                </div>
              </div>
              <form action={assignMemberOnboarding} className="mt-3">
                <input type="hidden" name="userId" value={userId} />
                <input type="hidden" name="moduleId" value={progress.moduleId} />
                <button
                  type="submit"
                  className="rounded-lg border border-orange/40 px-3 py-1.5 font-body text-xs font-semibold text-orange transition hover:bg-orange/10"
                >
                  Reset this checklist
                </button>
              </form>
            </div>
          );
        })}
      </div>

      {programs.length > 0 && (
        <form action={assignMemberOnboarding} className="mt-5 flex flex-wrap items-end gap-2">
          <input type="hidden" name="userId" value={userId} />
          <label className="font-body text-xs text-off-white/60">
            Assign a checklist
            <select
              name="moduleId"
              className="mt-1 block rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white"
            >
              {programs.map((program) => (
                <option key={program.id} value={program.id}>
                  {program.title}
                  {program.enabled ? "" : " (off)"}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="rounded-lg border border-orange/40 px-4 py-2 font-body text-xs font-semibold text-orange transition hover:bg-orange/10"
          >
            Assign / Reset
          </button>
        </form>
      )}

      {logs.length > 0 && (
        <div className="mt-4 border-t border-off-white/10 pt-4">
          <p className="font-body text-xs uppercase tracking-wide text-off-white/40">
            Dismiss / reopen history
          </p>
          <ul className="mt-2 flex flex-col gap-1">
            {logs.map((log) => (
              <li key={log.id} className="font-body text-xs text-off-white/55">
                {log.module.title} · {log.action === "DISMISSED" ? "Dismissed" : "Reopened"} ·{" "}
                {formatWhen(log.createdAt)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function formatWhen(date: Date | null) {
  if (!date) return "—";
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
