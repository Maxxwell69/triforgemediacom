"use client";

import { useState } from "react";

export default function TikTokNetworkCTA({
  applicationId,
  inviteLink,
}: {
  applicationId: string | null;
  inviteLink: string;
}) {
  const [requestedSent, setRequestedSent] = useState(false);
  const [approved, setApproved] = useState(false);

  async function notifyRequested() {
    if (!applicationId) return;
    try {
      const res = await fetch("/api/apply/tiktok-network", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId, action: "requested" }),
      });
      const result = await res.json().catch(() => null);
      if (result?.approved) setApproved(true);
    } catch {
      // Best-effort — don't block the user's TikTok flow on our own tracking call.
    }
  }

  function handleOpenTikTok() {
    if (!requestedSent) {
      setRequestedSent(true);
      void notifyRequested();
    }
    window.open(inviteLink, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="mt-6 flex flex-col gap-4">
      <button
        type="button"
        onClick={handleOpenTikTok}
        className="inline-flex items-center justify-center gap-2 self-start rounded-lg bg-orange px-6 py-3 font-body font-semibold text-off-white shadow-glow transition hover:brightness-110"
      >
        {requestedSent ? "✓ Open TikTok again" : "Apply to the TriForge Creator Network"}
      </button>
      {approved ? (
        <p className="rounded-lg border border-cyan/30 bg-cyan/10 px-4 py-3 font-body text-sm text-cyan">
          You&apos;re in! Check your email for a link to set up your TriForge Hub login — jump
          into the &ldquo;Joining the Creator Network&rdquo; course while your application and
          contract with us finish up over on TikTok.
        </p>
      ) : (
        requestedSent && (
          <p className="font-body text-xs text-cyan">
            Got it — we&apos;ve noted your application and our team&apos;s been notified.
          </p>
        )
      )}
    </div>
  );
}
