"use client";

import { useRef, useState } from "react";
import { useLocalParticipant } from "@livekit/components-react";
import {
  buildWebinarParticipantMeta,
  parseWebinarParticipantMeta,
  type WebinarTokenRole,
} from "@/lib/webinarParticipantMeta";
import { ALLOWED_IMAGE_MIME_TYPES, MAX_UPLOAD_BYTES } from "@/lib/uploadConstraints";
import MemberAvatar from "@/components/MemberAvatar";

const MAX_MB = MAX_UPLOAD_BYTES / (1024 * 1024);

export default function WebinarAvatarSettings({ webinarId }: { webinarId: string }) {
  const { localParticipant } = useLocalParticipant();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlDraft, setUrlDraft] = useState("");
  const [localAvatar, setLocalAvatar] = useState<string | null | undefined>(undefined);

  const meta = parseWebinarParticipantMeta(localParticipant?.metadata);
  const avatarUrl =
    localAvatar !== undefined ? localAvatar : meta.avatarUrl || null;
  const initial = (localParticipant?.name || "?").replace(/^@/, "").charAt(0).toUpperCase() || "?";

  async function syncLocalMetadata(nextAvatar: string | null) {
    if (!localParticipant) return;
    const role = (meta.role || "audience") as WebinarTokenRole;
    const metadata = buildWebinarParticipantMeta({ role, avatarUrl: nextAvatar });
    setLocalAvatar(nextAvatar);
    try {
      await localParticipant.setMetadata(metadata);
    } catch {
      // Server update via API is enough; local sync is best-effort.
    }
  }

  async function uploadFile(file: File) {
    setError(null);
    if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_MIME_TYPES)[number])) {
      setError("Use JPG, PNG, WEBP, or GIF.");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setError(`Max size is ${MAX_MB}MB.`);
      return;
    }

    setBusy(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/webinars/${webinarId}/avatar`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      await syncLocalMetadata(data.avatarUrl || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function saveUrl() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/webinars/${webinarId}/avatar`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: urlDraft.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save");
      await syncLocalMetadata(data.avatarUrl || null);
      setUrlDraft("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border-b border-off-white/10 px-3 py-3">
      <p className="font-body text-[11px] font-semibold uppercase tracking-wide text-off-white/40">
        Your avatar
      </p>
      <div className="mt-2 flex items-center gap-3">
        <MemberAvatar avatarUrl={avatarUrl} initial={initial} size={40} textSize="text-sm" />
        <div className="min-w-0 flex-1">
          <label className="inline-flex cursor-pointer rounded-lg border border-cyan/35 px-2.5 py-1.5 font-body text-xs font-semibold text-cyan transition hover:bg-cyan/10">
            {busy ? "Saving…" : avatarUrl ? "Replace photo" : "Upload photo"}
            <input
              ref={inputRef}
              type="file"
              accept={ALLOWED_IMAGE_MIME_TYPES.join(",")}
              disabled={busy}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadFile(file);
              }}
            />
          </label>
          <p className="mt-1 font-body text-[10px] text-off-white/35">
            Shown on stage and in People when your camera is off.
          </p>
        </div>
      </div>
      <div className="mt-2 flex gap-2">
        <input
          value={urlDraft}
          onChange={(e) => setUrlDraft(e.target.value)}
          placeholder="Or paste image URL"
          disabled={busy}
          className="min-w-0 flex-1 rounded-lg border border-off-white/15 bg-charcoal px-2 py-1.5 font-body text-xs text-off-white outline-none focus:border-cyan/50"
        />
        <button
          type="button"
          disabled={busy || !urlDraft.trim()}
          onClick={() => void saveUrl()}
          className="shrink-0 rounded-lg border border-off-white/20 px-2 py-1.5 font-body text-xs text-off-white/70 transition hover:bg-off-white/5 disabled:opacity-40"
        >
          Save
        </button>
      </div>
      {error && <p className="mt-1 font-body text-xs text-orange">{error}</p>}
    </div>
  );
}
