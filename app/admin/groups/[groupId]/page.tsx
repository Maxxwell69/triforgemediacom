import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import GroupChannelsForm from "@/components/admin/GroupChannelsForm";
import GroupMembersManager from "@/components/admin/GroupMembersManager";

export const dynamic = "force-dynamic";

export default async function AdminGroupDetailPage({
  params,
}: {
  params: { groupId: string };
}) {
  const [group, allChannels, allUsers] = await Promise.all([
    prisma.group.findUnique({
      where: { id: params.groupId },
      include: {
        channels: { select: { id: true } },
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    }),
    prisma.channel.findMany({ orderBy: { createdAt: "asc" }, select: { id: true, name: true } }),
    prisma.user.findMany({
      where: { status: { in: ["ACTIVE", "INVITED"] } },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true },
    }),
  ]);

  if (!group) notFound();

  const memberIds = new Set(group.members.map((m) => m.user.id));
  const members = group.members.map((m) => m.user);
  const nonMembers = allUsers.filter((u) => !memberIds.has(u.id));

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link
        href="/admin/groups"
        className="font-body text-sm text-off-white/50 transition hover:text-off-white"
      >
        &larr; All groups
      </Link>
      <div className="mt-4 flex items-center gap-3">
        <span
          className="h-5 w-5 shrink-0 rounded-full border border-off-white/20"
          style={{ backgroundColor: group.color }}
        />
        <h1 className="font-display text-5xl tracking-wide text-gradient">{group.name}</h1>
      </div>
      {group.description && (
        <p className="mt-2 font-body text-off-white/60">{group.description}</p>
      )}
      <p className="mt-2 font-body text-sm text-off-white/40">
        TikTask access: {group.grantsTikTaskAccess ? "allowed" : "blocked"} for members of this
        group
      </p>

      <section className="mt-10">
        <h2 className="font-display text-2xl tracking-wide text-off-white/80">Channels</h2>
        <p className="mt-1 font-body text-sm text-off-white/50">
          Members of this group can view these channels regardless of role.
        </p>
        <div className="glass mt-4 rounded-2xl p-6">
          <GroupChannelsForm
            groupId={group.id}
            allChannels={allChannels}
            selectedChannelIds={group.channels.map((c) => c.id)}
          />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl tracking-wide text-off-white/80">Members</h2>
        <div className="glass mt-4 rounded-2xl p-6">
          <GroupMembersManager groupId={group.id} members={members} nonMembers={nonMembers} />
        </div>
      </section>
    </main>
  );
}
