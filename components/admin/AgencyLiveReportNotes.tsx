"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  addLiveReportNoteAction,
  type LiveReportFormState,
} from "@/app/admin/live-reports/actions";

type Note = {
  id: string;
  body: string;
  createdAt: Date | string;
  author: { name: string | null; email: string };
};

function SubmitNote() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="self-start rounded-lg bg-orange px-4 py-2 font-body text-sm font-semibold text-off-white shadow-glow transition hover:brightness-110 disabled:opacity-50"
    >
      {pending ? "Saving…" : "Add note"}
    </button>
  );
}

function when(value: Date | string) {
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

export default function AgencyLiveReportNotes({
  reportId,
  userId,
  notes,
}: {
  reportId: string | null;
  userId: string;
  notes: Note[];
}) {
  const [state, formAction] = useFormState<LiveReportFormState, FormData>(
    addLiveReportNoteAction,
    null
  );

  return (
    <section className="glass rounded-2xl p-6">
      <h2 className="font-display text-xl tracking-wide text-off-white/80">Admin notes</h2>
      <p className="mt-1 font-body text-xs text-off-white/45">
        Shared with every admin and mod. Notes stay when you re-run the month.
      </p>

      <div className="mt-4 flex flex-col gap-3">
        {notes.length === 0 && (
          <p className="font-body text-sm text-off-white/40">No notes on this month yet.</p>
        )}
        {notes.map((note) => (
          <article key={note.id} className="rounded-lg border border-off-white/10 px-3 py-2">
            <p className="font-body text-xs text-off-white/40">
              {note.author.name || note.author.email} · {when(note.createdAt)}
            </p>
            <p className="mt-1 whitespace-pre-wrap font-body text-sm text-off-white/85">{note.body}</p>
          </article>
        ))}
      </div>

      {reportId ? (
        <form key={notes.length} action={formAction} className="mt-4 flex flex-col gap-3">
          <input type="hidden" name="reportId" value={reportId} />
          <input type="hidden" name="userId" value={userId} />
          <textarea
            name="body"
            required
            minLength={2}
            maxLength={4000}
            rows={3}
            placeholder="What happened this month — coaching notes, battles, gifts to watch…"
            className="w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white outline-none focus:border-cyan/60"
          />
          {state?.error && (
            <p className="rounded-lg border border-orange/30 bg-orange/10 px-3 py-2 font-body text-sm text-orange">
              {state.error}
            </p>
          )}
          {state?.ok && (
            <p className="rounded-lg border border-cyan/30 bg-cyan/10 px-3 py-2 font-body text-sm text-cyan">
              {state.ok}
            </p>
          )}
          <SubmitNote />
        </form>
      ) : (
        <p className="mt-4 font-body text-sm text-off-white/50">
          Run the report for this month before leaving a note.
        </p>
      )}
    </section>
  );
}
