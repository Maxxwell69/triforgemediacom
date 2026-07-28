import Link from "next/link";
import { parseMentionSegments } from "@/lib/chatMentions";

export default function MessageContent({ content }: { content: string }) {
  const segments = parseMentionSegments(content);
  return (
    <p className="whitespace-pre-wrap break-words font-body text-sm text-off-white/85">
      {segments.map((seg, i) =>
        seg.type === "mention" ? (
          <Link
            key={`${seg.userId}-${i}`}
            href={`/members/${seg.userId}`}
            className="rounded bg-cyan/15 px-1 font-semibold text-cyan transition hover:bg-cyan/25"
          >
            @{seg.name}
          </Link>
        ) : (
          <span key={i}>{seg.value}</span>
        )
      )}
    </p>
  );
}
