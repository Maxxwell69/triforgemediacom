"use client";

import DeviceTimeZoneField from "@/components/DeviceTimeZoneField";
import LocalWhen from "@/components/LocalWhen";
import {
  INTERVIEW_NETWORKS,
  INTERVIEW_SLOT_DURATIONS,
} from "@/lib/validations/hubCampaign";
import { PLATFORM_LABELS } from "@/lib/platforms";
import { attachDeviceTimeZone } from "@/lib/timeClient";
import { interviewNetworkLabel, groupInterviewSlots } from "@/lib/hubCampaignSlots";
import { createHubCampaignSlot, deleteHubCampaignSlot } from "@/app/admin/hub-campaigns/actions";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white outline-none focus:border-cyan/60";

type SlotRow = {
  id: string;
  startsAt: Date;
  endsAt: Date;
  network: string | null;
  position: number;
  bookedBy: string | null;
};

export default function InterviewSlotAdmin({
  campaignId,
  slots,
}: {
  campaignId: string;
  slots: SlotRow[];
}) {
  const groups = groupInterviewSlots(slots);

  return (
    <section className="mt-10">
      <h2 className="font-display text-2xl tracking-wide text-off-white/80">
        Interview spots
      </h2>
      <p className="mt-1 font-body text-sm text-off-white/50">
        Set the time, network, and how many spots. Members who sign up take the next open one.
      </p>
      <div className="glass mt-4 flex flex-col gap-4 rounded-2xl p-6">
        <form
          action={async (formData) => {
            attachDeviceTimeZone(formData, ["startsAt"]);
            await createHubCampaignSlot(campaignId, formData);
          }}
          className="flex flex-col gap-3"
        >
          <DeviceTimeZoneField />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1.2fr_8rem_7rem_6rem_auto]">
          <label className="font-body text-sm text-off-white/70">
            Time
            <input name="startsAt" type="datetime-local" required className={`${fieldClass} mt-1`} />
          </label>
          <label className="font-body text-sm text-off-white/70">
            Network
            <select name="network" defaultValue="TIKTOK" required className={`${fieldClass} mt-1`}>
              {INTERVIEW_NETWORKS.map((network) => (
                <option key={network} value={network}>
                  {PLATFORM_LABELS[network]}
                </option>
              ))}
            </select>
          </label>
          <label className="font-body text-sm text-off-white/70">
            Spots
            <input
              name="slotCount"
              type="number"
              min={1}
              max={50}
              defaultValue={8}
              required
              className={`${fieldClass} mt-1`}
            />
          </label>
          <label className="font-body text-sm text-off-white/70">
            Length
            <select name="durationMins" defaultValue="60" className={`${fieldClass} mt-1`}>
              {INTERVIEW_SLOT_DURATIONS.map((mins) => (
                <option key={mins} value={mins}>
                  {mins} min
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="self-end rounded-lg bg-orange px-4 py-2 font-body text-sm font-semibold text-off-white shadow-glow"
          >
            Post spots
          </button>
          </div>
        </form>

        {slots.length === 0 ? (
          <p className="font-body text-sm text-off-white/40">No interview spots posted yet.</p>
        ) : (
          <div className="flex flex-col gap-5">
            {groups.map((group) => {
              const booked = group.slots.filter((s) => s.bookedBy).length;
              const networkLabel = interviewNetworkLabel(group.network);
              return (
                <div key={group.key}>
                  <p className="font-body text-sm font-medium text-off-white">
                    {networkLabel ? `${networkLabel} · ` : ""}
                    <LocalWhen
                      startsAt={group.startsAt.toISOString()}
                      endsAt={group.endsAt.toISOString()}
                    />
                  </p>
                  <p className="mt-0.5 font-body text-xs text-off-white/45">
                    {booked}/{group.slots.length} booked
                  </p>
                  <ul className="mt-2 flex flex-col gap-2">
                    {group.slots.map((slot, index) => (
                      <li
                        key={slot.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-off-white/10 px-3 py-2"
                      >
                        <div>
                          <p className="font-body text-sm text-off-white">
                            Spot {index + 1}
                            {slot.bookedBy ? (
                              <span className="text-off-white/70"> · {slot.bookedBy}</span>
                            ) : (
                              <span className="text-off-white/40"> · Open</span>
                            )}
                          </p>
                        </div>
                        {!slot.bookedBy && (
                          <form action={deleteHubCampaignSlot.bind(null, slot.id)}>
                            <button
                              type="submit"
                              className="font-body text-xs text-orange hover:underline"
                            >
                              Remove
                            </button>
                          </form>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
