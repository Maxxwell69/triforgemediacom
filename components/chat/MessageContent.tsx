import { parseMentionSegments } from "@/lib/chatMentions";
import StartDmName from "@/components/chat/StartDmName";

export default function MessageContent({
  content,
  imageUrl,
  currentUserId,
  canStartDm = false,
}: {
  content: string;
  imageUrl?: string | null;
  currentUserId: string;
  canStartDm?: boolean;
}) {
  const trimmed = content.trim();
  const segments = trimmed ? parseMentionSegments(trimmed) : [];

  return (
    <div className="flex flex-col gap-2">
      {trimmed ? (
        <p className="whitespace-pre-wrap break-words font-body text-sm text-off-white/85">
          {segments.map((seg, i) =>
            seg.type === "mention" ? (
              <StartDmName
                key={`${seg.userId}-${i}`}
                userId={seg.userId}
                currentUserId={currentUserId}
                canStartDm={canStartDm}
                className="rounded bg-cyan/15 px-1 font-semibold text-cyan transition hover:bg-cyan/25"
              >
                @{seg.name}
              </StartDmName>
            ) : (
              <span key={i}>{seg.value}</span>
            )
          )}
        </p>
      ) : null}
      {imageUrl ? (
        <a
          href={imageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-0.5 inline-block max-w-full"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="Chat attachment"
            className="max-h-80 max-w-full rounded-xl border border-off-white/10 object-contain"
          />
        </a>
      ) : null}
    </div>
  );
}
