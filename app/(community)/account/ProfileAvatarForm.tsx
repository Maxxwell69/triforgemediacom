"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ALLOWED_IMAGE_MIME_TYPES, MAX_UPLOAD_BYTES } from "@/lib/uploadConstraints";
import MemberAvatar from "@/components/MemberAvatar";

const MAX_MB = MAX_UPLOAD_BYTES / (1024 * 1024);

export default function ProfileAvatarForm({
  customImageUrl,
  fallbackUrl,
  initial,
}: {
  customImageUrl: string | null;
  fallbackUrl: string | null;
  initial: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [custom, setCustom] = useState(customImageUrl);
  const [urlDraft, setUrlDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const preview = custom || fallbackUrl;

  async function uploadFile(file: File) {
    setError(null);
    setSaved(false);
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
      const res = await fetch("/api/account/avatar", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setCustom(data.imageUrl || null);
      setSaved(true);
      router.refresh();
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
    setSaved(false);
    try {
      const res = await fetch("/api/account/avatar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: urlDraft.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save");
      setCustom(data.imageUrl || null);
      setUrlDraft("");
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  async function removePhoto() {
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/account/avatar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: "" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not remove");
      setCustom(data.imageUrl || null);
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="glass flex flex-col gap-4 rounded-2xl p-6">
      <div>
        <p className="font-body text-sm font-medium text-off-white/80">Profile photo</p>
        <p className="mt-1 font-body text-xs text-off-white/45">
          Shown on your member profile, in chat, and around the hub. If you don’t add one, we
          use your TikTok photo when we have it.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <MemberAvatar avatarUrl={preview} initial={initial} size={72} textSize="text-2xl" />
        <div className="flex flex-wrap items-center gap-2">
          <label className="cursor-pointer rounded-lg border border-cyan/40 px-3 py-2 font-body text-xs font-semibold text-cyan transition hover:bg-cyan/10">
            {busy ? "Saving…" : custom ? "Replace photo" : "Upload photo"}
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
          {custom ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void removePhoto()}
              className="font-body text-xs text-off-white/40 transition hover:text-orange disabled:opacity-40"
            >
              Remove
            </button>
          ) : null}
        </div>
      </div>

      <p className="font-body text-xs text-off-white/35">
        Recommended 512×512px square · JPG, PNG, WEBP, or GIF, max {MAX_MB}MB.
      </p>

      <div className="flex flex-wrap gap-2">
        <input
          value={urlDraft}
          onChange={(e) => setUrlDraft(e.target.value)}
          placeholder="Or paste an https image URL"
          disabled={busy}
          className="min-w-[12rem] flex-1 rounded-lg border border-off-white/15 bg-charcoal px-3 py-2 font-body text-sm text-off-white outline-none focus:border-orange disabled:opacity-40"
        />
        <button
          type="button"
          disabled={busy || !urlDraft.trim()}
          onClick={() => void saveUrl()}
          className="rounded-lg border border-cyan/40 px-3 py-2 font-body text-xs font-semibold text-cyan transition hover:bg-cyan/10 disabled:opacity-40"
        >
          Save URL
        </button>
      </div>

      {error && <p className="font-body text-xs text-orange">{error}</p>}
      {saved && !error && (
        <p className="font-body text-xs text-cyan">Saved. Your photo is on your profile.</p>
      )}
    </div>
  );
}
