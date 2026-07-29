"use client";

import { useRef, useState, useTransition } from "react";
import {
  addWebinarRecordingAction,
  deleteWebinarRecordingAction,
} from "@/app/admin/webinars/actions";
import {
  ALLOWED_VIDEO_MIME_TYPES,
  MAX_VIDEO_UPLOAD_BYTES,
} from "@/lib/uploadConstraints";

type Recording = {
  id: string;
  title: string | null;
  url: string;
};

const MAX_MB = MAX_VIDEO_UPLOAD_BYTES / (1024 * 1024);

export default function AdminWebinarRecordings({
  webinarId,
  recordings,
  canAttach,
}: {
  webinarId: string;
  recordings: Recording[];
  canAttach: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  if (!canAttach && recordings.length === 0) return null;

  async function uploadFile(file: File) {
    setError(null);
    setProgress(null);

    if (!ALLOWED_VIDEO_MIME_TYPES.includes(file.type as (typeof ALLOWED_VIDEO_MIME_TYPES)[number])) {
      setError("Unsupported file type. Use MP4, WebM, or MOV.");
      return;
    }
    if (file.size > MAX_VIDEO_UPLOAD_BYTES) {
      setError(
        `File is too large (${(file.size / (1024 * 1024)).toFixed(0)}MB). Max is ${MAX_MB}MB.`
      );
      return;
    }

    setProgress("Preparing upload…");
    try {
      const presignRes = await fetch("/api/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webinarId,
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

      setProgress("Saving…");
      const title = file.name.replace(/\.[^.]+$/, "").slice(0, 120);
      const result = await addWebinarRecordingAction(webinarId, {
        title,
        url: presign.publicUrl,
      });
      if (result.error) throw new Error(result.error);
      setProgress(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setProgress(null);
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="mt-4 border-t border-off-white/10 pt-4">
      <p className="font-body text-xs uppercase tracking-wide text-off-white/40">
        Recordings ({recordings.length})
      </p>
      <p className="mt-1 font-body text-xs text-off-white/45">
        After the live session, screen-record and upload the file here (or paste a YouTube / Vimeo /
        MP4 link). Members can watch it on the webinar page.
      </p>

      {recordings.length > 0 && (
        <ul className="mt-3 space-y-2">
          {recordings.map((r) => (
            <li
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-off-white/5 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate font-body text-sm text-off-white/90">
                  {r.title || "Recording"}
                </p>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate font-body text-xs text-cyan/80 hover:underline"
                >
                  {r.url}
                </a>
              </div>
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await deleteWebinarRecordingAction(r.id);
                  })
                }
                className="shrink-0 rounded border border-off-white/15 px-2 py-1 font-body text-xs text-off-white/50 transition hover:border-orange/40 hover:text-orange disabled:opacity-50"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {canAttach && (
        <div className="mt-3 flex flex-col gap-3">
          <label className="flex flex-col gap-1 font-body text-sm text-off-white/70">
            Upload screen recording
            <input
              ref={fileRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
              disabled={Boolean(progress)}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadFile(file);
              }}
              className="font-body text-sm text-off-white/80 file:mr-3 file:rounded-lg file:border-0 file:bg-orange file:px-3 file:py-1.5 file:font-semibold file:text-charcoal"
            />
          </label>

          <form
            className="flex flex-col gap-2 sm:flex-row sm:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const formData = new FormData(form);
              setError(null);
              startTransition(async () => {
                const result = await addWebinarRecordingAction(webinarId, {
                  title: String(formData.get("title") || ""),
                  url: String(formData.get("url") || ""),
                });
                if (result.error) {
                  setError(result.error);
                  return;
                }
                form.reset();
              });
            }}
          >
            <label className="flex min-w-0 flex-1 flex-col gap-1 font-body text-sm text-off-white/70">
              Or paste a link
              <input
                name="url"
                type="url"
                required
                placeholder="https://… (YouTube, Vimeo, or MP4 URL)"
                className="rounded-lg border border-off-white/15 bg-charcoal px-3 py-2 text-off-white outline-none focus:border-orange"
              />
            </label>
            <label className="flex w-full flex-col gap-1 font-body text-sm text-off-white/70 sm:w-40">
              Title
              <input
                name="title"
                maxLength={120}
                placeholder="Optional"
                className="rounded-lg border border-off-white/15 bg-charcoal px-3 py-2 text-off-white outline-none focus:border-orange"
              />
            </label>
            <button
              type="submit"
              disabled={pending || Boolean(progress)}
              className="rounded-lg border border-cyan/40 bg-cyan/10 px-3 py-2 font-body text-sm font-semibold text-cyan transition hover:bg-cyan/15 disabled:opacity-50"
            >
              Add link
            </button>
          </form>

          {progress && <p className="font-body text-xs text-cyan">{progress}</p>}
          {error && <p className="font-body text-xs text-orange">{error}</p>}
        </div>
      )}
    </div>
  );
}
