"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  removeLiveRosterMemberAction,
  type LiveReportFormState,
} from "@/app/admin/live-reports/actions";

function RemoveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg border border-orange/40 px-3 py-1.5 font-body text-xs font-semibold text-orange transition hover:bg-orange/10 disabled:opacity-40"
    >
      {pending ? "Removing…" : "Remove"}
    </button>
  );
}

export default function AgencyLiveRosterRemove({ userId }: { userId: string }) {
  const [state, formAction] = useFormState<LiveReportFormState, FormData>(
    removeLiveRosterMemberAction,
    null
  );

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm("Remove this creator from LIVE reports?")) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="userId" value={userId} />
      <RemoveButton />
      {state?.error && <p className="mt-1 font-body text-[11px] text-orange">{state.error}</p>}
    </form>
  );
}
