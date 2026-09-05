import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdminPage } from "@/lib/session";
import { getMemberDisplayName } from "@/lib/memberDisplay";
import { requireSupportModule } from "@/lib/supportReads";
import { markSuggestionsRead } from "@/lib/suggestionReads";
import { SUGGESTION_STATUS_LABELS, SUGGESTION_STATUS_SORT_ORDER } from "@/lib/suggestions";
import SuggestionAdminRow from "@/components/admin/SuggestionAdminRow";

export const dynamic = "force-dynamic";

export default async function AdminSuggestionsPage() {
  requireSupportModule();
  const admin = await requireAdminPage();
  await markSuggestionsRead(admin.id).catch(() => {});

  const suggestions = await prisma.suggestion.findMany({
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          profile: { select: { socialLinks: true, username: true, showRealName: true } },
          tiktokConnection: { select: { displayName: true, avatarUrl: true } },
          tiktokStatsSnapshot: { select: { nickname: true, avatarUrl: true, uniqueId: true } },
        },
      },
    },
  });

  suggestions.sort((a, b) => {
    const statusDiff =
      (SUGGESTION_STATUS_SORT_ORDER[a.status] ?? 99) -
      (SUGGESTION_STATUS_SORT_ORDER[b.status] ?? 99);
    if (statusDiff !== 0) return statusDiff;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  const newCount = suggestions.filter((s) => s.status === "NEW").length;

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-5xl tracking-wide">
        HUB <span className="text-gradient">SUGGESTIONS</span>
      </h1>
      <p className="mt-2 font-body text-off-white/60">
        Tag each idea so members see Accepted, Working on it, Applied, or Rejected. Board is at{" "}
        <Link href="/suggestions" className="text-cyan hover:underline">
          /suggestions
        </Link>
        .
      </p>
      <p className="mt-3 font-body text-sm text-off-white/45">
        {newCount} new · {suggestions.length} total
        {Object.entries(SUGGESTION_STATUS_LABELS)
          .map(([key, label]) => {
            const n = suggestions.filter((s) => s.status === key).length;
            return n > 0 ? ` · ${label}: ${n}` : "";
          })
          .join("")}
      </p>

      <div className="mt-8 flex flex-col gap-4">
        {suggestions.length === 0 && (
          <p className="glass rounded-2xl p-8 text-center font-body text-off-white/50">
            No suggestions yet. Members submit from /suggestions.
          </p>
        )}
        {suggestions.map((item) => (
          <SuggestionAdminRow
            key={item.id}
            suggestion={{
              id: item.id,
              ticketNumber: item.ticketNumber,
              title: item.title,
              description: item.description,
              status: item.status,
              adminNotes: item.adminNotes,
              authorName: getMemberDisplayName(item.author),
              authorEmail: item.author.email,
            }}
          />
        ))}
      </div>
    </main>
  );
}
