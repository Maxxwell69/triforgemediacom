import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { meetsMinRole } from "@/lib/rbac";

export default async function ChannelsIndexPage() {
  const { user } = await requireProfile();

  const channels = await prisma.channel.findMany({ orderBy: { createdAt: "asc" } });
  const firstVisible = channels.find((c) => meetsMinRole(user.role, c.minRole));

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
