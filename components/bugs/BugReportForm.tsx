"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { BUG_PLATFORM_LABELS, BUG_REPORT_PLATFORMS } from "@/lib/bugs";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-orange px-6 py-2.5 font-body text-sm font-semibold text-off-white shadow-glow transition hover:brightness-110 disabled:opacity-60"
    >
      {pending ? "Submitting…" : "Submit Hub Bug"}
    </button>
  );
}

export default function BugReportForm({
  action,
  error,
}: {
  action: (formData: FormData) => Promise<void>;
  error?: string | null;
}) {
  const [pageUrl, setPageUrl] = useState("");
  const [pasteHint, setPasteHint] = useState<string | null>(null);

  useEffect(() => {
    // Prefill from the page they came from (if any), not /bugs itself.
    const ref = document.referrer;
    if (!ref) return;
    try {
      const refUrl = new URL(ref);
      if (refUrl.origin === window.location.origin && !refUrl.pathname.startsWith("/bugs")) {
        setPageUrl(refUrl.pathname + refUrl.search);
      }
    } catch {
      // ignore bad referrer
    }
  }, []);

  async function pasteUrl() {
    setPasteHint(null);
    try {
      const text = await navigator.clipboard.readText();
      const trimmed = text.trim();
      if (!trimmed) {
        setPasteHint("Clipboard is empty.");
        return;
      }
      setPageUrl(trimmed.slice(0, 2000));
      setPasteHint("Pasted.");
    } catch {
      setPasteHint("Couldn't read clipboard — paste manually.");
    }
  }

  return (
    <form
      action={action}
      encType="multipart/form-data"
      className="glass flex flex-col gap-3 rounded-2xl p-6"
    >
      <h2 className="font-display text-xl tracking-wide text-off-white/80">File a Hub Bug</h2>
      <p className="font-body text-xs text-off-white/45">
        You&apos;ll get credit on the board when the team marks it fixed.
      </p>
      {error && (
        <p className="rounded-lg border border-orange/30 bg-orange/10 px-3 py-2 font-body text-sm text-orange">
          {error}
        </p>
      )}
      <input
        name="title"
        required
        minLength={5}
        maxLength={120}
        placeholder="Short title (what's broken?)"
        className={fieldClass}
      />
      <label className="flex flex-col gap-1 font-body text-xs text-off-white/50">
        Where did you see it?
        <select name="platform" required defaultValue="WEBSITE" className={fieldClass}>
          {BUG_REPORT_PLATFORMS.map((p) => (
            <option key={p} value={p}>
              {BUG_PLATFORM_LABELS[p]}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 font-body text-xs text-off-white/50">
        Page URL <span className="text-off-white/30">(optional)</span>
        <div className="flex gap-2">
          <input
            name="pageUrl"
            value={pageUrl}
            onChange={(e) => setPageUrl(e.target.value)}
            maxLength={2000}
            placeholder="https://hub… or /channels/…"
            className={fieldClass}
          />
          <button
            type="button"
            onClick={pasteUrl}
            className="shrink-0 rounded-lg border border-off-white/15 px-3 py-2 font-body text-xs text-off-white/70 transition hover:border-cyan/40 hover:text-cyan"
          >
            Paste
          </button>
        </div>
        {pasteHint && <span className="text-off-white/35">{pasteHint}</span>}
      </label>
      <textarea
        name="description"
        required
        minLength={10}
        maxLength={5000}
        rows={4}
        placeholder="What happened? Steps to reproduce, what you expected, and any error text."
        className={fieldClass}
      />
      <label className="flex flex-col gap-1 font-body text-xs text-off-white/50">
        Screenshot <span className="text-off-white/30">(optional — JPG, PNG, WEBP, or GIF)</span>
        <input
          type="file"
          name="screenshot"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="font-body text-sm text-off-white/70 file:mr-3 file:rounded-lg file:border-0 file:bg-off-white/10 file:px-3 file:py-2 file:font-body file:text-xs file:text-off-white"
        />
      </label>
      <SubmitButton />
    </form>
  );
}
