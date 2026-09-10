"use client";

import { useRef, useState } from "react";
import {
  ALLOWED_VIDEO_MIME_TYPES,
  MAX_SOCIAL_PLANNER_VIDEO_BYTES,
} from "@/lib/uploadConstraints";

const MAX_MB = MAX_SOCIAL_PLANNER_VIDEO_BYTES / (1024 * 1024);

export default function PlannerVideoUpload({
  defaultKey,
  defaultUrl,
  defaultMime,
  defaultBytes,
}: {
  defaultKey?: string | null;
  defaultUrl?: string | null;
  defaultMime?: string | null;
  defaultBytes?: number | null;
}) {
  const [key, setKey] = useState(defaultKey ?? "");
  const [url, setUrl] = useState(defaultUrl ?? "");
  const [mime, setMime] = useState(defaultMime ?? "");
  const [bytes, setBytes] = useState(defaultBytes ? String(defaultBytes) : "");
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    setError(null);
    if (!ALLOWED_VIDEO_MIME_TYPES.includes(file.type as (typeof ALLOWED_VIDEO_MIME_TYPES)[number])) {
      setError("Unsupported file type. Use MP4, WebM, or MOV.");
      return;
    }
    if (file.size > MAX_SOCIAL_PLANNER_VIDEO_BYTES) {
      setError(`File is too large. Max for TikTok posts is ${MAX_MB}MB.`);
      return;
    }

    setProgress("Preparing upload…");
    try {
      const presignRes = await fetch("/api/upload/social-planner/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType: file.type, fileSize: file.size }),
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
        throw new Error("Upload to storage failed. Check R2 bucket CORS allows PUT from this site.");
      }

      setKey(presign.key);
      setUrl(presign.publicUrl);
      setMime(file.type);
      setBytes(String(file.size));
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
      <label className="font-body text-sm text-off-white/70">
        Video (MP4 / MOV / WebM, max {MAX_MB}MB)
        <input
          ref={fileRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
          disabled={Boolean(progress)}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void uploadFile(file);
          }}
          className="mt-1 block w-full font-body text-sm text-off-white/80 file:mr-3 file:rounded-lg file:border-0 file:bg-orange file:px-3 file:py-1.5 file:font-semibold file:text-charcoal"
        />
      </label>
      <input type="hidden" name="mediaR2Key" value={key} />
      <input type="hidden" name="mediaUrl" value={url} />
      <input type="hidden" name="mediaMime" value={mime} />
      <input type="hidden" name="mediaBytes" value={bytes} />
      {url && !progress && (
        <p className="truncate font-body text-xs text-cyan/80">Ready: {url.split("/").pop()}</p>
      )}
      {progress && <p className="font-body text-xs text-orange">{progress}</p>}
      {error && <p className="font-body text-xs text-red-300">{error}</p>}
    </div>
  );
}
