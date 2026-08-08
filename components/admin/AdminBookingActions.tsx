"use client";

import { useTransition } from "react";
import { setBookingStatus } from "@/app/admin/calendar/actions";

export default function AdminBookingActions({ bookingId }: { bookingId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await setBookingStatus(bookingId, "CONFIRMED");
          })
        }
        className="rounded-lg bg-cyan/90 px-3 py-1 font-body text-xs font-semibold text-charcoal disabled:opacity-40"
      >
        Confirm
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await setBookingStatus(bookingId, "DECLINED");
          })
        }
        className="rounded-lg border border-orange/40 px-3 py-1 font-body text-xs font-semibold text-orange disabled:opacity-40"
      >
        Decline
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await setBookingStatus(bookingId, "CANCELLED");
          })
        }
        className="rounded-lg border border-off-white/20 px-3 py-1 font-body text-xs text-off-white/60 disabled:opacity-40"
      >
        Cancel
      </button>
    </div>
  );
}
