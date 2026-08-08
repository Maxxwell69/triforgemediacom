"use client";

import { useTransition } from "react";
import { respondToBooking } from "@/app/(community)/calendar/actions";

export default function BookingRespondButtons({
  bookingId,
  mode,
}: {
  bookingId: string;
  mode: "host" | "booker";
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap gap-2">
      {mode === "host" && (
        <>
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await respondToBooking(bookingId, "CONFIRMED");
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
                await respondToBooking(bookingId, "DECLINED");
              })
            }
            className="rounded-lg border border-orange/40 px-3 py-1 font-body text-xs font-semibold text-orange disabled:opacity-40"
          >
            Decline
          </button>
        </>
      )}
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await respondToBooking(bookingId, "CANCELLED");
          })
        }
        className="rounded-lg border border-off-white/20 px-3 py-1 font-body text-xs text-off-white/60 disabled:opacity-40"
      >
        Cancel
      </button>
    </div>
  );
}
