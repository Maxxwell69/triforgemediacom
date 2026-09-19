"use client";

import { useState, useTransition } from "react";
import {
  BUILTIN_MENU_BY_ID,
  isExternalMenuHref,
  menuChildren,
  menuRoots,
  moveMenuSibling,
  setMenuParent,
  type SiteMenuItem,
} from "@/lib/siteMenu";
import { saveMenuLineup } from "@/app/admin/menu/actions";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60";
const ghostBtn =
  "rounded-lg border border-off-white/15 px-2.5 py-1.5 font-body text-xs text-off-white/70 transition hover:bg-off-white/10 disabled:opacity-30";

export default function MenuLineupEditor({ initialItems }: { initialItems: SiteMenuItem[] }) {
  const [items, setItems] = useState<SiteMenuItem[]>(initialItems);
  const [customLabel, setCustomLabel] = useState("");
  const [customHref, setCustomHref] = useState("");
  const [customNewTab, setCustomNewTab] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const roots = menuRoots(items);
  const parentChoices = roots;

  function commit(next: SiteMenuItem[]) {
    setItems(next);
    setSaved(false);
  }

  function update(id: string, patch: Partial<SiteMenuItem>) {
    commit(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function addCustom() {
    setError(null);
    const label = customLabel.trim();
    const href = customHref.trim();
    if (!label || !href) {
      setError("Custom links need a name and a URL.");
      return;
    }
    commit([
      ...items,
      {
        id: `custom_${crypto.randomUUID()}`,
        kind: "custom",
        enabled: true,
        label,
        href,
        newTab: customNewTab,
      },
    ]);
    setCustomLabel("");
    setCustomHref("");
    setCustomNewTab(false);
  }

  function removeCustom(id: string) {
    commit(items.filter((item) => item.id !== id).map((item) => (
      item.parentId === id ? { ...item, parentId: undefined } : item
    )));
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

  function renderRow(item: SiteMenuItem, siblingIndex: number, siblingCount: number) {
    const def = item.kind === "builtin" ? BUILTIN_MENU_BY_ID.get(item.id) : undefined;
    const nested = Boolean(item.parentId);
    const childCount = menuChildren(items, item.id).length;
    return (
      <li
        key={item.id}
        className={`flex flex-col gap-2 rounded-xl border border-off-white/10 bg-charcoal/40 p-3 ${
          nested ? "ml-8 border-cyan/20" : ""
        }`}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
          <label className="flex shrink-0 items-center gap-2 sm:mt-2 sm:w-8">
            <input
              type="checkbox"
              checked={item.enabled}
              onChange={(e) => update(item.id, { enabled: e.target.checked })}
              className="h-4 w-4 accent-orange"
              aria-label={`Show ${item.label}`}
            />
          </label>
          <div className="min-w-0 flex-1">
            <input
              value={item.label}
              onChange={(e) => update(item.id, { label: e.target.value })}
              className={fieldClass}
              aria-label="Menu label"
            />
            {item.kind === "custom" ? (
              <input
                value={item.href ?? ""}
                onChange={(e) => update(item.id, { href: e.target.value })}
                className={`${fieldClass} mt-2`}
                placeholder="/page or https://…"
                aria-label="Custom link URL"
              />
            ) : (
              <p className="mt-1 font-body text-[11px] text-off-white/35">
                Built-in · {def?.href ?? item.id}
                {childCount > 0 ? ` · ${childCount} child${childCount === 1 ? "" : "ren"}` : ""}
              </p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 font-body text-xs text-off-white/60">
                <span>Parent</span>
                <select
                  value={item.parentId ?? ""}
                  onChange={(e) => commit(setMenuParent(items, item.id, e.target.value || undefined))}
                  className="rounded-lg border border-off-white/15 bg-off-white/5 px-2 py-1 text-off-white outline-none focus:border-cyan/60"
                  aria-label="Parent menu item"
                >
                  <option value="">Top level</option>
                  {parentChoices
                    .filter((parent) => parent.id !== item.id)
                    .map((parent) => (
                      <option key={parent.id} value={parent.id}>
                        {parent.label || parent.id}
                      </option>
                    ))}
                </select>
              </label>
              {item.kind === "custom" ? (
                <label className="flex items-center gap-2 font-body text-xs text-off-white/60">
                  <input
                    type="checkbox"
                    checked={Boolean(item.newTab)}
                    onChange={(e) => update(item.id, { newTab: e.target.checked })}
                    className="h-3.5 w-3.5 accent-orange"
                  />
                  Open in new tab
                </label>
              ) : null}
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-1.5">
            <button
              type="button"
              className={ghostBtn}
              onClick={() => commit(moveMenuSibling(items, item.id, -1))}
              disabled={siblingIndex === 0}
              aria-label="Move up"
            >
              Up
            </button>
            <button
              type="button"
              className={ghostBtn}
              onClick={() => commit(moveMenuSibling(items, item.id, 1))}
              disabled={siblingIndex === siblingCount - 1}
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
        </div>
      </li>
    );
  }

  return (
    <div className="mt-8 flex flex-col gap-6">
      <div className="glass rounded-2xl p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl tracking-wide text-off-white/80">Lineup</h2>
            <p className="mt-1 font-body text-xs text-off-white/45">
              Check items to show them. Use Parent to nest a row under another item. Custom links
              can open in a new tab or the same window.
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
          {roots.map((root, rootIndex) => (
            <li key={root.id} className="flex list-none flex-col gap-2">
              <ol className="flex flex-col gap-2">
                {renderRow(root, rootIndex, roots.length)}
                {menuChildren(items, root.id).map((child, childIndex, kids) =>
                  renderRow(child, childIndex, kids.length)
                )}
              </ol>
            </li>
          ))}
        </ol>
      </div>

      <div className="glass rounded-2xl p-5">
        <h2 className="font-display text-xl tracking-wide text-off-white/80">Custom link</h2>
        <p className="mt-1 font-body text-xs text-off-white/45">
          Add a sidebar row that opens an internal path or an external URL. Choose whether it opens
          in a new tab or this window, then save the lineup.
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
            onChange={(e) => {
              const value = e.target.value;
              setCustomHref(value);
              if (isExternalMenuHref(value.trim())) setCustomNewTab(true);
            }}
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
        <label className="mt-3 flex items-center gap-2 font-body text-xs text-off-white/60">
          <input
            type="checkbox"
            checked={customNewTab}
            onChange={(e) => setCustomNewTab(e.target.checked)}
            className="h-3.5 w-3.5 accent-orange"
          />
          Open in new tab
        </label>
      </div>

      {error ? (
        <p className="font-body text-sm text-orange" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
