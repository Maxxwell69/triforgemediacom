"use client";

import { useMemo, useState } from "react";
import {
  calendarFeaturedProfileLabel,
  calendarKindLabel,
  calendarKindNeedsFeatured,
  calendarKindNeedsOpponent,
  calendarOpponentProfileLabel,
  creatableCalendarEventKinds,
  type CalendarMemberOption,
} from "@/lib/calendarEventTypes";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white outline-none transition focus:border-cyan/60";

function CalendarMemberField({
  name,
  label,
  members,
}: {
  name: string;
  label: string;
  members: CalendarMemberOption[];
}) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const selected = members.find((m) => m.id === selectedId) ?? null;
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? members.filter((m) => m.label.toLowerCase().includes(q))
      : members;
    return list.slice(0, 8);
  }, [members, query]);

  return (
    <div>
      <p className="mb-1 font-body text-xs text-off-white/50">{label}</p>
      <input type="hidden" name={name} value={selectedId} required />
      {selected ? (
        <button
          type="button"
          onClick={() => {
            setSelectedId("");
            setQuery("");
          }}
          className="flex w-full items-center justify-between rounded-lg border border-cyan/40 bg-cyan/10 px-3 py-2 text-left font-body text-sm text-cyan"
        >
          <span className="truncate">{selected.label}</span>
          <span className="ml-2 shrink-0 text-off-white/50">Change</span>
        </button>
      ) : (
        <>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search members…"
            className={fieldClass}
          />
          <ul className="mt-1 max-h-40 overflow-y-auto rounded-lg border border-off-white/10">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 font-body text-xs text-off-white/40">No matches</li>
            ) : (
              filtered.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(m.id)}
                    className="w-full truncate px-3 py-1.5 text-left font-body text-sm text-off-white/80 hover:bg-off-white/5 hover:text-cyan"
                  >
                    {m.label}
                  </button>
                </li>
              ))
            )}
          </ul>
        </>
      )}
    </div>
  );
}

export default function CalendarEventKindFields({
  members,
  defaultKind = "MEETING",
}: {
  members: CalendarMemberOption[];
  defaultKind?: string;
}) {
  const [kind, setKind] = useState(defaultKind);

  return (
    <div className="flex flex-col gap-3">
      <select
        name="kind"
        value={kind}
        onChange={(e) => setKind(e.target.value)}
        className={fieldClass}
      >
        {creatableCalendarEventKinds.map((value) => (
          <option key={value} value={value}>
            {calendarKindLabel(value)}
          </option>
        ))}
      </select>
      {calendarKindNeedsFeatured(kind) && (
        <CalendarMemberField
          name="featuredUserId"
          label={calendarFeaturedProfileLabel(kind)}
          members={members}
        />
      )}
      {calendarKindNeedsOpponent(kind) && (
        <CalendarMemberField
          name="opponentUserId"
          label={calendarOpponentProfileLabel(kind)}
          members={members}
        />
      )}
    </div>
  );
}
