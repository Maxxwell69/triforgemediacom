"use client";

import { useMemo, useState, useTransition } from "react";
import { joinHubCampaignSlot } from "@/app/(community)/campaigns/actions";

export type InterviewSlotOption = {
  id: string;
  startsAt: string;
  endsAt: string;
};

function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default function InterviewSlotPicker({
  campaignId,
  slots,
  currentSlotId,
}: {
  campaignId: string;
  slots: InterviewSlotOption[];
  currentSlotId?: string | null;
}) {
  const [selectedId, setSelectedId] = useState(currentSlotId ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const days = useMemo(() => {
    const map = new Map<string, InterviewSlotOption[]>();
    for (const slot of slots) {
      const key = formatDay(slot.startsAt);
      const list = map.get(key) ?? [];
      list.push(slot);
      map.set(key, list);
    }
    return Array.from(map.entries());
  }, [slots]);

  const [dayKey, setDayKey] = useState(days[0]?.[0] ?? "");
  const daySlots = days.find(([key]) => key === dayKey)?.[1] ?? [];

  if (slots.length === 0) {
    return (
      <p className="font-body text-sm text-off-white/50">
        No interview times are posted yet. Sign up above to join the list — you can pick a time
        later.
      </p>
    );
  }

  return (
    <form
      className="flex flex-col gap-3"
      action={() => {
        if (!selectedId) {
          setError("Pick a time");
          return;
        }
        setError(null);
        startTransition(async () => {
          try {
            await joinHubCampaignSlot(campaignId, selectedId);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Could not book that time");
          }
        });
      }}
    >
      <p className="font-body text-sm text-off-white/60">
        {currentSlotId ? "Change your interview time" : "Pick an available time"}
      </p>
      {days.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {days.map(([key, list]) => (
            <button
              key={key}
              type="button"
              onClick={() => setDayKey(key)}
              className={`rounded-lg border px-3 py-1.5 font-body text-xs font-semibold transition ${
                dayKey === key
                  ? "border-orange bg-orange/15 text-orange"
                  : "border-off-white/15 text-off-white/60 hover:border-off-white/30"
              }`}
            >
              {key}
              <span className="ml-1 text-off-white/40">({list.length})</span>
            </button>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {daySlots.map((slot) => {
          const active = selectedId === slot.id;
          return (
            <button
              key={slot.id}
              type="button"
              onClick={() => setSelectedId(slot.id)}
              className={`rounded-lg border px-3 py-2 font-body text-sm transition ${
                active
                  ? "border-orange bg-orange text-charcoal"
                  : "border-off-white/15 text-off-white/80 hover:border-cyan/40 hover:text-cyan"
              }`}
            >
              {formatTime(slot.startsAt)}–{formatTime(slot.endsAt)}
            </button>
          );
        })}
      </div>
      {error && <p className="font-body text-sm text-orange">{error}</p>}
      <button
        type="submit"
        disabled={isPending || !selectedId}
        className="self-start rounded-lg bg-orange px-5 py-2 font-body text-sm font-semibold text-off-white shadow-glow disabled:opacity-40"
      >
        {isPending ? "Booking…" : currentSlotId ? "Update time" : "Sign up for this time"}
      </button>
    </form>
  );
}
