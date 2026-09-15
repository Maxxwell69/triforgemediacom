"use client";

import { useEffect, useState, useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  addLiveRosterMember,
  searchLiveRosterCandidates,
  type LiveReportFormState,
} from "@/app/admin/live-reports/actions";

type Candidate = {
  userId: string;
  name: string;
  email: string;
  uniqueId: string | null;
  avatarUrl: string | null;
};

function AddButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-orange px-3 py-1.5 font-body text-xs font-semibold text-off-white shadow-glow transition hover:brightness-110 disabled:opacity-50"
    >
      {pending ? "Adding…" : "Add"}
    </button>
  );
}

export default function AgencyLiveRosterAdd() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Candidate[]>([]);
  const [searching, startSearch] = useTransition();
  const [state, formAction] = useFormState<LiveReportFormState, FormData>(
    addLiveRosterMember,
    null
  );

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const query = q.trim();
      if (query.length < 2) {
        setRows([]);
        return;
      }
      startSearch(async () => {
        const found = await searchLiveRosterCandidates(query);
        setRows(found);
      });
    }, 250);
    return () => window.clearTimeout(handle);
  }, [q]);

  useEffect(() => {
    if (state?.ok) {
      setQ("");
      setRows([]);
    }
  }, [state?.ok]);

  return (
    <div className="glass rounded-2xl p-6">
      <h2 className="font-display text-xl tracking-wide text-off-white/80">Add a creator</h2>
      <p className="mt-1 font-body text-xs text-off-white/45">
        Search hub members who already have a TikTok handle. Adding them also enrols the handle
        on the tik.tools agency list so LIVE history can start recording.
      </p>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Name, email, or @handle"
        className="mt-4 w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white outline-none focus:border-cyan/60"
      />
      {state?.error && (
        <p className="mt-3 rounded-lg border border-orange/30 bg-orange/10 px-3 py-2 font-body text-sm text-orange">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p className="mt-3 rounded-lg border border-cyan/30 bg-cyan/10 px-3 py-2 font-body text-sm text-cyan">
          {state.ok}
        </p>
      )}
      <div className="mt-4 flex flex-col gap-2">
        {searching && q.trim().length >= 2 && rows.length === 0 && (
          <p className="font-body text-sm text-off-white/40">Searching…</p>
        )}
        {!searching && q.trim().length >= 2 && rows.length === 0 && (
          <p className="font-body text-sm text-off-white/40">
            No matching members with a TikTok handle.
          </p>
        )}
        {rows.map((row) => (
          <form
            key={row.userId}
            action={formAction}
            className="flex items-center justify-between gap-3 rounded-lg border border-off-white/10 px-3 py-2"
          >
            <input type="hidden" name="userId" value={row.userId} />
            <div className="flex min-w-0 items-center gap-3">
              {row.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={row.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-off-white/10 font-body text-xs text-off-white/50">
                  {row.name.replace(/^@/, "").charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate font-body text-sm text-off-white">{row.name}</p>
                <p className="truncate font-body text-xs text-off-white/40">
                  {row.uniqueId ? `@${row.uniqueId}` : row.email}
                </p>
              </div>
            </div>
            <AddButton />
          </form>
        ))}
      </div>
    </div>
  );
}
