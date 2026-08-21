"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useState, useTransition } from "react";
import { sendUserPasswordReset, setUserPassword } from "@/app/admin/users/actions";

const inputClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60";

function SetPasswordButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-orange px-4 py-2 font-body text-sm font-semibold text-charcoal shadow-glow transition hover:brightness-110 disabled:opacity-60"
    >
      {pending ? "Saving…" : "Set password"}
    </button>
  );
}

export default function AdminUserPasswordForm({
  userId,
  hasPassword,
  locked,
}: {
  userId: string;
  hasPassword: boolean;
  locked: boolean;
}) {
  const [setState, setAction] = useFormState(setUserPassword, null);
  const [resetMessage, setResetMessage] = useState<{ error?: string; success?: string } | null>(
    null
  );
  const [resetPending, startReset] = useTransition();

  return (
    <section className="mt-6">
      <div className="glass rounded-2xl p-6">
        <h2 className="font-display text-lg tracking-wide text-off-white/80">PASSWORD</h2>
        <p className="mt-1 font-body text-xs text-off-white/40">
          {hasPassword
            ? "A password is already set. You can replace it or email them a reset link."
            : "No password yet. Set one so they can sign in, or email a reset link."}
          {locked ? " This account is locked from failed logins — setting a password unlocks it." : ""}
        </p>

        {(setState?.error || resetMessage?.error) && (
          <p className="mt-3 rounded-lg border border-orange/30 bg-orange/10 px-3 py-2 font-body text-sm text-orange">
            {setState?.error || resetMessage?.error}
          </p>
        )}
        {(setState?.success || resetMessage?.success) && (
          <p className="mt-3 rounded-lg border border-cyan/30 bg-cyan/10 px-3 py-2 font-body text-sm text-cyan">
            {setState?.success || resetMessage?.success}
          </p>
        )}

        <form action={setAction} className="mt-4 flex flex-col gap-3 sm:max-w-md">
          <input type="hidden" name="userId" value={userId} />
          <label className="flex flex-col gap-1 font-body text-sm text-off-white/70">
            New password
            <input
              name="newPassword"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1 font-body text-sm text-off-white/70">
            Confirm password
            <input
              name="confirmPassword"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className={inputClass}
            />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <SetPasswordButton />
            <button
              type="button"
              disabled={resetPending}
              onClick={() => {
                setResetMessage(null);
                startReset(async () => {
                  const result = await sendUserPasswordReset(userId);
                  setResetMessage(result);
                });
              }}
              className="rounded-lg border border-cyan/30 px-4 py-2 font-body text-sm font-semibold text-cyan transition hover:bg-cyan/10 disabled:opacity-60"
            >
              {resetPending ? "Sending…" : "Email reset link"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
