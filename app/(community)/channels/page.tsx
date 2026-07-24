import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { canAccessChannel, getUserGroupIds } from "@/lib/groups";

export default async function ChannelsIndexPage() {
  const { user } = await requireProfile();

  const [channels, userGroupIds] = await Promise.all([
    prisma.channel.findMany({
      orderBy: { createdAt: "asc" },
      include: { groups: { select: { id: true } } },
    }),
    getUserGroupIds(user.id),
  ]);
  const firstVisible = channels.find((c) => canAccessChannel(user.role, c, userGroupIds));

  if (firstVisible) {
    redirect(`/channels/${firstVisible.id}`);
  }

  return (
    <main className="flex flex-1 items-center justify-center px-6">
      <p className="font-body text-off-white/50">
        No channels have been created yet. Check back soon.
      </p>
    </main>
  );
}
