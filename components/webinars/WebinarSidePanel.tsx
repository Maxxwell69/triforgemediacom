"use client";

import { useState } from "react";
import { useParticipants } from "@livekit/components-react";
import WebinarChat from "@/components/webinars/WebinarChat";
import WebinarParticipants from "@/components/webinars/WebinarParticipants";

type Tab = "chat" | "people";

function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      className="ml-1.5 inline-flex min-w-[1.15rem] items-center justify-center rounded-full bg-red-500 px-1 py-0.5 font-body text-[10px] font-bold leading-none text-white"
      aria-label={`${count} unread message${count === 1 ? "" : "s"}`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

export default function WebinarSidePanel({
  webinarId,
  canSendChat,
  canModerate,
  currentUserId,
  designatedHostUserId,
}: {
  webinarId: string;
  canSendChat: boolean;
  canModerate: boolean;
  currentUserId: string;
  designatedHostUserId?: string | null;
}) {
  const [tab, setTab] = useState<Tab>("chat");
  const [chatUnread, setChatUnread] = useState(0);
  const participants = useParticipants();

  return (
    <div className="flex h-full min-h-0 max-h-full flex-col overflow-hidden bg-charcoal/80">
      <div className="flex shrink-0 border-b border-off-white/10">
        <button
          type="button"
          onClick={() => setTab("chat")}
          className={`flex flex-1 items-center justify-center px-3 py-3 font-display text-sm tracking-wide transition ${
            tab === "chat"
              ? "border-b-2 border-orange text-off-white"
              : "text-off-white/40 hover:text-off-white/70"
          }`}
        >
          Chat
          <UnreadBadge count={chatUnread} />
        </button>
        <button
          type="button"
          onClick={() => setTab("people")}
          className={`flex-1 px-3 py-3 font-display text-sm tracking-wide transition ${
            tab === "people"
              ? "border-b-2 border-orange text-off-white"
              : "text-off-white/40 hover:text-off-white/70"
          }`}
        >
          People ({participants.length})
        </button>
      </div>

      {/* Keep Chat mounted while on People so polling continues and unread can update. */}
      <div className={`min-h-0 flex-1 overflow-hidden ${tab === "chat" ? "" : "hidden"}`}>
        <WebinarChat
          webinarId={webinarId}
          canSend={canSendChat}
          canModerate={canModerate}
          currentUserId={currentUserId}
          embedded
          active={tab === "chat"}
          onUnreadChange={setChatUnread}
        />
      </div>
      <div className={`min-h-0 flex-1 overflow-hidden ${tab === "people" ? "" : "hidden"}`}>
        <WebinarParticipants
          webinarId={webinarId}
          canModerate={canModerate}
          designatedHostUserId={designatedHostUserId}
        />
      </div>
    </div>
  );
}
