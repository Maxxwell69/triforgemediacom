import LocalWhen from "@/components/LocalWhen";
import MemberAvatar from "@/components/MemberAvatar";
import { getMemberAvatarUrl, getMemberDisplayName, getMemberInitial } from "@/lib/memberDisplay";
import { groupInterviewSlots, interviewNetworkLabel } from "@/lib/hubCampaignSlots";
import { joinHubCampaignSlot } from "@/app/(community)/campaigns/actions";

type SlotUser = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  profile: {
    socialLinks: unknown;
    username: string | null;
    showRealName: boolean | null;
  } | null;
  tiktokConnection: { displayName: string | null; avatarUrl: string | null } | null;
  tiktokStatsSnapshot: {
    nickname: string | null;
    avatarUrl: string | null;
    uniqueId?: string;
  } | null;
};

type BoardSlot = {
  id: string;
  startsAt: Date;
  endsAt: Date;
  network: string | null;
  position: number;
  signup: {
    userId: string;
    user: SlotUser;
  } | null;
};

export default function InterviewSpotsBoard({
  campaignId,
  slots,
  currentUserId,
  canClaim,
}: {
  campaignId: string;
  slots: BoardSlot[];
  currentUserId: string;
  canClaim: boolean;
}) {
  if (slots.length === 0) {
    return (
      <p className="font-body text-sm text-off-white/50">
        No interview spots are posted yet. Check back when the time, network, and spots go up.
      </p>
    );
  }

  const groups = groupInterviewSlots(slots);
  const mySlot = slots.find((slot) => slot.signup?.userId === currentUserId);
  const myGroup = mySlot
    ? groups.find((group) => group.slots.some((slot) => slot.id === mySlot.id))
    : null;
  const mySpotNumber = mySlot && myGroup
    ? myGroup.slots.findIndex((slot) => slot.id === mySlot.id) + 1
    : 0;

  return (
    <div className="flex flex-col gap-6">
      {mySlot && mySpotNumber > 0 && (
        <p className="font-body text-sm text-cyan">
          Your spot: {interviewNetworkLabel(mySlot.network) ? `${interviewNetworkLabel(mySlot.network)} · ` : ""}
          Spot {mySpotNumber} ·{" "}
          <LocalWhen startsAt={mySlot.startsAt.toISOString()} endsAt={mySlot.endsAt.toISOString()} />
        </p>
      )}
      {groups.map((group) => {
        const booked = group.slots.filter((s) => s.signup).length;
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
            <ul className="mt-3 flex flex-col gap-2">
              {group.slots.map((slot, index) => {
                const bookedBy = slot.signup?.user;
                const isMine = slot.signup?.userId === currentUserId;
                const open = !slot.signup;
                return (
                  <li
                    key={slot.id}
                    className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 ${
                      isMine
                        ? "border-cyan/40 bg-cyan/10"
                        : "border-off-white/10"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      {bookedBy ? (
                        <MemberAvatar
                          avatarUrl={getMemberAvatarUrl(bookedBy)}
                          initial={getMemberInitial(bookedBy)}
                          size={32}
                          textSize="text-xs"
                        />
                      ) : (
                        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-off-white/20 font-body text-xs text-off-white/35">
                          {index + 1}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="font-body text-sm text-off-white">
                          Spot {index + 1}
                          {isMine ? " (you)" : ""}
                        </p>
                        <p className="truncate font-body text-xs text-off-white/45">
                          {bookedBy ? getMemberDisplayName(bookedBy) : "Open"}
                        </p>
                      </div>
                    </div>
                    {open && canClaim && (
                      <form
                        action={async () => {
                          "use server";
                          await joinHubCampaignSlot(campaignId, slot.id);
                        }}
                      >
                        <button
                          type="submit"
                          className="rounded-lg bg-orange px-3 py-1.5 font-body text-xs font-semibold text-off-white shadow-glow"
                        >
                          Take spot
                        </button>
                      </form>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
