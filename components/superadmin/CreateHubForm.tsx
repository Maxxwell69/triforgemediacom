"use client";

import { useState, useTransition } from "react";
import type { HubSku } from "@/lib/hub/catalog";
import { createClientHubAction } from "@/app/superadmin/actions";

const fieldClass =
  "mt-1 w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60";

export default function CreateHubForm({
  optional,
  defaultEnabled,
}: {
  optional: HubSku[];
  defaultEnabled: string[];
}) {
  const [enabled, setEnabled] = useState(() => new Set(defaultEnabled));
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle(id: string, on: boolean) {
    setEnabled((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      next.add("core");
      return next;
    });
  }

  return (
    <form
      className="mt-6 flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const data = new FormData(form);
        for (const id of enabled) data.append("sku", id);
        setError(null);
        start(async () => {
          const result = await createClientHubAction(data);
          if (result?.error) setError(result.error);
        });
      }}
    >
      <div className="space-y-4 rounded-2xl border border-off-white/10 p-6">
        <label className="block font-body text-xs uppercase tracking-wide text-off-white/40">
          Hub name
          <input name="name" required placeholder="Acme Creators" className={fieldClass} />
        </label>
        <label className="block font-body text-xs uppercase tracking-wide text-off-white/40">
          Slug → {"{slug}"}.hub.triforgemedia.com
          <input name="slug" required placeholder="acme" className={fieldClass} />
        </label>
        <label className="block font-body text-xs uppercase tracking-wide text-off-white/40">
          Client admin email
          <input
            name="email"
            type="email"
            required
            placeholder="admin@client.com"
            className={fieldClass}
          />
        </label>
        <label className="block font-body text-xs uppercase tracking-wide text-off-white/40">
          Notes
          <textarea name="notes" rows={2} placeholder="Optional" className={fieldClass} />
        </label>
      </div>

      <section className="glass rounded-2xl p-6">
        <h2 className="font-display text-xl tracking-wide text-off-white">Optional SKUs</h2>
        <p className="mt-1 font-body text-xs text-off-white/45">
          Core admin is always on. Flagship TriForge modules stay off for client hubs.
        </p>
        <ul className="mt-4 space-y-2">
          {optional.map((sku) => (
            <li key={sku.id}>
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-off-white/10 px-3 py-2 hover:border-cyan/30">
                <input
                  type="checkbox"
                  checked={enabled.has(sku.id)}
                  onChange={(e) => toggle(sku.id, e.target.checked)}
                  className="mt-1"
                />
                <div>
                  <p className="font-body text-sm text-off-white">{sku.label}</p>
                  <p className="font-body text-[11px] text-off-white/40">{sku.description}</p>
                </div>
              </label>
            </li>
          ))}
        </ul>
      </section>

      {error ? <p className="font-body text-sm text-orange">{error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-lg bg-gradient-to-r from-orange to-cyan px-5 py-2.5 font-body text-sm font-semibold text-charcoal disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save hub"}
      </button>
    </form>
  );
}
