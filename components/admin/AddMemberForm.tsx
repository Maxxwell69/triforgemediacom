"use client";

import { useFormState, useFormStatus } from "react-dom";
import { addMemberDirectly } from "@/app/admin/users/actions";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="self-start rounded-lg bg-orange px-6 py-2 font-body font-semibold text-off-white shadow-glow transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Adding..." : "Add & invite"}
    </button>
  );
}

export default function AddMemberForm() {
  const [state, formAction] = useFormState(addMemberDirectly, null);

  return (
    <form
      key={state?.success ? "sent" : "form"}
      action={formAction}
      className="glass flex flex-col gap-3 rounded-2xl p-6"
    >
      <h2 className="font-display text-xl tracking-wide text-off-white/80">Add a member directly</h2>
      <p className="font-body text-xs text-off-white/50">
        Skips the application queue &mdash; creates the account and emails an invite link right away.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input name="name" required placeholder="Name" className={fieldClass} />
        <input name="email" type="email" required placeholder="Email" className={fieldClass} />
      </div>
      {state?.error && (
        <p className="rounded-lg border border-orange/30 bg-orange/10 px-4 py-3 font-body text-sm text-orange">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="rounded-lg border border-cyan/30 bg-cyan/10 px-4 py-3 font-body text-sm text-cyan">
          Member added and invited.
        </p>
      )}
      <SubmitButton />
    </form>
  );
}
