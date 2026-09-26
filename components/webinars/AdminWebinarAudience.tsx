"use client";

import { useState, useTransition } from "react";
import type { WebinarAudience } from "@prisma/client";
import { setWebinarAudienceAction } from "@/app/admin/webinars/actions";
import {
  WEBINAR_AUDIENCE_LABELS,
  WEBINAR_AUDIENCE_OPTIONS,
} from "@/lib/validations/webinar";

export default function AdminWebinarAudience({
  webinarId,
  audience,
  audienceMemberTypeIds = [],
  memberTypes = [],
  clientHub = false,
}: {
  webinarId: string;
  audience: WebinarAudience;
  audienceMemberTypeIds?: string[];
  memberTypes?: { id: string; name: string }[];
  clientHub?: boolean;
}) {
  const [value, setValue] = useState(audience);
  const [typeIds, setTypeIds] = useState<string[]>(audienceMemberTypeIds);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const options = clientHub
    ? WEBINAR_AUDIENCE_OPTIONS.filter((opt) => opt.value === "ALL" || opt.value === "ADMIN")
    : WEBINAR_AUDIENCE_OPTIONS;

  function save(nextAudience: WebinarAudience, nextTypes: string[]) {
    setError(null);
    startTransition(async () => {
      const result = await setWebinarAudienceAction(webinarId, nextAudience, nextTypes);
      if (result.error) {
        setError(result.error);
        setValue(audience);
        setTypeIds(audienceMemberTypeIds);
      }
    });
  }

  return (
    <div className="mt-3 flex flex-col gap-2 border-t border-off-white/10 pt-3">
      <div className="flex flex-wrap items-center gap-2">
        <label className="font-body text-xs text-off-white/50">Audience</label>
        <select
          value={value}
          disabled={pending}
          onChange={(e) => {
            const next = e.target.value as WebinarAudience;
            setValue(next);
            save(next, next === "ADMIN" ? [] : typeIds);
          }}
          className="rounded-lg border border-off-white/15 bg-charcoal px-2 py-1.5 font-body text-sm text-off-white outline-none focus:border-orange disabled:opacity-60"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {WEBINAR_AUDIENCE_LABELS[opt.value]}
            </option>
          ))}
        </select>
        {pending && <span className="font-body text-xs text-off-white/40">Saving…</span>}
        {error && <span className="font-body text-xs text-orange">{error}</span>}
      </div>
      {clientHub && value !== "ADMIN" && memberTypes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {memberTypes.map((type) => {
            const checked = typeIds.includes(type.id);
            return (
              <label
                key={type.id}
                className="inline-flex items-center gap-1.5 rounded-md border border-off-white/15 px-2 py-1 font-body text-xs text-off-white/80"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={pending}
                  onChange={() => {
                    const next = checked
                      ? typeIds.filter((id) => id !== type.id)
                      : [...typeIds, type.id];
                    setTypeIds(next);
                    save(value, next);
                  }}
                  className="accent-orange"
                />
                {type.name}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
