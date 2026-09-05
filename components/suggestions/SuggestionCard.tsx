import Link from "next/link";
import type { SuggestionStatus } from "@prisma/client";
import {
  SUGGESTION_STATUS_LABELS,
  SUGGESTION_STATUS_STYLES,
  formatSuggestionTicket,
} from "@/lib/suggestions";

export default function SuggestionCard({
  suggestion,
}: {
  suggestion: {
    ticketNumber: number;
    title: string;
    description: string;
    status: SuggestionStatus;
    adminNotes: string | null;
    createdAt: Date;
    authorName: string;
    authorId: string;
  };
}) {
  return (
    <article className="glass rounded-2xl p-5">
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
      <h3 className="mt-2 font-display text-xl tracking-wide">{suggestion.title}</h3>
      <p className="mt-3 whitespace-pre-wrap font-body text-sm leading-relaxed text-off-white/70">
        {suggestion.description}
      </p>
      {suggestion.adminNotes && (
        <p className="mt-3 rounded-lg border border-off-white/10 bg-off-white/[0.03] px-3 py-2 font-body text-xs text-off-white/50">
          <span className="font-semibold text-off-white/60">Staff note: </span>
          {suggestion.adminNotes}
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-off-white/10 pt-3 font-body text-xs text-off-white/45">
        <p>
          From{" "}
          <Link href={`/members/${suggestion.authorId}`} className="font-semibold text-cyan hover:text-cyan/80">
            {suggestion.authorName}
          </Link>
        </p>
        <p>
          {suggestion.createdAt.toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
        </p>
      </div>
    </article>
  );
}
