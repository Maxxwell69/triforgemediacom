"use client";

import { useRef, useState } from "react";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60";

export default function ImageUploadField({
  name,
  folder,
  defaultValue,
  label,
}: {
  name: string;
  folder: "course-thumbnails" | "reward-images";
  defaultValue?: string | null;
  label?: string;
}) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
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
            className="h-16 w-28 rounded-lg border border-off-white/15 object-cover"
          />
        )}
        <label className="cursor-pointer rounded-lg border border-cyan/40 px-3 py-2 font-body text-xs font-semibold text-cyan transition hover:bg-cyan/10">
          {isUploading ? "Uploading..." : url ? "Replace image" : "Upload image"}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
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
