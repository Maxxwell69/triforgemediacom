import { redirect } from "next/navigation";
import { parseLeaderboardPeriod } from "@/components/LeaderboardSection";

export const dynamic = "force-dynamic";

/** Leaderboard lives on Rewards — keep old links working. */
export default function LeaderboardPage({
  searchParams,
}: {
  searchParams?: { period?: string };
}) {
  const period = parseLeaderboardPeriod(searchParams?.period);
  redirect(`/rewards?period=${period}#leaderboard`);
}
