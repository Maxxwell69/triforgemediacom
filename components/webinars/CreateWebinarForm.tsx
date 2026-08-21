"use client";

import { useState, useTransition } from "react";
import { createWebinarAction } from "@/app/admin/webinars/actions";
import ImageUploadField from "@/components/ImageUploadField";
import DeviceTimeZoneField from "@/components/DeviceTimeZoneField";
import { WEBINAR_AUDIENCE_OPTIONS, WEEKDAY_OPTIONS } from "@/lib/validations/webinar";
import { attachDeviceTimeZone } from "@/lib/timeClient";

export default function CreateWebinarForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [formKey, setFormKey] = useState(0);
  const [repeatWeekly, setRepeatWeekly] = useState(false);

  return (
    <form
      key={formKey}
      className="mt-4 flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData(form);
        attachDeviceTimeZone(formData, ["scheduledAt"]);
        setError(null);
        setSuccess(null);
        startTransition(async () => {
          const result = await createWebinarAction(formData);
          if (result.error) {
            setError(result.error);
            return;
          }
          const count = result.count ?? 1;
          setSuccess(
            count > 1
              ? `Created ${count} sessions for this week’s series.`
              : "Webinar created."
          );
          setRepeatWeekly(false);
          setFormKey((k) => k + 1);
        });
      }}
    >
      <label className="flex flex-col gap-1 font-body text-sm text-off-white/70">
        Title
        <input
          name="title"
          required
          maxLength={120}
          className="rounded-lg border border-off-white/15 bg-charcoal px-3 py-2 text-off-white outline-none focus:border-orange"
          placeholder="Creator Kickoff Live"
        />
      </label>

      <label className="flex flex-col gap-1 font-body text-sm text-off-white/70">
        Description
        <textarea
          name="description"
          rows={3}
          maxLength={2000}
          className="rounded-lg border border-off-white/15 bg-charcoal px-3 py-2 text-off-white outline-none focus:border-orange"
          placeholder="What members can expect…"
        />
      </label>

      <ImageUploadField name="hostAvatarUrl" folder="host-avatars" label="Host avatar" />

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 font-body text-sm text-off-white/70">
          Scheduled for
          <input
            name="scheduledAt"
            type="datetime-local"
            required
            className="rounded-lg border border-off-white/15 bg-charcoal px-3 py-2 text-off-white outline-none focus:border-orange"
          />
          <span className="text-xs text-off-white/45">Your device timezone</span>
          <DeviceTimeZoneField />
        </label>
        <label className="flex flex-col gap-1 font-body text-sm text-off-white/70">
          Publish status
          <select
            name="status"
            defaultValue="SCHEDULED"
            className="rounded-lg border border-off-white/15 bg-charcoal px-3 py-2 text-off-white outline-none focus:border-orange"
          >
            <option value="SCHEDULED">Scheduled</option>
            <option value="DRAFT">Draft (hidden until published)</option>
          </select>
        </label>
      </div>

      <div className="rounded-lg border border-off-white/10 bg-charcoal/60 px-3 py-3">
        <label className="flex items-start gap-3 font-body text-sm text-off-white/70">
          <input
            type="checkbox"
            name="repeatWeekly"
            checked={repeatWeekly}
            onChange={(e) => setRepeatWeekly(e.target.checked)}
            className="mt-1 accent-orange"
          />
          <span>
            <span className="font-semibold text-off-white">Repeat weekly</span>
            <span className="mt-0.5 block text-xs text-off-white/45">
              Creates a separate webinar for each selected day so members see sessions throughout
              the week.
            </span>
          </span>
        </label>
        {repeatWeekly && (
          <div className="mt-3 flex flex-col gap-3 pl-7">
            <div>
              <p className="font-body text-xs text-off-white/50">Days</p>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {WEEKDAY_OPTIONS.map((day) => (
                  <label
                    key={day.value}
                    className="inline-flex items-center gap-1.5 rounded-md border border-off-white/15 px-2 py-1 font-body text-xs text-off-white/80"
                  >
                    <input
                      type="checkbox"
                      name="repeatDay"
                      value={day.value}
                      defaultChecked={day.value >= 1 && day.value <= 5}
                      className="accent-orange"
                    />
                    {day.label}
                  </label>
                ))}
              </div>
            </div>
            <label className="flex max-w-[12rem] flex-col gap-1 font-body text-xs text-off-white/50">
              For how many weeks
              <input
                name="repeatWeeks"
                type="number"
                min={1}
                max={12}
                defaultValue={4}
                className="rounded-lg border border-off-white/15 bg-charcoal px-3 py-2 font-body text-sm text-off-white outline-none focus:border-orange"
              />
            </label>
          </div>
        )}
      </div>

      <label className="flex flex-col gap-1 font-body text-sm text-off-white/70">
        Audience
        <select
          name="audience"
          defaultValue="ALL"
          className="rounded-lg border border-off-white/15 bg-charcoal px-3 py-2 text-off-white outline-none focus:border-orange"
        >
          {WEBINAR_AUDIENCE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="text-xs text-off-white/45">
          Who can see and join this webinar in the hub. Admins always see every webinar.
        </span>
      </label>

      <label className="flex items-start gap-3 rounded-lg border border-off-white/10 bg-charcoal/60 px-3 py-3 font-body text-sm text-off-white/70">
        <input
          type="checkbox"
          name="externalSignupEnabled"
          className="mt-1 accent-orange"
        />
        <span>
          <span className="font-semibold text-off-white">Outside-network webinar</span>
          <span className="mt-0.5 block text-xs text-off-white/45">
            Creates a secure public signup page for non-members only. This webinar will not appear
            in the hub for members — share the invite link after create.
          </span>
        </span>
      </label>

      {error && <p className="font-body text-sm text-orange">{error}</p>}
      {success && <p className="font-body text-sm text-cyan">{success}</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 w-fit rounded-lg bg-orange px-4 py-2 font-body text-sm font-semibold text-charcoal shadow-glow transition hover:brightness-110 disabled:opacity-60"
      >
        {pending ? "Creating…" : repeatWeekly ? "Create weekly series" : "Create webinar"}
      </button>
    </form>
  );
}
