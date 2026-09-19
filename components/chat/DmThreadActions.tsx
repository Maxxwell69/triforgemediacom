"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DmThreadActions({
  conversationId,
  isAdmin = false,
  compact = false,
}: {
  conversationId: string;
  isAdmin?: boolean;
  compact?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function leave() {
    if (!confirm("Remove this conversation from your DM list? The other person still has it.")) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/dms/${conversationId}/leave`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Couldn't leave this conversation.");
        return;
      }
      router.push("/dms");
      router.refresh();
    } catch {
      setError("Couldn't leave this conversation.");
    } finally {
      setBusy(false);
      setOpen(false);
    }
  }

  async function archive() {
    if (!confirm("Archive this DM? Members will no longer see it. You can find it under Admin → DM archive.")) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/dms/${conversationId}/archive`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Couldn't archive this conversation.");
        return;
      }
      router.push("/admin/dms/archive");
      router.refresh();
    } catch {
      setError("Couldn't archive this conversation.");
    } finally {
      setBusy(false);
      setOpen(false);
    }
  }

  async function submitReport(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/dms/${conversationId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Couldn't send the report.");
        return;
      }
      setReporting(false);
      setReason("");
      setOpen(false);
      setError(null);
      alert("Thanks — admins have the report.");
    } catch {
      setError("Couldn't send the report.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        disabled={busy}
        onClick={() => {
          setOpen((v) => !v);
          setReporting(false);
          setError(null);
        }}
        className={`rounded-lg px-2 py-1 font-body text-xs text-off-white/50 transition hover:bg-off-white/10 hover:text-off-white ${
          compact ? "" : "border border-off-white/10"
        }`}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {compact ? "···" : "Options"}
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-1 w-56 rounded-xl border border-off-white/10 bg-[#111] p-1 shadow-xl">
          {reporting ? (
            <form onSubmit={submitReport} className="flex flex-col gap-2 p-2">
              <p className="font-body text-xs text-off-white/60">Tell admins what happened</p>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-off-white/15 bg-off-white/5 px-2 py-1.5 font-body text-xs text-off-white outline-none focus:border-cyan/60"
                placeholder="Harassment, spam, threats…"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-lg bg-orange px-2 py-1 font-body text-[11px] font-semibold text-off-white disabled:opacity-50"
                >
                  Send report
                </button>
                <button
                  type="button"
                  onClick={() => setReporting(false)}
                  className="rounded-lg px-2 py-1 font-body text-[11px] text-off-white/50"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={leave}
                className="block w-full rounded-lg px-3 py-2 text-left font-body text-sm text-off-white/80 hover:bg-off-white/10"
              >
                Leave / delete for me
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setReporting(true)}
                className="block w-full rounded-lg px-3 py-2 text-left font-body text-sm text-off-white/80 hover:bg-off-white/10"
              >
                Report to admins
              </button>
              {isAdmin && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={archive}
                  className="block w-full rounded-lg px-3 py-2 text-left font-body text-sm text-orange hover:bg-orange/10"
                >
                  Delete & archive
                </button>
              )}
            </>
          )}
          {error && <p className="px-3 py-1 font-body text-[11px] text-orange">{error}</p>}
        </div>
      )}
    </div>
  );
}
