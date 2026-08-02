"use client";

import { useState, useTransition } from "react";
import { updateWebinarHostAvatarAction } from "@/app/admin/webinars/actions";
import ImageUploadField from "@/components/ImageUploadField";

export default function AdminWebinarHostAvatar({
  webinarId,
  hostAvatarUrl,
}: {
  webinarId: string;
  hostAvatarUrl: string | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="mt-4 border-t border-off-white/10 pt-4"
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        setError(null);
        setSaved(false);
        startTransition(async () => {
          const result = await updateWebinarHostAvatarAction(webinarId, formData);
          if (result.error) {
            setError(result.error);
            return;
          }
          setSaved(true);
        });
      }}
    >
      <ImageUploadField
        name="hostAvatarUrl"
        folder="host-avatars"
        label="Host avatar"
        defaultValue={hostAvatarUrl}
      />
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg border border-cyan/40 px-3 py-1.5 font-body text-xs font-semibold text-cyan transition hover:bg-cyan/10 disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save host avatar"}
        </button>
        {saved && <span className="font-body text-xs text-cyan">Saved</span>}
        {error && <span className="font-body text-xs text-orange">{error}</span>}
      </div>
    </form>
  );
}
