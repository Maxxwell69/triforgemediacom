"use client";

import { useRef, useState } from "react";
import { ALLOWED_IMAGE_MIME_TYPES, MAX_UPLOAD_BYTES } from "@/lib/uploadConstraints";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60";

const MAX_MB = MAX_UPLOAD_BYTES / (1024 * 1024);

type UploadFolder =
  | "course-thumbnails"
  | "lesson-thumbnails"
  | "reward-images"
  | "host-avatars"
  | "group-images";

const RECOMMENDATIONS: Record<UploadFolder, { dimensions: string; hint: string }> = {
  "course-thumbnails": {
    dimensions: "1280\u00D7720px (16:9)",
    hint: "Shows as a wide banner and card thumbnail \u2014 landscape images crop best.",
  },
  "lesson-thumbnails": {
    dimensions: "1280\u00D7720px (16:9)",
    hint: "Shows on the course outline and at the top of the lesson page.",
  },
  "reward-images": {
    dimensions: "800\u00D7450px (16:9)",
    hint: "Shows as a card image \u2014 landscape images crop best.",
  },
  "host-avatars": {
    dimensions: "512\u00D7512px (1:1)",
    hint: "Shows as the host photo on webinar cards and detail pages \u2014 square crops best.",
  },
  "group-images": {
    dimensions: "512\u00D7512px (1:1)",
    hint: "Shows as the group icon in lists and the space switcher \u2014 square crops best.",
  },
};

export default function ImageUploadField({
  name,
  folder,
  defaultValue,
  label,
}: {
  name: string;
  folder: UploadFolder;
  defaultValue?: string | null;
  label?: string;
}) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recommendation = RECOMMENDATIONS[folder];

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_MIME_TYPES)[number])) {
      setError("Unsupported file type. Use JPG, PNG, WEBP, or GIF.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setError(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Max size is ${MAX_MB}MB.`);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");

      setUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <span className="font-body text-xs font-semibold uppercase tracking-wide text-off-white/40">
          {label}
        </span>
      )}
      <input type="hidden" name={name} value={url} />

      <div className="flex flex-wrap items-center gap-3">
        {url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt="Preview"
            className={
              folder === "host-avatars"
                ? "h-16 w-16 rounded-full border border-off-white/15 object-cover"
                : "h-16 w-28 rounded-lg border border-off-white/15 object-cover"
            }
          />
        )}
        <label
          title={`Recommended: ${recommendation.dimensions}. JPG, PNG, WEBP, or GIF, up to ${MAX_MB}MB.`}
          className="cursor-pointer rounded-lg border border-cyan/40 px-3 py-2 font-body text-xs font-semibold text-cyan transition hover:bg-cyan/10"
        >
          {isUploading ? "Uploading..." : url ? "Replace image" : "Upload image"}
          <input
            ref={inputRef}
            type="file"
            accept={ALLOWED_IMAGE_MIME_TYPES.join(",")}
            onChange={handleFileChange}
            disabled={isUploading}
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

      <p className="font-body text-xs text-off-white/35">
        Recommended {recommendation.dimensions} &middot; {recommendation.hint} &middot; JPG/PNG/WEBP/GIF, max{" "}
        {MAX_MB}MB.
      </p>

      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Or paste an image URL"
        className={fieldClass}
      />
      {error && <p className="font-body text-xs text-orange">{error}</p>}
    </div>
  );
}
