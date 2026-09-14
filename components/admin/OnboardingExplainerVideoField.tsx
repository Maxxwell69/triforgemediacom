"use client";

import { useRef, useState } from "react";
import VideoEmbed from "@/components/VideoEmbed";
import {
  ALLOWED_VIDEO_MIME_TYPES,
  MAX_ONBOARDING_VIDEO_BYTES,
} from "@/lib/uploadConstraints";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white placeholder:text-off-white/30 outline-none focus:border-cyan/60";

const MAX_MB = Math.round(MAX_ONBOARDING_VIDEO_BYTES / (1024 * 1024));

export default function OnboardingExplainerVideoField({
  programId,
  defaultValue,
}: {
  programId: string;
  defaultValue?: string | null;
}) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    setError(null);
    if (!ALLOWED_VIDEO_MIME_TYPES.includes(file.type as (typeof ALLOWED_VIDEO_MIME_TYPES)[number])) {
      setError("Unsupported file type. Use MP4, WebM, or MOV.");
      return;
    }
    if (file.size > MAX_ONBOARDING_VIDEO_BYTES) {
      setError(
        `File is too large (${(file.size / (1024 * 1024)).toFixed(0)}MB). Max is ${MAX_MB}MB.`
      );
      return;
    }

    setProgress("Preparing upload…");
    try {
      const presignRes = await fetch("/api/upload/onboarding/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programId,
          contentType: file.type,
          fileSize: file.size,
        }),
      });
      const presign = await presignRes.json();
      if (!presignRes.ok) throw new Error(presign.error || "Could not start upload");

      setProgress("Uploading to storage…");
      const putRes = await fetch(presign.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!putRes.ok) {
        throw new Error(
          "Upload to storage failed. Check R2 bucket CORS allows PUT from this site."
        );
      }

      setUrl(presign.publicUrl);
      setProgress(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setProgress(null);
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="font-body text-sm text-off-white/70">Explainer video</span>
      <p className="font-body text-xs text-off-white/40">
        Shows under the checklist title for assigned members. Upload an MP4 (max {MAX_MB}MB) or
        paste a YouTube / Vimeo link, then click Save settings.
      </p>
      <input type="hidden" name="explainerVideoUrl" value={url} />
      <div className="flex flex-wrap items-center gap-3">
        <label className="cursor-pointer rounded-lg border border-cyan/40 px-3 py-2 font-body text-xs font-semibold text-cyan transition hover:bg-cyan/10">
          {progress ? progress : url ? "Replace video" : "Upload video"}
          <input
            ref={fileRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
            disabled={Boolean(progress)}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void uploadFile(file);
            }}
            className="hidden"
          />
        </label>
        {url && (
          <button
            type="button"
            onClick={() => setUrl("")}
            className="font-body text-xs text-off-white/40 transition hover:text-orange"
          >
            Remove
          </button>
        )}
      </div>
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://www.youtube.com/watch?v=…"
        className={fieldClass}
      />
      {url ? (
        <div className="max-w-xl">
          <VideoEmbed url={url} />
        </div>
      ) : null}
      {error && <p className="font-body text-xs text-orange">{error}</p>}
    </div>
  );
}
