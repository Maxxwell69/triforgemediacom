import { assignMemberOnboarding } from "@/app/admin/onboarding/assign-actions";
import { onboardingStatusLabel } from "@/lib/onboarding/labels";
import type { OnboardingLogAction, OnboardingProgressStatus } from "@prisma/client";

type Step = { id: string; title: string };

type Progress = {
  status: OnboardingProgressStatus;
  completedStepIds: string[];
  dismissedAt: Date | null;
  assignedAt: Date | null;
  completedAt: Date | null;
  assignedBy: { name: string | null; email: string | null } | null;
};

export default function AdminUserOnboardingPanel({
  userId,
  progress,
  steps,
  logs,
}: {
  userId: string;
  progress: Progress | null;
  steps: Step[];
  logs: { id: string; action: OnboardingLogAction; createdAt: Date }[];
}) {
  const status = progress?.status ?? "NOT_STARTED";
  const completedTitles = steps
    .filter((step) => progress?.completedStepIds.includes(step.id))
    .map((step) => step.title);
  const assignLabel = progress ? "Reset" : "Assign";

  return (
    <section className="glass mt-6 rounded-2xl p-6">
      <h2 className="font-display text-lg tracking-wide text-off-white/80">ONBOARDING</h2>
      <div className="mt-3 grid grid-cols-2 gap-3 font-body text-sm sm:grid-cols-3">
        <div>
          <p className="text-xs text-off-white/40">Status</p>
          <p className="mt-0.5 font-semibold text-off-white">{onboardingStatusLabel(status)}</p>
        </div>
        <div>
          <p className="text-xs text-off-white/40">Assigned</p>
          <p className="mt-0.5 text-off-white/80">
            {progress?.assignedBy
              ? `${progress.assignedBy.name || progress.assignedBy.email || "Admin"} · ${formatWhen(progress.assignedAt)}`
              : progress
                ? "Automatic (first login)"
                : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs text-off-white/40">Last dismissed</p>
          <p className="mt-0.5 text-off-white/80">{formatWhen(progress?.dismissedAt ?? null)}</p>
        </div>
        <div>
          <p className="text-xs text-off-white/40">Completed</p>
          <p className="mt-0.5 text-off-white/80">{formatWhen(progress?.completedAt ?? null)}</p>
        </div>
        <div className="col-span-2">
          <p className="text-xs text-off-white/40">Completed steps</p>
          <p className="mt-0.5 text-off-white/80">
            {completedTitles.length > 0 ? completedTitles.join(" · ") : "None"}
          </p>
        </div>
      </div>

      <form action={assignMemberOnboarding} className="mt-4">
        <input type="hidden" name="userId" value={userId} />
        <button
          type="submit"
          className="rounded-lg border border-orange/40 px-4 py-2 font-body text-xs font-semibold text-orange transition hover:bg-orange/10"
        >
          {assignLabel} checklist
        </button>
      </form>

      {logs.length > 0 && (
        <div className="mt-4 border-t border-off-white/10 pt-4">
          <p className="font-body text-xs uppercase tracking-wide text-off-white/40">
            Dismiss / reopen history
          </p>
          <ul className="mt-2 flex flex-col gap-1">
            {logs.map((log) => (
              <li key={log.id} className="font-body text-xs text-off-white/55">
                {log.action === "DISMISSED" ? "Dismissed" : "Reopened"} · {formatWhen(log.createdAt)}
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
