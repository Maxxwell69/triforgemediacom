"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { updateShowRealName } from "@/app/(community)/account/actions";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg border border-cyan/40 px-4 py-2 font-body text-xs font-semibold text-cyan transition hover:bg-cyan/10 disabled:opacity-40"
    >
      {pending ? "Saving…" : "Save display preference"}
    </button>
  );
}

export default function DisplayNamePreference({
  showRealName: initialShowRealName,
  realName,
  tiktokUsername,
}: {
  showRealName: boolean;
  realName: string | null;
  tiktokUsername: string | null;
}) {
  const [state, formAction] = useFormState(updateShowRealName, null);
  const [showRealName, setShowRealName] = useState(initialShowRealName);
  const preview = showRealName
    ? realName || tiktokUsername || "Unnamed"
    : tiktokUsername || realName || "Unnamed";

  return (
    <form action={formAction} className="glass flex flex-col gap-4 rounded-2xl p-6">
      <div>
        <p className="font-body text-sm font-medium text-off-white/80">Public display name</p>
        <p className="mt-1 font-body text-xs text-off-white/45">
          Other members see this on your profile and in the directory. TikTok username is the
          default so your real name stays private unless you opt in.
        </p>
      </div>

      <label className="flex items-start gap-3 rounded-lg border border-off-white/10 bg-off-white/5 p-4">
        <input
          type="checkbox"
          name="showRealName"
          value="on"
          checked={showRealName}
          onChange={(e) => setShowRealName(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-off-white/30 bg-transparent accent-orange"
        />
        <span className="font-body text-sm leading-relaxed text-off-white/80">
          Show my real name publicly
          <span className="mt-1 block text-xs text-off-white/45">
            Unchecked (default): show TikTok username
            {tiktokUsername ? ` (${tiktokUsername})` : " — add a TikTok link or connect TikTok first"}
            . Checked: show your account name
            {realName ? ` (${realName})` : ""}.
          </span>
        </span>
      </label>

      <p className="font-body text-xs text-off-white/50">
        Preview: <span className="font-semibold text-off-white/85">{preview}</span>
      </p>

      {state?.error && <p className="font-body text-xs text-orange">{state.error}</p>}
      {state?.success && (
        <p className="font-body text-xs text-cyan">Saved. Your public name is updated.</p>
      )}

      <div>
        <SaveButton />
      </div>
    </form>
  );
}
