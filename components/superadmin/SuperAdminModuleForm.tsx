"use client";

import { useState } from "react";
import type { HubSku } from "@/lib/hub/catalog";
import { resetDryRunModulesAction, saveDryRunModulesAction } from "@/app/superadmin/actions";

function SkuGroup({
  title,
  hint,
  skus,
  enabled,
  locked,
  onToggle,
}: {
  title: string;
  hint: string;
  skus: HubSku[];
  enabled: Set<string>;
  locked?: boolean;
  onToggle: (id: string, on: boolean) => void;
}) {
  return (
    <section className="glass rounded-2xl p-6">
      <h2 className="font-display text-xl tracking-wide text-off-white">{title}</h2>
      <p className="mt-1 font-body text-xs text-off-white/45">{hint}</p>
      <ul className="mt-4 space-y-2">
        {skus.map((sku) => {
          const on = enabled.has(sku.id);
          return (
            <li key={sku.id}>
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-lg border border-off-white/10 px-3 py-2 ${
                  locked ? "cursor-not-allowed opacity-70" : "hover:border-cyan/30"
                }`}
              >
                <input
                  type="checkbox"
                  name={locked ? undefined : "sku"}
                  value={sku.id}
                  checked={on}
                  disabled={locked}
                  onChange={(e) => onToggle(sku.id, e.target.checked)}
                  className="mt-1"
                />
                <div>
                  <p className="font-body text-sm text-off-white">{sku.label}</p>
                  <p className="font-body text-[11px] text-off-white/40">
                    {sku.id}
                    {" · "}
                    {sku.description}
                  </p>
                </div>
              </label>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default function SuperAdminModuleForm({
  core,
  optional,
  flagship,
  initialEnabled,
}: {
  core: HubSku[];
  optional: HubSku[];
  flagship: HubSku[];
  initialEnabled: string[];
}) {
  const [enabled, setEnabled] = useState(() => new Set(initialEnabled));

  function toggle(id: string, on: boolean) {
    setEnabled((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      next.add("core");
      return next;
    });
  }

  const hidden = optional.concat(flagship).filter((s) => !enabled.has(s.id)).map((s) => s.id);

  return (
    <form action={saveDryRunModulesAction} className="mt-8 flex flex-col gap-6">
      {hidden.length > 0 && (
        <p className="rounded-lg border border-cyan/30 bg-cyan/10 px-4 py-3 font-body text-sm text-cyan">
          Will hide after save: {hidden.join(", ")}
        </p>
      )}

      <SkuGroup
        title="Core (every hub)"
        hint="Always on. Not a Create Hub checkbox."
        skus={core}
        enabled={enabled}
        locked
        onToggle={toggle}
      />
      <SkuGroup
        title="Optional SKUs"
        hint="Uncheck to preview a thinner client hub. Save applies to this browser (admin + member menus)."
        skus={optional}
        enabled={enabled}
        onToggle={toggle}
      />
      <SkuGroup
        title="Flagship only"
        hint="Uncheck to preview a client hub (no tik.tools, GHL, company social, /updates)."
        skus={flagship}
        enabled={enabled}
        onToggle={toggle}
      />

      <input type="hidden" name="sku" value="core" />

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          className="rounded-lg bg-gradient-to-r from-orange to-cyan px-5 py-2.5 font-body text-sm font-semibold text-charcoal"
        >
          Save preview
        </button>
        <button
          type="submit"
          formAction={resetDryRunModulesAction}
          className="rounded-lg border border-off-white/20 px-5 py-2.5 font-body text-sm text-off-white/70 hover:text-off-white"
        >
          Reset to default
        </button>
      </div>
      <p className="font-body text-xs text-off-white/40">
        Preview is this browser only. No hub is created, no DNS, no extra database.
        Then open Admin or Home to see modules hide.
      </p>
    </form>
  );
}
