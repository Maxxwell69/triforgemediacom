"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ALLOWED_SHOP_FILE_MIME_TYPES, MAX_SHOP_FILE_BYTES } from "@/lib/uploadConstraints";

const MAX_MB = MAX_SHOP_FILE_BYTES / (1024 * 1024);

export default function ShopFileUpload({ productId }: { productId: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    if (file.size > MAX_SHOP_FILE_BYTES) {
      setError(`File is too large. Max ${MAX_MB}MB.`);
      return;
    }
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("productId", productId);
      const res = await fetch("/api/upload/shop-file", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="cursor-pointer self-start rounded-lg border border-cyan/40 px-3 py-2 font-body text-xs font-semibold text-cyan transition hover:bg-cyan/10">
        {isUploading ? "Uploading…" : "Upload download file"}
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_SHOP_FILE_MIME_TYPES.join(",")}
          onChange={handleChange}
          disabled={isUploading}
          className="hidden"
        />
      </label>
      <p className="font-body text-xs text-off-white/35">
        PDF, ZIP, EPUB, MP3, MP4, or image · max {MAX_MB}MB. Stored privately — buyers get a signed
        link after payment.
      </p>
      {error ? <p className="font-body text-xs text-orange">{error}</p> : null}
    </div>
  );
}
