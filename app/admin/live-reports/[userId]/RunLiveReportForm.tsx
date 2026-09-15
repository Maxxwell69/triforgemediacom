"use client";

import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { runLiveReportAction, type LiveReportFormState } from "@/app/admin/live-reports/actions";

function RunButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-orange px-4 py-2 font-body text-sm font-semibold text-off-white shadow-glow transition hover:brightness-110 disabled:opacity-50"
    >
      {pending ? "Running…" : "Run report"}
    </button>
  );
}

export function RunLiveReportForm({
  userId,
  month,
  options,
}: {
  userId: string;
  month: string;
  options: { value: string; label: string }[];
}) {
  const router = useRouter();
  const [state, formAction] = useFormState<LiveReportFormState, FormData>(
    runLiveReportAction,
    null
  );

  return (
    <form action={formAction} className="flex flex-col items-stretch gap-2 sm:items-end">
      <input type="hidden" name="userId" value={userId} />
      <div className="flex flex-wrap items-center gap-2">
        <select
          name="month"
          defaultValue={month}
          onChange={(event) => {
            router.push(`/admin/live-reports/${userId}?month=${event.target.value}`);
          }}
          className="rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white outline-none focus:border-cyan/60"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <RunButton />
      </div>
      {state?.error && (
        <p className="max-w-xs font-body text-xs text-orange">{state.error}</p>
      )}
    </form>
  );
}
