"use client";

import { useFormState, useFormStatus } from "react-dom";
import { updateNameIdentity } from "./actions";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-orange px-4 py-2 font-body text-sm font-semibold text-charcoal transition hover:bg-orange/90 disabled:opacity-40"
    >
      {pending ? "Saving…" : "Save name"}
    </button>
  );
}

export default function NameIdentityForm({
  name,
  username,
}: {
  name: string;
  username: string;
}) {
  const [state, formAction] = useFormState(updateNameIdentity, null);

  return (
    <form action={formAction} className="glass flex flex-col gap-4 rounded-2xl p-6">
      <div>
        <p className="font-body text-sm font-medium text-off-white/80">Name & username</p>
        <p className="mt-1 font-body text-xs text-off-white/45">
          Your name is for your account. Username is your community handle. Chat rooms always
          show your TikTok nickname (connect TikTok or add a TikTok link on your profile).
        </p>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="font-body text-xs uppercase tracking-wide text-off-white/50">Name</span>
        <input
          name="name"
          defaultValue={name}
          maxLength={80}
          placeholder="Your name"
          className="rounded-lg border border-off-white/15 bg-charcoal px-3 py-2 font-body text-sm text-off-white outline-none focus:border-orange"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="font-body text-xs uppercase tracking-wide text-off-white/50">
          Username
        </span>
        <input
          name="username"
          defaultValue={username}
          maxLength={32}
          placeholder="community_handle"
          pattern="[A-Za-z0-9._]+"
          className="rounded-lg border border-off-white/15 bg-charcoal px-3 py-2 font-body text-sm text-off-white outline-none focus:border-orange"
        />
        <span className="font-body text-[11px] text-off-white/35">
          Letters, numbers, dots, and underscores. 3–32 characters.
        </span>
      </label>

      {state?.error && <p className="font-body text-xs text-orange">{state.error}</p>}
      {state?.success && (
        <p className="font-body text-xs text-cyan">Saved. Name and username updated.</p>
      )}

      <div>
        <SaveButton />
      </div>
    </form>
  );
}
