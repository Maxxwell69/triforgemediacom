"use client";

import { useState } from "react";
import type { HubCampaignAudienceType, HubCampaignCategory, HubCampaignStatus } from "@prisma/client";
import DeviceTimeZoneField from "@/components/DeviceTimeZoneField";
import { attachDeviceTimeZone } from "@/lib/timeClient";
import {
  HUB_CAMPAIGN_AUDIENCES,
  HUB_CAMPAIGN_CATEGORIES,
  HUB_CAMPAIGN_STATUSES,
} from "@/lib/hubCampaigns";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60";

type Option = { id: string; name: string };

export type HubCampaignFormInitial = {
  title: string;
  description: string;
  category: HubCampaignCategory;
  status: HubCampaignStatus;
  startsAtIso: string | null;
  endsAtIso: string | null;
  location: string;
  audienceType: HubCampaignAudienceType;
  audienceTagId: string;
  audienceBadgeId: string;
  capacity: string;
};

function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function HubCampaignForm({
  action,
  tags,
  badges,
  initial,
  submitLabel,
  campaignId,
}: {
  action: (formData: FormData) => void | Promise<void>;
  tags: Option[];
  badges: Option[];
  initial?: HubCampaignFormInitial;
  submitLabel: string;
  campaignId?: string;
}) {
  const [audienceType, setAudienceType] = useState<HubCampaignAudienceType>(
    initial?.audienceType ?? "ALL_MEMBERS"
  );

  return (
    <form
      className="flex flex-col gap-3"
      action={async (formData) => {
        attachDeviceTimeZone(formData, ["startsAt", "endsAt"]);
        await action(formData);
      }}
    >
      {campaignId ? <input type="hidden" name="id" value={campaignId} /> : null}
      <DeviceTimeZoneField />

      <input
        name="title"
        required
        defaultValue={initial?.title}
        placeholder="Campaign title"
        className={fieldClass}
      />
      <textarea
        name="description"
        rows={4}
        defaultValue={initial?.description}
        placeholder="What we need to do — brief, goals, or agenda"
        className={fieldClass}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="font-body text-sm text-off-white/70">
          Category
          <select
            name="category"
            defaultValue={initial?.category ?? "MEETING"}
            className={`${fieldClass} mt-1`}
          >
            {HUB_CAMPAIGN_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.icon} {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="font-body text-sm text-off-white/70">
          Status
          <select
            name="status"
            defaultValue={initial?.status ?? "OPEN"}
            className={`${fieldClass} mt-1`}
          >
            {HUB_CAMPAIGN_STATUSES.filter((s) => s.value !== "ARCHIVED" || initial?.status === "ARCHIVED").map(
              (s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              )
            )}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="font-body text-sm text-off-white/70">
          Starts
          <input
            name="startsAt"
            type="datetime-local"
            defaultValue={toLocalInput(initial?.startsAtIso ?? null)}
            className={`${fieldClass} mt-1`}
          />
        </label>
        <label className="font-body text-sm text-off-white/70">
          Ends
          <input
            name="endsAt"
            type="datetime-local"
            defaultValue={toLocalInput(initial?.endsAtIso ?? null)}
            className={`${fieldClass} mt-1`}
          />
        </label>
      </div>

      <input
        name="location"
        defaultValue={initial?.location}
        placeholder="Location or link (optional)"
        className={fieldClass}
      />

      <label className="font-body text-sm text-off-white/70">
        Who can sign up
        <select
          name="audienceType"
          value={audienceType}
          onChange={(e) => setAudienceType(e.target.value as HubCampaignAudienceType)}
          className={`${fieldClass} mt-1`}
        >
          {HUB_CAMPAIGN_AUDIENCES.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </select>
      </label>

      {audienceType === "TAG" && (
        <label className="font-body text-sm text-off-white/70">
          Tag
          <select
            name="audienceTagId"
            defaultValue={initial?.audienceTagId ?? ""}
            required
            className={`${fieldClass} mt-1`}
          >
            <option value="">Select a tag</option>
            {tags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </select>
        </label>
      )}

      {audienceType === "BADGE" && (
        <label className="font-body text-sm text-off-white/70">
          Badge
          <select
            name="audienceBadgeId"
            defaultValue={initial?.audienceBadgeId ?? ""}
            required
            className={`${fieldClass} mt-1`}
          >
            <option value="">Select a badge</option>
            {badges.map((badge) => (
              <option key={badge.id} value={badge.id}>
                {badge.name}
              </option>
            ))}
          </select>
        </label>
      )}

      {audienceType !== "TAG" && <input type="hidden" name="audienceTagId" value="" />}
      {audienceType !== "BADGE" && <input type="hidden" name="audienceBadgeId" value="" />}

      <label className="font-body text-sm text-off-white/70">
        Capacity (optional)
        <input
          name="capacity"
          type="number"
          min={1}
          max={5000}
          defaultValue={initial?.capacity}
          placeholder="No limit"
          className={`${fieldClass} mt-1`}
        />
      </label>

      <button
        type="submit"
        className="self-start rounded-lg bg-orange px-6 py-2 font-body font-semibold text-off-white shadow-glow transition hover:brightness-110"
      >
        {submitLabel}
      </button>
    </form>
  );
}
