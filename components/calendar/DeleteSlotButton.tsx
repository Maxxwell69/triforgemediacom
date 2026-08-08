"use client";

import { useTransition } from "react";
import { deleteAvailabilitySlot } from "@/app/(community)/calendar/actions";

export default function DeleteSlotButton({ slotId }: { slotId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await deleteAvailabilitySlot(slotId);
        })
      }
      className="font-body text-xs text-orange/80 hover:text-orange disabled:opacity-40"
    >
      Remove
    </button>
  );
}
