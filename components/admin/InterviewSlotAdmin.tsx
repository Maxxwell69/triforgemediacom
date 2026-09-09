import DeviceTimeZoneField from "@/components/DeviceTimeZoneField";
import LocalWhen from "@/components/LocalWhen";
import { INTERVIEW_SLOT_DURATIONS } from "@/lib/validations/hubCampaign";
import { createHubCampaignSlot, deleteHubCampaignSlot } from "@/app/admin/hub-campaigns/actions";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white outline-none focus:border-cyan/60";

type SlotRow = {
  id: string;
  startsAt: Date;
  endsAt: Date;
  bookedBy: string | null;
};

export default function InterviewSlotAdmin({
  campaignId,
  slots,
}: {
  campaignId: string;
  slots: SlotRow[];
}) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-2xl tracking-wide text-off-white/80">
        Interview times
      </h2>
      <p className="mt-1 font-body text-sm text-off-white/50">
        Post times members can book, same idea as staff booking. Each slot is one person.
      </p>
      <div className="glass mt-4 flex flex-col gap-4 rounded-2xl p-6">
        <form
          action={createHubCampaignSlot.bind(null, campaignId)}
          className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_8rem_auto]"
        >
          <DeviceTimeZoneField />
          <label className="font-body text-sm text-off-white/70">
            Start
            <input name="startsAt" type="datetime-local" required className={`${fieldClass} mt-1`} />
          </label>
          <label className="font-body text-sm text-off-white/70">
            Length
            <select name="durationMins" defaultValue="30" className={`${fieldClass} mt-1`}>
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
            Add time
          </button>
        </form>

        {slots.length === 0 ? (
          <p className="font-body text-sm text-off-white/40">No times posted yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {slots.map((slot) => (
              <li
                key={slot.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-off-white/10 px-3 py-2"
              >
                <div>
                  <p className="font-body text-sm text-off-white">
                    <LocalWhen
                      startsAt={slot.startsAt.toISOString()}
                      endsAt={slot.endsAt.toISOString()}
                    />
                  </p>
                  <p className="font-body text-xs text-off-white/45">
                    {slot.bookedBy ? `Booked by ${slot.bookedBy}` : "Open"}
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
        )}
      </div>
    </section>
  );
}
