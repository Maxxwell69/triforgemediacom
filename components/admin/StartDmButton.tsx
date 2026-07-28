"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function StartDmButton({
  userId,
  userName,
}: {
  userId: string;
  userName: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/dms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Couldn't start DM");
        return;
      }
      router.push(`/dms/${data.conversationId}`);
    } catch {
      setError("Couldn't start DM");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={start}
        disabled={busy}
        className="rounded-lg border border-cyan/40 px-3 py-1.5 font-body text-xs font-semibold text-cyan transition hover:bg-cyan/10 disabled:opacity-40"
      >
        {busy ? "Opening…" : `Message ${userName}`}
      </button>
      {error && <p className="font-body text-[10px] text-orange">{error}</p>}
    </div>
  );
}
