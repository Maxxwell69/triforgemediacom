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
}: {
  webinarId: string;
  audience: WebinarAudience;
}) {
  const [value, setValue] = useState(audience);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-off-white/10 pt-3">
      <label className="font-body text-xs text-off-white/50">Audience</label>
      <select
        value={value}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value as WebinarAudience;
          setValue(next);
          setError(null);
          startTransition(async () => {
            const result = await setWebinarAudienceAction(webinarId, next);
            if (result.error) {
              setError(result.error);
              setValue(audience);
            }
          });
        }}
        className="rounded-lg border border-off-white/15 bg-charcoal px-2 py-1.5 font-body text-sm text-off-white outline-none focus:border-orange disabled:opacity-60"
      >
        {WEBINAR_AUDIENCE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {WEBINAR_AUDIENCE_LABELS[opt.value]}
          </option>
        ))}
      </select>
      {pending && <span className="font-body text-xs text-off-white/40">Saving…</span>}
      {error && <span className="font-body text-xs text-orange">{error}</span>}
    </div>
  );
}
