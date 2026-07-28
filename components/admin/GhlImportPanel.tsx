"use client";

import { useRef, useState, useTransition } from "react";
import {
  parseCsvPreview,
  importCsvContacts,
  type CsvPreviewContact,
} from "@/app/admin/import/actions";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60";

export default function GhlImportPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvText, setCsvText] = useState("");
  const [contacts, setContacts] = useState<CsvPreviewContact[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [parsing, startParsing] = useTransition();

  const [importing, startImporting] = useTransition();
  const [importResult, setImportResult] = useState<
    { imported: number; skipped: number; errors: string[] } | null
  >(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCsvText(String(reader.result || ""));
    reader.readAsText(file);
  }

  function handlePreview() {
    setImportResult(null);
    startParsing(async () => {
      const result = await parseCsvPreview(csvText);
      setParseErrors(result.errors);
      setContacts(result.contacts);
      setSelected(
        new Set(
          result.contacts
            .filter((c) => !c.alreadyImported && !c.existingUser)
            .map((c) => c.importKey)
        )
      );
    });
  }

  function toggleSelected(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function handleImport() {
    if (!contacts) return;
    const toImport = contacts.filter((c) => selected.has(c.importKey));
    if (toImport.length === 0) return;
    if (
      !confirm(
        `Import ${toImport.length} contact${toImport.length === 1 ? "" : "s"} and send each a Hub migration invite email?`
      )
    ) {
      return;
    }

    startImporting(async () => {
      const result = await importCsvContacts(
        toImport.map(({ name, email, phone, tags }) => ({ name, email, phone, tags }))
      );
      setImportResult(result);
      setContacts((prev) =>
        prev ? prev.map((c) => (selected.has(c.importKey) ? { ...c, alreadyImported: true } : c)) : prev
      );
      setSelected(new Set());
    });
  }

  const selectableCount = contacts?.filter((c) => !c.alreadyImported && !c.existingUser).length ?? 0;

  return (
    <div className="glass flex flex-col gap-4 rounded-2xl p-6">
      <div>
        <h2 className="font-display text-xl tracking-wide text-off-white/80">
          Import from a CSV export
        </h2>
        <p className="mt-1 font-body text-sm text-off-white/50">
          Export your Media / Creator Network contacts from GHL as a CSV, then upload or paste it
          below. Review the parsed list, then bring selected people into the Hub as real accounts
          &mdash; each gets a migration invite email and lands in a holding pattern (INVITED)
          until they click through and set a password.
        </p>
        <p className="mt-2 font-body text-xs text-off-white/40">
          Expected columns (header row required): <code className="text-cyan/80">email</code>{" "}
          (required), <code className="text-cyan/80">name</code>,{" "}
          <code className="text-cyan/80">phone</code>,{" "}
          <code className="text-cyan/80">tags</code> (separate multiple tags with{" "}
          <code className="text-cyan/80">;</code>). Example:{" "}
          <code className="text-off-white/60">
            name,email,phone,tags
            <br />
            Jane Creator,jane@example.com,+15555550123,creator-network;no-agency
          </code>
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg border border-off-white/20 px-4 py-2 font-body text-sm font-semibold text-off-white/70 transition hover:border-off-white/40"
          >
            Upload CSV file
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            className="hidden"
          />
          <span className="font-body text-xs text-off-white/40">or paste it below</span>
        </div>
        <textarea
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          rows={6}
          placeholder="name,email,phone,tags&#10;Jane Creator,jane@example.com,+15555550123,creator-network"
          className={`${fieldClass} font-mono text-xs`}
        />
        <button
          type="button"
          onClick={handlePreview}
          disabled={parsing || !csvText.trim()}
          className="self-start rounded-lg border border-cyan/50 px-5 py-2 font-body text-sm font-semibold text-cyan transition hover:bg-cyan/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {parsing ? "Parsing..." : "Preview import"}
        </button>
      </div>

      {parseErrors.length > 0 && (
        <div className="rounded-lg border border-orange/30 bg-orange/10 px-4 py-3 font-body text-sm text-orange">
          <ul className="list-disc pl-4">
            {parseErrors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      {contacts && contacts.length === 0 && parseErrors.length === 0 && (
        <p className="font-body text-sm text-off-white/50">No valid rows found.</p>
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
                    <tr key={c.importKey} className="border-b border-off-white/5 last:border-0">
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={selected.has(c.importKey)}
                          disabled={disabled}
                          onChange={() => toggleSelected(c.importKey)}
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
