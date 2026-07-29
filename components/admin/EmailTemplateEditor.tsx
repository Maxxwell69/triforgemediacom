"use client";

import { useMemo, useState, useTransition } from "react";
import {
  renderTemplateContent,
  type EmailTemplateDef,
  type TemplateVars,
} from "@/lib/emailTemplates";
import { saveEmailTemplate, resetEmailTemplate } from "@/app/admin/emails/actions";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60";

export default function EmailTemplateEditor({
  def,
  initialSubject,
  initialBodyHtml,
  isCustomized,
  updatedByName,
  updatedAt,
  sampleVars,
}: {
  def: EmailTemplateDef;
  initialSubject: string;
  initialBodyHtml: string;
  isCustomized: boolean;
  updatedByName: string | null;
  updatedAt: string | null;
  sampleVars: TemplateVars;
}) {
  const [subject, setSubject] = useState(initialSubject);
  const [bodyHtml, setBodyHtml] = useState(initialBodyHtml);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const preview = useMemo(
    () => renderTemplateContent(def, subject, bodyHtml, def.wrapsInLayout, sampleVars),
    [def, subject, bodyHtml, sampleVars]
  );

  function loadDefault() {
    setSubject(def.defaultSubject);
    setBodyHtml(def.defaultBodyHtml);
    setMessage("Loaded code default into the editor — Save to keep it, or Reset to discard the DB override.");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="glass rounded-2xl p-6">
        <p className="font-body text-xs text-off-white/50">{def.trigger}</p>
        {isCustomized ? (
          <p className="mt-2 font-body text-xs text-cyan">
            Customized
            {updatedByName ? ` by ${updatedByName}` : ""}
            {updatedAt
              ? ` · ${new Date(updatedAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}`
              : ""}
          </p>
        ) : (
          <p className="mt-2 font-body text-xs text-off-white/40">Using code default (not customized yet).</p>
        )}

        <div className="mt-4">
          <p className="mb-2 font-body text-xs font-semibold uppercase tracking-wide text-off-white/40">
            Placeholders
          </p>
          <div className="flex flex-wrap gap-2">
            {def.variables.map((v) => (
              <code
                key={v.key}
                title={v.label}
                className="rounded border border-off-white/15 bg-off-white/5 px-2 py-1 font-mono text-[11px] text-cyan"
              >
                {`{{${v.key}}}`}
                <span className="ml-1 text-off-white/40">({v.kind})</span>
              </code>
            ))}
          </div>
        </div>

        <form
          className="mt-6 flex flex-col gap-4"
          action={(fd) => {
            startTransition(async () => {
              setMessage(null);
              try {
                await saveEmailTemplate(fd);
                setMessage("Saved. Live emails will use this version.");
              } catch (e) {
                setMessage(e instanceof Error ? e.message : "Save failed");
              }
            });
          }}
        >
          <input type="hidden" name="key" value={def.key} />
          <label className="flex flex-col gap-1 font-body text-xs text-off-white/60">
            Subject
            <input
              name="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              className={fieldClass}
            />
          </label>
          <label className="flex flex-col gap-1 font-body text-xs text-off-white/60">
            Body HTML (inner content — branded chrome is wrapped automatically)
            <textarea
              name="bodyHtml"
              value={bodyHtml}
              onChange={(e) => setBodyHtml(e.target.value)}
              required
              rows={16}
              className={`${fieldClass} font-mono text-xs`}
            />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-orange px-5 py-2 font-body text-sm font-semibold text-off-white transition hover:brightness-110 disabled:opacity-40"
            >
              {isPending ? "Saving…" : "Save template"}
            </button>
            <button
              type="button"
              onClick={loadDefault}
              className="rounded-lg border border-off-white/15 px-4 py-2 font-body text-sm text-off-white/70 transition hover:border-cyan/40 hover:text-cyan"
            >
              Load code default
            </button>
            {isCustomized && (
              <button
                type="submit"
                formAction={(fd) => {
                  startTransition(async () => {
                    setMessage(null);
                    try {
                      await resetEmailTemplate(fd);
                      setSubject(def.defaultSubject);
                      setBodyHtml(def.defaultBodyHtml);
                      setMessage("Reset to code default.");
                    } catch (e) {
                      setMessage(e instanceof Error ? e.message : "Reset failed");
                    }
                  });
                }}
                className="font-body text-sm text-orange transition hover:underline"
              >
                Reset to default
              </button>
            )}
          </div>
          {message && <p className="font-body text-xs text-cyan">{message}</p>}
        </form>
      </div>

      <div className="glass rounded-2xl p-6">
        <h2 className="font-display text-xl tracking-wide text-off-white/80">Live preview</h2>
        <p className="mt-1 font-body text-sm text-off-white/50">
          Subject: <span className="text-off-white/80">{preview.subject}</span>
        </p>
        <div className="mt-4 overflow-hidden rounded-xl border border-off-white/10 bg-charcoal">
          <iframe title="Preview" srcDoc={preview.html} sandbox="" className="h-[560px] w-full" />
        </div>
      </div>
    </div>
  );
}
