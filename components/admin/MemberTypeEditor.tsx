"use client";

import { useState } from "react";
import { deleteMemberType, updateMemberType } from "@/app/admin/member-types/actions";
import { MEMBER_TYPE_SYSTEMS } from "@/lib/hub/memberTypeCatalog";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white outline-none transition focus:border-cyan/60";

export default function MemberTypeEditor({
  type,
  systems,
}: {
  type: {
    id: string;
    key: string | null;
    name: string;
    allowedMenuIds: string[];
    signupDefault: boolean;
  };
  systems: { id: string; label: string }[];
}) {
  const [busy, setBusy] = useState(false);
  const allSystems = type.allowedMenuIds.length === 0;

  return (
    <form
      action={updateMemberType}
      className="glass flex flex-col gap-4 rounded-2xl p-5"
      onSubmit={() => setBusy(true)}
    >
      <input type="hidden" name="id" value={type.id} />
      <div className="flex flex-wrap items-end gap-3">
        <label className="min-w-[12rem] flex-1 font-body text-xs text-off-white/50">
          Name
          <input name="name" required defaultValue={type.name} className={`mt-1 ${fieldClass}`} />
        </label>
        <label className="flex items-center gap-2 font-body text-xs text-off-white/70">
          <input
            type="checkbox"
            name="signupDefault"
            defaultChecked={type.signupDefault}
            className="accent-orange"
          />
          Default for public signup
        </label>
        {type.key ? (
          <span className="font-body text-[10px] uppercase tracking-wide text-off-white/35">
            Built-in
          </span>
        ) : (
          <button
            type="submit"
            formAction={deleteMemberType}
            className="font-body text-xs text-off-white/45 transition hover:text-orange"
            onClick={(e) => {
              if (!confirm(`Delete “${type.name}”? People on this type become Members.`)) {
                e.preventDefault();
              }
            }}
          >
            Delete
          </button>
        )}
      </div>

      <div>
        <p className="font-body text-xs text-off-white/50">Systems this type can see</p>
        <p className="mt-0.5 font-body text-[11px] text-off-white/35">
          Leave every box unchecked to give them every hub system that’s turned on. Home, Account,
          and Notifications stay available for everyone.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {systems.map((sys) => (
            <label
              key={sys.id}
              className="inline-flex items-center gap-1.5 rounded-md border border-off-white/15 px-2 py-1 font-body text-xs text-off-white/80"
            >
              <input
                type="checkbox"
                name="allowedMenuId"
                value={sys.id}
                defaultChecked={!allSystems && type.allowedMenuIds.includes(sys.id)}
                className="accent-orange"
              />
              {sys.label}
            </label>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={busy}
        className="self-start rounded-lg bg-orange px-4 py-1.5 font-body text-sm font-semibold text-off-white shadow-glow disabled:opacity-50"
      >
        {busy ? "Saving…" : "Save type"}
      </button>
    </form>
  );
}
