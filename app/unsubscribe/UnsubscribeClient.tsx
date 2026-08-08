"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  resubscribeBroadcastAction,
  unsubscribeBroadcastAction,
} from "./actions";

export default function UnsubscribeClient({
  token,
  email,
  initiallyUnsubscribed,
}: {
  token: string;
  email: string;
  initiallyUnsubscribed: boolean;
}) {
  const [unsubscribed, setUnsubscribed] = useState(initiallyUnsubscribed);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function unsubscribe() {
    setError(null);
    startTransition(async () => {
      const result = await unsubscribeBroadcastAction(token);
      if (result.error) {
        setError(result.error);
        return;
      }
      setUnsubscribed(true);
    });
  }

  function resubscribe() {
    setError(null);
    startTransition(async () => {
      const result = await resubscribeBroadcastAction(token);
      if (result.error) {
        setError(result.error);
        return;
      }
      setUnsubscribed(false);
    });
  }

  return (
    <div className="mt-4 space-y-4">
      <p className="font-body text-sm text-off-white/70">
        {unsubscribed ? (
          <>
            <span className="text-off-white">{email}</span> is unsubscribed from TriForge Hub
            announcement emails. You&apos;ll still get account emails (invites, password resets,
            etc.).
          </>
        ) : (
          <>
            Unsubscribe <span className="text-off-white">{email}</span> from community announcement
            emails? You&apos;ll still get important account mail.
          </>
        )}
      </p>

      {error && (
        <p className="rounded-lg border border-orange/30 bg-orange/10 px-3 py-2 font-body text-sm text-orange">
          {error}
        </p>
      )}

      {unsubscribed ? (
        <button
          type="button"
          onClick={resubscribe}
          disabled={pending}
          className="rounded-lg border border-cyan/50 px-5 py-2.5 font-body text-sm font-semibold text-cyan transition hover:bg-cyan/10 disabled:opacity-50"
        >
          {pending ? "Updating..." : "Resubscribe to announcements"}
        </button>
      ) : (
        <button
          type="button"
          onClick={unsubscribe}
          disabled={pending}
          className="rounded-lg bg-orange px-5 py-2.5 font-body text-sm font-semibold text-off-white shadow-glow transition hover:brightness-110 disabled:opacity-50"
        >
          {pending ? "Updating..." : "Unsubscribe"}
        </button>
      )}

      <p className="font-body text-xs text-off-white/40">
        Signed-in members can also change this anytime on{" "}
        <Link href="/account" className="text-cyan/80 underline-offset-2 hover:underline">
          Account
        </Link>
        .
      </p>
    </div>
  );
}
