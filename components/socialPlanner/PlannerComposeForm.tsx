"use client";

import { useMemo, useState } from "react";
import DeviceTimeZoneField from "@/components/DeviceTimeZoneField";
import ImageUploadField from "@/components/ImageUploadField";
import PlannerVideoUpload from "@/components/socialPlanner/PlannerVideoUpload";
import { plannerKindLabel, plannerPrivacyLabel } from "@/lib/socialPlanner/labels";
import type { SocialPlannerItemKind } from "@prisma/client";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white outline-none transition focus:border-cyan/60";

export type PlannerAccountOption = {
  id: string;
  username: string | null;
  nickname: string | null;
  privacyLevelOptions: string[];
  commentDisabled: boolean;
  duetDisabled: boolean;
  stitchDisabled: boolean;
};

export type PlannerItemDefaults = {
  id?: string;
  accountId: string;
  kind: SocialPlannerItemKind;
  caption: string;
  title: string | null;
  privacyLevel: string;
  disableComment: boolean;
  disableDuet: boolean;
  disableStitch: boolean;
  scheduledAtIso: string | null;
  mediaR2Key: string | null;
  mediaUrl: string | null;
  mediaMime: string | null;
  mediaBytes: number | null;
  calendarEventId: string | null;
  consentGiven: boolean;
};

function accountLabel(account: PlannerAccountOption) {
  if (account.username) return `@${account.username}`;
  if (account.nickname) return account.nickname;
  return "TikTok account";
}

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function PlannerComposeForm({
  action,
  accounts,
  defaults,
}: {
  action: (formData: FormData) => Promise<void>;
  accounts: PlannerAccountOption[];
  defaults?: PlannerItemDefaults;
}) {
  const [kind, setKind] = useState<SocialPlannerItemKind>(defaults?.kind ?? "VIDEO");
  const [accountId, setAccountId] = useState(defaults?.accountId ?? accounts[0]?.id ?? "");
  const [publishNow, setPublishNow] = useState(false);

  const account = useMemo(
    () => accounts.find((a) => a.id === accountId) ?? accounts[0],
    [accounts, accountId]
  );
  const privacyOptions = account?.privacyLevelOptions?.length
    ? account.privacyLevelOptions
    : ["SELF_ONLY"];

  if (accounts.length === 0) {
    return (
      <p className="font-body text-sm text-off-white/55">
        Connect a TikTok account first on the Accounts page.
      </p>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      {defaults?.id && <input type="hidden" name="id" value={defaults.id} />}
      <DeviceTimeZoneField />

      <label className="font-body text-sm text-off-white/70">
        TikTok account
        <select
          name={defaults ? undefined : "accountId"}
          required
          value={accountId}
          disabled={Boolean(defaults)}
          onChange={(e) => setAccountId(e.target.value)}
          className={`${fieldClass} mt-1`}
        >
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {accountLabel(a)}
            </option>
          ))}
        </select>
      </label>
      {defaults && <input type="hidden" name="accountId" value={accountId} />}

      <fieldset className="flex flex-wrap gap-3">
        <legend className="mb-1 font-body text-sm text-off-white/70">Type</legend>
        {(["VIDEO", "PHOTO", "LIVE"] as const).map((k) => (
          <label key={k} className="flex items-center gap-2 font-body text-sm text-off-white/80">
            <input
              type="radio"
              name={defaults ? undefined : "kind"}
              value={k}
              checked={kind === k}
              disabled={Boolean(defaults)}
              onChange={() => setKind(k)}
            />
            {plannerKindLabel(k)}
          </label>
        ))}
      </fieldset>
      {defaults && <input type="hidden" name="kind" value={kind} />}

      {kind === "LIVE" || kind === "PHOTO" ? (
        <label className="font-body text-sm text-off-white/70">
          Title
          <input
            name="title"
            defaultValue={defaults?.title ?? ""}
            placeholder={kind === "LIVE" ? "LIVE title" : "Photo title"}
            className={`${fieldClass} mt-1`}
          />
        </label>
      ) : null}

      <label className="font-body text-sm text-off-white/70">
        Caption
        <textarea
          name="caption"
          rows={4}
          defaultValue={defaults?.caption ?? ""}
          placeholder="Caption and hashtags"
          className={`${fieldClass} mt-1`}
        />
      </label>

      {kind === "VIDEO" && (
        <PlannerVideoUpload
          defaultKey={defaults?.mediaR2Key}
          defaultUrl={defaults?.mediaUrl}
          defaultMime={defaults?.mediaMime}
          defaultBytes={defaults?.mediaBytes}
        />
      )}
      {kind === "PHOTO" && (
        <ImageUploadField
          name="mediaUrl"
          folder="social-planner"
          defaultValue={defaults?.mediaUrl}
          label="Photo"
        />
      )}
      {kind === "LIVE" && (
        <p className="font-body text-xs text-off-white/45">
          TikTok cannot start a LIVE from the hub. This is a reminder. If you check the box below, it
          also appears on the hub calendar.
        </p>
      )}

      {kind !== "LIVE" && (
        <>
          <label className="font-body text-sm text-off-white/70">
            Who can view
            <select
              name="privacyLevel"
              defaultValue={
                defaults?.privacyLevel && privacyOptions.includes(defaults.privacyLevel)
                  ? defaults.privacyLevel
                  : privacyOptions.includes("SELF_ONLY")
                    ? "SELF_ONLY"
                    : privacyOptions[0]
              }
              className={`${fieldClass} mt-1`}
            >
              {privacyOptions.map((p) => (
                <option key={p} value={p}>
                  {plannerPrivacyLabel(p)}
                </option>
              ))}
            </select>
          </label>
          <p className="font-body text-xs text-off-white/40">
            Until TikTok audits this app, Direct Post is limited to private / only-me visibility.
          </p>
          <div className="flex flex-wrap gap-4 font-body text-sm text-off-white/70">
            <label className="flex items-center gap-2">
              <input type="checkbox" name="disableComment" defaultChecked={defaults?.disableComment ?? account?.commentDisabled} />
              Disable comments
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="disableDuet" defaultChecked={defaults?.disableDuet ?? account?.duetDisabled} />
              Disable duet
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="disableStitch" defaultChecked={defaults?.disableStitch ?? account?.stitchDisabled} />
              Disable stitch
            </label>
          </div>
        </>
      )}

      {kind === "LIVE" && (
        <label className="flex items-center gap-2 font-body text-sm text-off-white/80">
          <input type="checkbox" name="addToCalendar" defaultChecked={Boolean(defaults?.calendarEventId)} />
          Also add a LIVE event on the hub calendar
        </label>
      )}

      {kind !== "LIVE" && (
        <label className="flex items-center gap-2 font-body text-sm text-off-white/80">
          <input
            type="checkbox"
            name="publishNow"
            checked={publishNow}
            onChange={(e) => setPublishNow(e.target.checked)}
          />
          Publish now (instead of scheduling)
        </label>
      )}

      {!publishNow && (
        <label className="font-body text-sm text-off-white/70">
          Schedule for
          <input
            name="scheduledAt"
            type="datetime-local"
            defaultValue={toDatetimeLocal(defaults?.scheduledAtIso ?? null)}
            className={`${fieldClass} mt-1`}
          />
        </label>
      )}

      <label className="flex items-start gap-2 font-body text-sm text-off-white/80">
        <input type="checkbox" name="consent" defaultChecked={defaults?.consentGiven} className="mt-1" />
        <span>
          I confirm this content should be sent to TikTok for the selected account. TikTok requires
          explicit consent before Direct Post.
        </span>
      </label>

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          className="rounded-lg bg-orange px-6 py-2 font-body font-semibold text-off-white shadow-glow"
        >
          {publishNow ? "Publish now" : defaults ? "Save" : "Schedule"}
        </button>
        <button
          type="submit"
          name="saveDraft"
          value="on"
          className="rounded-lg border border-off-white/20 px-6 py-2 font-body text-sm text-off-white/80"
        >
          Save draft
        </button>
      </div>
    </form>
  );
}
