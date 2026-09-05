"use client";

import type { SuggestionStatus } from "@prisma/client";
import {
  SUGGESTION_STATUSES,
  SUGGESTION_STATUS_LABELS,
  SUGGESTION_STATUS_STYLES,
  formatSuggestionTicket,
} from "@/lib/suggestions";
import { updateSuggestionAction } from "@/app/admin/suggestions/actions";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white outline-none transition focus:border-cyan/60";

export default function SuggestionAdminRow({
  suggestion,
}: {
  suggestion: {
    id: string;
    ticketNumber: number;
    title: string;
    description: string;
    status: SuggestionStatus;
    adminNotes: string | null;
    authorName: string;
    authorEmail: string | null;
  };
}) {
  return (
    <div className="glass flex flex-col gap-4 rounded-2xl p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-cyan/40 bg-cyan/10 px-2.5 py-0.5 font-body text-[11px] font-bold tracking-wide text-cyan">
          {formatSuggestionTicket(suggestion.ticketNumber)}
        </span>
        <span
          className={`rounded-full border px-2.5 py-0.5 font-body text-[11px] font-semibold uppercase tracking-wide ${SUGGESTION_STATUS_STYLES[suggestion.status]}`}
        >
          {SUGGESTION_STATUS_LABELS[suggestion.status]}
        </span>
      </div>
      <h2 className="font-display text-xl tracking-wide">{suggestion.title}</h2>
      <p className="whitespace-pre-wrap font-body text-sm text-off-white/70">{suggestion.description}</p>
      <p className="font-body text-xs text-off-white/45">
        {suggestion.authorName}
        {suggestion.authorEmail ? ` · ${suggestion.authorEmail}` : ""}
      </p>

      <form action={updateSuggestionAction} className="flex flex-col gap-3">
        <input type="hidden" name="id" value={suggestion.id} />
        <label className="flex flex-col gap-1 font-body text-xs text-off-white/50">
          Tag
          <select name="status" defaultValue={suggestion.status} className={fieldClass}>
            {SUGGESTION_STATUSES.map((status) => (
              <option key={status} value={status}>
                {SUGGESTION_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </label>
        <textarea
          name="adminNotes"
          rows={2}
          defaultValue={suggestion.adminNotes ?? ""}
          placeholder="Optional note members can see (why accepted, what’s shipping, why rejected)"
          className={fieldClass}
        />
        <button
          type="submit"
          className="self-start rounded-lg bg-orange px-5 py-2 font-body text-sm font-semibold text-off-white shadow-glow transition hover:brightness-110"
        >
          Save tag
        </button>
      </form>
    </div>
  );
}
