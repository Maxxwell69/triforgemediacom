"use client";

import { useMemo, useState } from "react";
import type { CampaignActionType, CampaignAudienceType, CampaignTriggerType } from "@prisma/client";
import { CAMPAIGN_AUDIENCES, CAMPAIGN_TRIGGERS } from "@/lib/campaigns/types";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60";

type Tag = { id: string; name: string };
type Group = { id: string; name: string };
type Level = { id: string; name: string };

type ActionDraft = {
  type: CampaignActionType;
  emailSubject: string;
  emailBodyText: string;
  notifyTitle: string;
  notifyBody: string;
  notifyHref: string;
};

export type CampaignFormInitial = {
  name: string;
  description: string;
  enabled: boolean;
  triggerType: CampaignTriggerType;
  days: string;
  triggerTagId: string;
  triggerLevelId: string;
  audienceType: CampaignAudienceType;
  audienceTagId: string;
  audienceGroupId: string;
  audienceTrack: string;
  oncePerUser: boolean;
  actions: ActionDraft[];
};

function emptyAction(type: CampaignActionType = "EMAIL"): ActionDraft {
  return {
    type,
    emailSubject: "",
    emailBodyText: "",
    notifyTitle: "",
    notifyBody: "",
    notifyHref: "",
  };
}

export default function CampaignForm({
  action,
  tags,
  groups,
  levels,
  initial,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  tags: Tag[];
  groups: Group[];
  levels: Level[];
  initial?: CampaignFormInitial;
  submitLabel: string;
}) {
  const [triggerType, setTriggerType] = useState<CampaignTriggerType>(
    initial?.triggerType ?? "FIRST_LOGIN"
  );
  const [audienceType, setAudienceType] = useState<CampaignAudienceType>(
    initial?.audienceType ?? "ALL_MEMBERS"
  );
  const [oncePerUser, setOncePerUser] = useState(initial?.oncePerUser ?? true);
  const [actions, setActions] = useState<ActionDraft[]>(
    initial?.actions?.length ? initial.actions : [emptyAction("EMAIL")]
  );

  const triggerMeta = CAMPAIGN_TRIGGERS.find((t) => t.type === triggerType);
  const actionsJson = useMemo(() => JSON.stringify(actions), [actions]);

  function updateAction(index: number, patch: Partial<ActionDraft>) {
    setActions((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  return (
    <form action={action} className="glass mt-8 flex flex-col gap-6 rounded-2xl p-6">
      <div>
        <label className="font-body text-xs uppercase tracking-wide text-off-white/45">Name</label>
        <input
          name="name"
          required
          defaultValue={initial?.name}
          placeholder="Welcome to the hub"
          className={`${fieldClass} mt-1`}
        />
      </div>
      <div>
        <label className="font-body text-xs uppercase tracking-wide text-off-white/45">
          Description (admin only)
        </label>
        <textarea
          name="description"
          rows={2}
          defaultValue={initial?.description}
          className={`${fieldClass} mt-1`}
        />
      </div>

      <label className="flex items-center gap-2 font-body text-sm text-off-white/80">
        <input type="checkbox" name="enabled" defaultChecked={initial?.enabled ?? true} />
        Campaign is on
      </label>

      <div>
        <label className="font-body text-xs uppercase tracking-wide text-off-white/45">Trigger</label>
        <select
          name="triggerType"
          value={triggerType}
          onChange={(e) => setTriggerType(e.target.value as CampaignTriggerType)}
          className={`${fieldClass} mt-1`}
        >
          {CAMPAIGN_TRIGGERS.map((t) => (
            <option key={t.type} value={t.type}>
              {t.label}
            </option>
          ))}
        </select>
        {triggerMeta ? (
          <p className="mt-1 font-body text-xs text-off-white/40">
            GHL analog: {triggerMeta.ghlAnalog}. {triggerMeta.description}
          </p>
        ) : null}
      </div>

      {triggerMeta?.timed ? (
        <div>
          <label className="font-body text-xs uppercase tracking-wide text-off-white/45">Days</label>
          <input
            name="days"
            type="number"
            min={1}
            max={365}
            defaultValue={initial?.days || "7"}
            className={`${fieldClass} mt-1 max-w-[8rem]`}
          />
        </div>
      ) : (
        <input type="hidden" name="days" value="" />
      )}

      {triggerType === "TAG_ADDED" ? (
        <div>
          <label className="font-body text-xs uppercase tracking-wide text-off-white/45">
            Only this tag (optional)
          </label>
          <select name="triggerTagId" defaultValue={initial?.triggerTagId || ""} className={`${fieldClass} mt-1`}>
            <option value="">Any tag</option>
            {tags.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <input type="hidden" name="triggerTagId" value="" />
      )}

      {triggerType === "LEVEL_REACHED" ? (
        <div>
          <label className="font-body text-xs uppercase tracking-wide text-off-white/45">
            Only this level (optional)
          </label>
          <select
            name="triggerLevelId"
            defaultValue={initial?.triggerLevelId || ""}
            className={`${fieldClass} mt-1`}
          >
            <option value="">Any level change</option>
            {levels.map((level) => (
              <option key={level.id} value={level.id}>
                {level.name}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <input type="hidden" name="triggerLevelId" value="" />
      )}

      <div>
        <label className="font-body text-xs uppercase tracking-wide text-off-white/45">
          Audience filter
        </label>
        <select
          name="audienceType"
          value={audienceType}
          onChange={(e) => setAudienceType(e.target.value as CampaignAudienceType)}
          className={`${fieldClass} mt-1`}
        >
          {CAMPAIGN_AUDIENCES.map((a) => (
            <option key={a.type} value={a.type}>
              {a.label}
            </option>
          ))}
        </select>
      </div>

      {audienceType === "TAG" ? (
        <select name="audienceTagId" defaultValue={initial?.audienceTagId || tags[0]?.id} className={fieldClass}>
          {tags.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      ) : (
        <input type="hidden" name="audienceTagId" value="" />
      )}

      {audienceType === "GROUP" ? (
        <select
          name="audienceGroupId"
          defaultValue={initial?.audienceGroupId || groups[0]?.id}
          className={fieldClass}
        >
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      ) : (
        <input type="hidden" name="audienceGroupId" value="" />
      )}

      {audienceType === "NETWORK_TRACK" ? (
        <select name="audienceTrack" defaultValue={initial?.audienceTrack || "CN"} className={fieldClass}>
          <option value="CN">Creator Network</option>
          <option value="MN">Media Network</option>
        </select>
      ) : (
        <input type="hidden" name="audienceTrack" value="" />
      )}

      <label className="flex items-center gap-2 font-body text-sm text-off-white/80">
        <input
          type="checkbox"
          checked={oncePerUser}
          onChange={(e) => setOncePerUser(e.target.checked)}
        />
        Run once per member (uncheck to allow repeats — live sessions, weekly inactive, etc.)
      </label>
      <input type="hidden" name="oncePerUser" value={oncePerUser ? "on" : "off"} />

      <div>
        <div className="flex items-center justify-between gap-3">
          <p className="font-display text-lg tracking-wide text-off-white/85">Actions</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActions((prev) => [...prev, emptyAction("EMAIL")])}
              className="rounded-lg border border-off-white/20 px-3 py-1 font-body text-xs text-off-white/70 hover:border-cyan/40"
            >
              + Email
            </button>
            <button
              type="button"
              onClick={() => setActions((prev) => [...prev, emptyAction("HUB_NOTIFY")])}
              className="rounded-lg border border-off-white/20 px-3 py-1 font-body text-xs text-off-white/70 hover:border-cyan/40"
            >
              + Hub notify
            </button>
            <button
              type="button"
              onClick={() => setActions((prev) => [...prev, emptyAction("ADMIN_NOTIFY")])}
              className="rounded-lg border border-off-white/20 px-3 py-1 font-body text-xs text-off-white/70 hover:border-cyan/40"
            >
              + Notify admins
            </button>
          </div>
        </div>
        <p className="mt-1 font-body text-xs text-off-white/40">
          Placeholders: {"{{name}}"}, {"{{email}}"}, {"{{level}}"}, {"{{url}}"}. Member emails respect
          broadcast opt-out. Hub notifications always deliver in-app.
        </p>
        <input type="hidden" name="actionsJson" value={actionsJson} />
        <div className="mt-4 flex flex-col gap-4">
          {actions.map((row, index) => (
            <div key={index} className="rounded-xl border border-off-white/10 bg-off-white/[0.03] p-4">
              <div className="flex items-center justify-between gap-3">
                <select
                  value={row.type}
                  onChange={(e) => updateAction(index, { type: e.target.value as CampaignActionType })}
                  className={`${fieldClass} max-w-[14rem]`}
                >
                  <option value="EMAIL">Email member</option>
                  <option value="HUB_NOTIFY">Hub notification</option>
                  <option value="ADMIN_NOTIFY">Notify admins</option>
                </select>
                {actions.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => setActions((prev) => prev.filter((_, i) => i !== index))}
                    className="font-body text-xs text-orange hover:underline"
                  >
                    Remove
                  </button>
                ) : null}
              </div>
              {row.type === "EMAIL" ? (
                <div className="mt-3 flex flex-col gap-3">
                  <input
                    value={row.emailSubject}
                    onChange={(e) => updateAction(index, { emailSubject: e.target.value })}
                    placeholder="Subject"
                    className={fieldClass}
                  />
                  <textarea
                    value={row.emailBodyText}
                    onChange={(e) => updateAction(index, { emailBodyText: e.target.value })}
                    rows={6}
                    placeholder={"Hi {{name}},\n\nWelcome into the hub..."}
                    className={fieldClass}
                  />
                </div>
              ) : (
                <div className="mt-3 flex flex-col gap-3">
                  <input
                    value={row.notifyTitle}
                    onChange={(e) => updateAction(index, { notifyTitle: e.target.value })}
                    placeholder="Title"
                    className={fieldClass}
                  />
                  <textarea
                    value={row.notifyBody}
                    onChange={(e) => updateAction(index, { notifyBody: e.target.value })}
                    rows={4}
                    placeholder="Short in-hub message"
                    className={fieldClass}
                  />
                  <input
                    value={row.notifyHref}
                    onChange={(e) => updateAction(index, { notifyHref: e.target.value })}
                    placeholder="Optional link, e.g. /home or /admin/users/…"
                    className={fieldClass}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <button
        type="submit"
        className="self-start rounded-lg bg-orange px-5 py-2 font-body text-sm font-semibold text-off-white transition hover:brightness-110"
      >
        {submitLabel}
      </button>
    </form>
  );
}
