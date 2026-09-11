"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import ImageUploadField from "@/components/ImageUploadField";
import { updateCalendarEventImage } from "@/app/(community)/calendar/actions";

export default function CalendarEventPhotoForm({
  eventId,
  imageUrl,
}: {
  eventId: string;
  imageUrl: string | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="mt-6 border-t border-off-white/10 pt-5"
      action={(formData) => {
        startTransition(async () => {
          const result = await updateCalendarEventImage(formData);
          setError(result.error);
          if (!result.error) router.refresh();
        });
      }}
    >
      <input type="hidden" name="id" value={eventId} />
      <ImageUploadField
        name="imageUrl"
        folder="calendar-event-images"
        defaultValue={imageUrl}
        label="Event photo"
      />
      {error && <p className="mt-2 font-body text-sm text-orange">{error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="mt-3 rounded-lg border border-cyan/40 px-3 py-1.5 font-body text-xs font-semibold text-cyan disabled:opacity-40"
      >
        {isPending ? "Saving…" : "Save photo"}
      </button>
    </form>
  );
}
