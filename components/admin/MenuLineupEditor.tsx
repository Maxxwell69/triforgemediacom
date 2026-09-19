"use client";

import { useState, useTransition } from "react";
import { BUILTIN_MENU_BY_ID, type SiteMenuItem } from "@/lib/siteMenu";
import { saveMenuLineup } from "@/app/admin/menu/actions";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60";
const ghostBtn =
  "rounded-lg border border-off-white/15 px-2.5 py-1.5 font-body text-xs text-off-white/70 transition hover:bg-off-white/10 disabled:opacity-30";

export default function MenuLineupEditor({ initialItems }: { initialItems: SiteMenuItem[] }) {
  const [items, setItems] = useState<SiteMenuItem[]>(initialItems);
  const [customLabel, setCustomLabel] = useState("");
  const [customHref, setCustomHref] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function move(index: number, dir: -1 | 1) {
    const next = index + dir;
    if (next < 0 || next >= items.length) return;
    const copy = [...items];
    const [row] = copy.splice(index, 1);
    copy.splice(next, 0, row);
    setItems(copy);
    setSaved(false);
  }

  function update(index: number, patch: Partial<SiteMenuItem>) {
    setItems((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)));
    setSaved(false);
  }

  function addCustom() {
    setError(null);
    const label = customLabel.trim();
    const href = customHref.trim();
    if (!label || !href) {
      setError("Custom links need a name and a URL.");
      return;
    }
    setItems((current) => [
      ...current,
      {
        id: `custom_${crypto.randomUUID()}`,
        kind: "custom",
        enabled: true,
        label,
        href,
      },
    ]);
    setCustomLabel("");
    setCustomHref("");
    setSaved(false);
  }

  function removeCustom(id: string) {
    setItems((current) => current.filter((item) => item.id !== id));
    setSaved(false);
  }

  function save() {
    setError(null);
    startTransition(async () => {
      try {
        const next = await saveMenuLineup(items);
        setItems(next);
        setSaved(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save the menu.");
      }
    });
  }

  return (
    <div className="mt-8 flex flex-col gap-6">
      <div className="glass rounded-2xl p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl tracking-wide text-off-white/80">Lineup</h2>
            <p className="mt-1 font-body text-xs text-off-white/45">
              Check items to show them. Move rows up or down to set the member sidebar order.
              Unchecked built-ins stay in the list so you can turn them back on later.
            </p>
          </div>
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="rounded-lg border border-cyan/40 bg-cyan/10 px-4 py-2 font-body text-xs font-semibold text-cyan transition hover:bg-cyan/15 disabled:opacity-50"
          >
            {pending ? "Saving…" : saved ? "Saved" : "Save lineup"}
          </button>
        </div>

        <ol className="mt-5 flex flex-col gap-2">
          {items.map((item, index) => {
            const def = item.kind === "builtin" ? BUILTIN_MENU_BY_ID.get(item.id) : undefined;
            return (
              <li
                key={item.id}
                className="flex flex-col gap-2 rounded-xl border border-off-white/10 bg-charcoal/40 p-3 sm:flex-row sm:items-center"
              >
                <label className="flex shrink-0 items-center gap-2 sm:w-8">
                  <input
                    type="checkbox"
                    checked={item.enabled}
                    onChange={(e) => update(index, { enabled: e.target.checked })}
                    className="h-4 w-4 accent-orange"
                    aria-label={`Show ${item.label}`}
                  />
                </label>
                <div className="min-w-0 flex-1">
                  <input
                    value={item.label}
                    onChange={(e) => update(index, { label: e.target.value })}
                    className={fieldClass}
                    aria-label="Menu label"
                  />
                  {item.kind === "custom" ? (
                    <input
                      value={item.href ?? ""}
                      onChange={(e) => update(index, { href: e.target.value })}
                      className={`${fieldClass} mt-2`}
                      placeholder="/page or https://…"
                      aria-label="Custom link URL"
                    />
                  ) : (
                    <p className="mt-1 font-body text-[11px] text-off-white/35">
                      Built-in · {def?.href ?? item.id}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    className={ghostBtn}
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    aria-label="Move up"
                  >
                    Up
                  </button>
                  <button
                    type="button"
                    className={ghostBtn}
                    onClick={() => move(index, 1)}
                    disabled={index === items.length - 1}
                    aria-label="Move down"
                  >
                    Down
                  </button>
                  {item.kind === "custom" ? (
                    <button
                      type="button"
                      className={`${ghostBtn} text-orange/80`}
                      onClick={() => removeCustom(item.id)}
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="glass rounded-2xl p-5">
        <h2 className="font-display text-xl tracking-wide text-off-white/80">Custom link</h2>
        <p className="mt-1 font-body text-xs text-off-white/45">
          Add a sidebar row that opens an internal path or an external URL. Members go there when
          they click it. Save the lineup after you add or reorder links.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1.4fr_auto]">
          <input
            value={customLabel}
            onChange={(e) => setCustomLabel(e.target.value)}
            className={fieldClass}
            placeholder="Link name"
            aria-label="Custom link name"
          />
          <input
            value={customHref}
            onChange={(e) => setCustomHref(e.target.value)}
            className={fieldClass}
            placeholder="/groups or https://example.com"
            aria-label="Custom link URL"
          />
          <button
            type="button"
            onClick={addCustom}
            className="rounded-lg border border-orange/50 bg-orange/10 px-4 py-2 font-body text-xs font-semibold text-orange transition hover:bg-orange/15"
          >
            Add custom link
          </button>
        </div>
      </div>

      {error ? (
        <p className="font-body text-sm text-orange" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
