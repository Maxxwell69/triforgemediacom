"use client";

import { useState, useTransition } from "react";
import type { HubSku } from "@/lib/hub/catalog";
import { HUB_SETUP_STEPS } from "@/lib/hub/clientHubs";
import { saveClientHubAction, toggleHubSetupStepAction } from "@/app/superadmin/actions";

const fieldClass =
  "mt-1 w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60";

type HubFields = {
  id: string;
  name: string;
  slug: string;
  clientAdminEmail: string;
  notes: string | null;
  enabledSkuIds: string[];
  dnsCnameAt: Date | string | null;
  railwayDomainAt: Date | string | null;
  tenantDbAt: Date | string | null;
  adminInvitedAt: Date | string | null;
};

export default function HubSetupForm({
  hub,
  optional,
}: {
  hub: HubFields;
  optional: HubSku[];
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const done = {
    dns: !!hub.dnsCnameAt,
    tls: !!hub.railwayDomainAt,
    database: !!hub.tenantDbAt,
    invite: !!hub.adminInvitedAt,
  };

  return (
    <div className="flex flex-col gap-8">
      <form
        className="flex flex-col gap-6"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          start(async () => {
            const result = await saveClientHubAction(data);
            if (result?.error) setError(result.error);
            else setError(null);
          });
        }}
      >
        <input type="hidden" name="hubId" value={hub.id} />
        <div className="space-y-4 rounded-2xl border border-off-white/10 p-6">
          <label className="block font-body text-xs uppercase tracking-wide text-off-white/40">
            Hub name
            <input name="name" required defaultValue={hub.name} className={fieldClass} />
          </label>
          <label className="block font-body text-xs uppercase tracking-wide text-off-white/40">
            Slug → {hub.slug}.hub.triforgemedia.com
            <input name="slug" required defaultValue={hub.slug} className={fieldClass} />
          </label>
          <label className="block font-body text-xs uppercase tracking-wide text-off-white/40">
            Client admin email
            <input
              name="email"
              type="email"
              required
              defaultValue={hub.clientAdminEmail}
              className={fieldClass}
            />
          </label>
          <label className="block font-body text-xs uppercase tracking-wide text-off-white/40">
            Notes
            <textarea name="notes" rows={2} defaultValue={hub.notes ?? ""} className={fieldClass} />
          </label>
        </div>

        <section className="glass rounded-2xl p-6">
          <h2 className="font-display text-xl tracking-wide text-off-white">Optional SKUs</h2>
          <ul className="mt-4 space-y-2">
            {optional.map((sku) => (
              <li key={sku.id}>
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-off-white/10 px-3 py-2 hover:border-cyan/30">
                  <input
                    type="checkbox"
                    name="sku"
                    value={sku.id}
                    defaultChecked={hub.enabledSkuIds.includes(sku.id)}
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

        <button
          type="submit"
          disabled={pending}
          className="self-start rounded-lg bg-gradient-to-r from-orange to-cyan px-5 py-2.5 font-body text-sm font-semibold text-charcoal disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
        {error ? <p className="font-body text-sm text-orange">{error}</p> : null}
      </form>

      <section className="glass rounded-2xl p-6">
        <h2 className="font-display text-xl tracking-wide text-off-white">Next setup steps</h2>
        <p className="mt-1 font-body text-xs text-off-white/45">
          The hub record is saved. Mark each step when you finish it outside the app.
        </p>
        <ul className="mt-4 space-y-3">
          <li className="rounded-lg border border-cyan/30 bg-cyan/10 px-3 py-3">
            <p className="font-body text-sm text-off-white">Hub record saved</p>
            <p className="mt-1 font-body text-[11px] text-off-white/55">
              Name, slug, email, and SKUs are in Postgres. This site (Hub 0) is unchanged.
            </p>
          </li>
          {HUB_SETUP_STEPS.map((step) => {
            const complete = done[step.id];
            const how = step.how.replaceAll("{slug}", hub.slug);
            return (
              <li
                key={step.id}
                className={`rounded-lg border px-3 py-3 ${
                  complete ? "border-cyan/30 bg-cyan/10" : "border-off-white/10"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-body text-sm text-off-white">
                      {complete ? "Done" : "To do"} — {step.label}
                    </p>
                    <p className="mt-1 font-body text-[11px] text-off-white/55">{how}</p>
                  </div>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      const data = new FormData();
                      data.set("hubId", hub.id);
                      data.set("stepId", step.id);
                      start(async () => {
                        await toggleHubSetupStepAction(data);
                      });
                    }}
                    className="shrink-0 rounded-lg border border-off-white/20 px-3 py-1.5 font-body text-xs text-off-white/80 hover:text-off-white disabled:opacity-50"
                  >
                    {complete ? "Undo" : "Mark done"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
