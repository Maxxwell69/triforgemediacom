"use client";

import { useState, useTransition } from "react";
import { updateUserTikTokLink } from "@/app/admin/users/actions";

export default function AdminTikTokLinkForm({
  userId,
  currentUrl,
}: {
  userId: string;
  currentUrl: string;
}) {
  const [value, setValue] = useState(currentUrl);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        setMessage(null);
        setError(null);
        startTransition(async () => {
          const result = await updateUserTikTokLink(userId, value);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          setMessage(
            value.trim()
              ? "TikTok link saved — stats refresh started."
              : "TikTok link cleared."
          );
        });
      }}
    >
      <label htmlFor="admin-tiktok-url" className="flex flex-col gap-1.5">
        <span className="font-body text-xs uppercase tracking-wide text-off-white/40">
          TikTok profile URL or @handle
        </span>
        <input
          id="admin-tiktok-url"
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="https://www.tiktok.com/@username"
          className="rounded-lg border border-off-white/15 bg-charcoal/60 px-3 py-2 font-body text-sm text-off-white placeholder:text-off-white/30 focus:border-cyan/50 focus:outline-none"
        />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg border border-cyan/40 px-3 py-1.5 font-body text-xs font-semibold text-cyan transition hover:bg-cyan/10 disabled:opacity-60"
        >
          {isPending ? "Saving…" : "Save TikTok link"}
        </button>
        {message && (
          <p className="font-body text-xs text-cyan">{message}</p>
        )}
        {error && (
          <p className="font-body text-xs text-orange">{error}</p>
        )}
      </div>
    </form>
  );
}
