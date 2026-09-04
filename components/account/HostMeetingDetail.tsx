"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { OpenSlot } from "@/lib/bookingClient";
import {
  cancelHostAppointment,
  rescheduleHostAppointment,
  sendHostAppointmentReminder,
} from "@/app/(community)/account/bookingMeetingActions";

const fieldNote = "font-body text-sm text-off-white/70";

export type HostMeetingView = {
  id: string;
  title: string;
  bookerName: string;
  bookerEmail: string;
  notes: string | null;
  startsAt: string;
  endsAt: string;
  timezone: string;
  durationMins: number;
  hostRoomUrl: string;
  canRemind: boolean;
  canReschedule: boolean;
  canCancel: boolean;
};

export default function HostMeetingDetail({
  meeting,
  slots,
}: {
  meeting: HostMeetingView;
  slots: OpenSlot[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [rescheduling, setRescheduling] = useState(false);
  const [dayKey, setDayKey] = useState<string | null>(null);
  const [selected, setSelected] = useState<OpenSlot | null>(null);
  const [pending, startTransition] = useTransition();

  const whenLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        timeZone: meeting.timezone,
        dateStyle: "full",
        timeStyle: "short",
      }).format(new Date(meeting.startsAt)),
    [meeting.startsAt, meeting.timezone]
  );

  const days = useMemo(() => {
    const map = new Map<string, { label: string; slots: OpenSlot[] }>();
    for (const slot of slots) {
      if (slot.startsAt === meeting.startsAt) continue;
      const d = new Date(slot.startsAt);
      const key = d.toLocaleDateString("en-CA", { timeZone: meeting.timezone });
      const label = d.toLocaleDateString([], {
        timeZone: meeting.timezone,
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      const entry = map.get(key) ?? { label, slots: [] };
      entry.slots.push(slot);
      map.set(key, entry);
    }
    return Array.from(map.entries()).map(([key, value]) => ({ key, ...value }));
  }, [meeting.startsAt, meeting.timezone, slots]);

  const daySlots = days.find((d) => d.key === dayKey)?.slots ?? [];

  function run(fn: () => Promise<{ error: string | null }>, ok?: string, then?: () => void) {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const result = await fn();
      if (result.error) setError(result.error);
      else {
        if (ok) setNotice(ok);
        then?.();
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="glass rounded-2xl p-6">
        <p className="font-body text-xs uppercase tracking-wide text-off-white/45">With</p>
        <h2 className="mt-1 font-display text-2xl tracking-wide text-off-white">
          {meeting.bookerName}
        </h2>
        <p className={`${fieldNote} mt-1`}>{meeting.bookerEmail}</p>
        <p className="mt-4 font-body text-sm text-off-white">
          <span className="text-off-white/50">{meeting.title}</span>
          <br />
          {whenLabel}
          <span className="block text-xs text-off-white/40">
            {meeting.durationMins} minutes · {meeting.timezone}
          </span>
        </p>
        {meeting.notes ? (
          <p className="mt-3 font-body text-sm text-off-white/55">Notes: {meeting.notes}</p>
        ) : null}
        <a
          href={meeting.hostRoomUrl}
          className="mt-5 inline-block rounded-lg bg-cyan/90 px-4 py-2 font-body text-sm font-semibold text-charcoal"
        >
          Open meeting room
        </a>
      </div>

      <div className="glass flex flex-col gap-3 rounded-2xl p-6">
        <h3 className="font-display text-lg tracking-wide text-off-white/80">Host actions</h3>
        <div className="flex flex-wrap gap-2">
          {meeting.canRemind ? (
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                run(() => sendHostAppointmentReminder(meeting.id), "Reminder sent to guest and you.")
              }
              className="rounded-lg border border-off-white/20 px-4 py-2 font-body text-sm text-off-white/80 hover:border-cyan/40 hover:text-cyan disabled:opacity-40"
            >
              {pending ? "Working…" : "Send reminder"}
            </button>
          ) : null}
          {meeting.canReschedule ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setRescheduling((open) => !open);
                setError(null);
                setNotice(null);
              }}
              className="rounded-lg border border-off-white/20 px-4 py-2 font-body text-sm text-off-white/80 hover:border-cyan/40 hover:text-cyan disabled:opacity-40"
            >
              {rescheduling ? "Hide times" : "Reschedule"}
            </button>
          ) : null}
          {meeting.canCancel ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                if (!confirm("Cancel this meeting for both people?")) return;
                run(
                  () => cancelHostAppointment(meeting.id),
                  undefined,
                  () => router.push("/account/booking/meetings")
                );
              }}
              className="rounded-lg border border-orange/30 px-4 py-2 font-body text-sm text-orange/90 hover:border-orange/60 disabled:opacity-40"
            >
              Cancel meeting
            </button>
          ) : null}
        </div>
        {notice ? <p className="font-body text-sm text-cyan">{notice}</p> : null}
        {error ? <p className="font-body text-sm text-orange">{error}</p> : null}

        {rescheduling && meeting.canReschedule ? (
          <div className="mt-2 border-t border-off-white/10 pt-4">
            <p className="mb-3 font-body text-xs text-off-white/45">
              Pick a new open time. Guest and you both get an email with the updated time.
            </p>
            {days.length === 0 ? (
              <p className="font-body text-sm text-off-white/50">No other open times right now.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-[11rem_1fr]">
                <div className="flex flex-row gap-2 overflow-x-auto md:flex-col">
                  {days.map((day) => (
                    <button
                      key={day.key}
                      type="button"
                      onClick={() => {
                        setDayKey(day.key);
                        setSelected(null);
                      }}
                      className={[
                        "shrink-0 rounded-xl border px-3 py-2 text-left font-body text-sm transition",
                        dayKey === day.key
                          ? "border-orange/50 bg-orange/15 text-orange"
                          : "border-off-white/10 text-off-white/70 hover:border-off-white/25",
                      ].join(" ")}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
                <div className="rounded-xl border border-off-white/10 p-3">
                  {!dayKey && (
                    <p className="font-body text-sm text-off-white/45">Select a day to see times.</p>
                  )}
                  {dayKey && (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {daySlots.map((slot) => (
                        <button
                          key={slot.startsAt}
                          type="button"
                          onClick={() => setSelected(slot)}
                          className={[
                            "rounded-lg border px-3 py-2 font-body text-sm transition",
                            selected?.startsAt === slot.startsAt
                              ? "border-cyan/50 bg-cyan/15 text-cyan"
                              : "border-off-white/15 text-off-white/80 hover:border-cyan/30",
                          ].join(" ")}
                        >
                          {slot.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            {selected ? (
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  if (
                    !confirm(
                      `Move this meeting to ${selected.label} (${meeting.timezone})? Both people will be emailed.`
                    )
                  ) {
                    return;
                  }
                  run(
                    () => rescheduleHostAppointment(meeting.id, selected.startsAt),
                    "Meeting moved. Confirmation emails are on the way.",
                    () => {
                      setRescheduling(false);
                      setSelected(null);
                      setDayKey(null);
                    }
                  );
                }}
                className="mt-4 rounded-lg bg-orange px-5 py-2 font-body text-sm font-semibold text-off-white shadow-glow disabled:opacity-40"
              >
                {pending ? "Saving…" : "Confirm new time"}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
