"use client";

import { useState, useTransition } from "react";
import {
  fetchGhlContactsByTag,
  importGhlContacts,
  type GhlPreviewContact,
} from "@/app/admin/import/actions";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60";

export default function GhlImportPanel({ ghlConfigured }: { ghlConfigured: boolean }) {
  const [tag, setTag] = useState("");
  const [contacts, setContacts] = useState<GhlPreviewContact[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searching, startSearching] = useTransition();

  const [importing, startImporting] = useTransition();
  const [importResult, setImportResult] = useState<
    { imported: number; skipped: number; errors: string[] } | null
  >(null);

  function handleSearch() {
    setSearchError(null);
    setImportResult(null);
    startSearching(async () => {
      const result = await fetchGhlContactsByTag(tag);
      if (result.error) {
        setSearchError(result.error);
        setContacts(null);
        return;
      }
      setContacts(result.contacts);
      setSelected(
        new Set(
          result.contacts
            .filter((c) => !c.alreadyImported && !c.existingUser)
            .map((c) => c.ghlContactId)
        )
      );
    });
  }

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleImport() {
    if (!contacts) return;
    const toImport = contacts.filter((c) => selected.has(c.ghlContactId));
    if (toImport.length === 0) return;
    if (
      !confirm(
        `Import ${toImport.length} contact${toImport.length === 1 ? "" : "s"} and send each a Hub migration invite email?`
      )
    ) {
      return;
    }

    startImporting(async () => {
      const result = await importGhlContacts(
        toImport.map(({ ghlContactId, name, email, phone, tags }) => ({
          ghlContactId,
          name,
          email,
          phone,
          tags,
        }))
      );
      setImportResult(result);
      // Re-mark whatever succeeded as already-imported so the list stays accurate.
      setContacts((prev) =>
        prev
          ? prev.map((c) =>
              selected.has(c.ghlContactId) ? { ...c, alreadyImported: true } : c
            )
          : prev
      );
      setSelected(new Set());
    });
  }

  const selectableCount = contacts?.filter((c) => !c.alreadyImported && !c.existingUser).length ?? 0;

  return (
    <div className="glass flex flex-col gap-4 rounded-2xl p-6">
      <div>
        <h2 className="font-display text-xl tracking-wide text-off-white/80">
          Import from GoHighLevel
        </h2>
        <p className="mt-1 font-body text-sm text-off-white/50">
          Pull contacts by tag from GHL, review them, then bring selected people into the Hub as
          real accounts. Each import sends a migration invite email — they land in a holding
          pattern (INVITED) until they click through and set a password.
        </p>
        {!ghlConfigured && (
          <p className="mt-2 rounded-lg border border-orange/30 bg-orange/10 px-3 py-2 font-body text-xs text-orange">
            GHL_API_KEY / GHL_LOCATION_ID aren&apos;t set yet — add them to run a search.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          placeholder="GHL tag name, e.g. &quot;creator-network&quot;"
          className={`${fieldClass} flex-1`}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSearch();
            }
          }}
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={searching || !tag.trim() || !ghlConfigured}
          className="shrink-0 rounded-lg border border-cyan/50 px-5 py-2 font-body text-sm font-semibold text-cyan transition hover:bg-cyan/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {searching ? "Searching..." : "Search GHL"}
        </button>
      </div>

      {searchError && (
        <p className="rounded-lg border border-orange/30 bg-orange/10 px-4 py-3 font-body text-sm text-orange">
          {searchError}
        </p>
      )}

      {contacts && contacts.length === 0 && !searchError && (
        <p className="font-body text-sm text-off-white/50">No contacts found with that tag.</p>
      )}

      {contacts && contacts.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-xl border border-off-white/10">
            <table className="w-full text-left font-body text-sm">
              <thead>
                <tr className="border-b border-off-white/10 text-xs uppercase tracking-wide text-off-white/40">
                  <th className="px-3 py-2"></th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Phone</th>
                  <th className="px-3 py-2">Tags</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((c) => {
                  const disabled = c.alreadyImported || c.existingUser;
                  return (
                    <tr key={c.ghlContactId} className="border-b border-off-white/5 last:border-0">
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={selected.has(c.ghlContactId)}
                          disabled={disabled}
                          onChange={() => toggleSelected(c.ghlContactId)}
                          className="h-4 w-4 accent-orange disabled:opacity-30"
                        />
                      </td>
                      <td className="px-3 py-2 text-off-white">{c.name || "—"}</td>
                      <td className="px-3 py-2 text-off-white/70">{c.email}</td>
                      <td className="px-3 py-2 text-off-white/50">{c.phone || "—"}</td>
                      <td className="px-3 py-2 text-off-white/50">
                        {c.tags.length > 0 ? c.tags.join(", ") : "—"}
                      </td>
                      <td className="px-3 py-2">
                        {c.alreadyImported ? (
                          <span className="rounded-full bg-cyan/15 px-2 py-0.5 text-xs font-semibold text-cyan">
                            Already imported
                          </span>
                        ) : c.existingUser ? (
                          <span className="rounded-full bg-off-white/10 px-2 py-0.5 text-xs font-semibold text-off-white/50">
                            Existing account
                          </span>
                        ) : (
                          <span className="rounded-full bg-orange/15 px-2 py-0.5 text-xs font-semibold text-orange">
                            New
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleImport}
              disabled={importing || selected.size === 0}
              className="rounded-lg bg-orange px-6 py-2.5 font-body text-sm font-semibold text-off-white shadow-glow transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {importing
                ? "Importing..."
                : `Import ${selected.size} selected & send invite${selected.size === 1 ? "" : "s"}`}
            </button>
            <p className="font-body text-xs text-off-white/40">
              {selectableCount} of {contacts.length} are new / importable.
            </p>
          </div>
        </>
      )}

      {importResult && (
        <div className="rounded-lg border border-cyan/30 bg-cyan/10 px-4 py-3 font-body text-sm text-cyan">
          <p>
            Imported {importResult.imported}, skipped {importResult.skipped} (already existed).
          </p>
          {importResult.errors.length > 0 && (
            <ul className="mt-2 list-disc pl-4 text-orange">
              {importResult.errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
