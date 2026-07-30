"use client";

import { useState } from "react";
import { useParticipants } from "@livekit/components-react";
import WebinarChat from "@/components/webinars/WebinarChat";
import WebinarParticipants from "@/components/webinars/WebinarParticipants";

type Tab = "chat" | "people";

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
  const participants = useParticipants();

  return (
    <div className="flex h-full min-h-0 max-h-full flex-col overflow-hidden bg-charcoal/80">
      <div className="flex shrink-0 border-b border-off-white/10">
        <button
          type="button"
          onClick={() => setTab("chat")}
          className={`flex-1 px-3 py-3 font-display text-sm tracking-wide transition ${
            tab === "chat"
              ? "border-b-2 border-orange text-off-white"
              : "text-off-white/40 hover:text-off-white/70"
          }`}
        >
          Chat
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

      <div className="min-h-0 flex-1 overflow-hidden">
        {tab === "chat" ? (
          <WebinarChat
            webinarId={webinarId}
            canSend={canSendChat}
            canModerate={canModerate}
            currentUserId={currentUserId}
            embedded
          />
        ) : (
          <WebinarParticipants
            webinarId={webinarId}
            canModerate={canModerate}
            designatedHostUserId={designatedHostUserId}
          />
        )}
      </div>
    </div>
  );
}
