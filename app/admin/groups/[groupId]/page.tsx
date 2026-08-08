import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import GroupChannelsForm from "@/components/admin/GroupChannelsForm";
import GroupMembersManager from "@/components/admin/GroupMembersManager";
import GroupInvitePanel from "@/components/admin/GroupInvitePanel";
import GroupApplicationsPanel from "@/components/admin/GroupApplicationsPanel";
import CreateGroupChannelForm from "@/components/groups/CreateGroupChannelForm";
import ImageUploadField from "@/components/ImageUploadField";
import { updateGroup } from "../actions";

export const dynamic = "force-dynamic";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white outline-none transition focus:border-cyan/60";

export default async function AdminGroupDetailPage({
  params,
}: {
  params: { groupId: string };
}) {
  const [group, allChannels, allUsers, pendingApps] = await Promise.all([
    prisma.group.findUnique({
      where: { id: params.groupId },
      include: {
        channels: { select: { id: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
          orderBy: { addedAt: "asc" },
        },
      },
    }),
    prisma.channel.findMany({ orderBy: { createdAt: "asc" }, select: { id: true, name: true } }),
    prisma.user.findMany({
      where: { status: { in: ["ACTIVE", "INVITED"] } },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true },
    }),
    prisma.groupApplication.findMany({
      where: { groupId: params.groupId, status: "PENDING" },
      orderBy: { createdAt: "asc" },
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
  ]);

  if (!group) notFound();

  const memberIds = new Set(group.members.map((m) => m.user.id));
  const members = group.members.map((m) => ({
    id: m.user.id,
    name: m.user.name,
    email: m.user.email,
    role: m.role,
  }));
  const nonMembers = allUsers.filter((u) => !memberIds.has(u.id));

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link
        href="/admin/groups"
        className="font-body text-sm text-off-white/50 transition hover:text-off-white"
      >
        &larr; All groups
      </Link>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {group.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={group.imageUrl}
            alt=""
            className="h-12 w-12 shrink-0 rounded-xl object-cover border border-off-white/15"
          />
        ) : (
          <span
            className="h-5 w-5 shrink-0 rounded-full border border-off-white/20"
            style={{ backgroundColor: group.color }}
          />
        )}
        <h1 className="font-display text-5xl tracking-wide text-gradient">{group.name}</h1>
        {group.isHome && (
          <span className="rounded-md border border-cyan/40 px-2 py-0.5 font-body text-xs text-cyan">
            Home
          </span>
        )}
      </div>
      {group.description && (
        <p className="mt-2 font-body text-off-white/60">{group.description}</p>
      )}
      <p className="mt-2 font-body text-sm text-off-white/40">
        TikTask access: {group.grantsTikTaskAccess ? "allowed" : "blocked"} for members · join:{" "}
        {group.joinMode}
      </p>

      <section className="mt-10">
        <h2 className="font-display text-2xl tracking-wide text-off-white/80">Settings</h2>
        <form action={updateGroup} className="glass mt-4 flex flex-col gap-3 rounded-2xl p-6">
          <input type="hidden" name="id" value={group.id} />
          <input
            name="name"
            defaultValue={group.name}
            required
            disabled={group.isHome}
            className={fieldClass}
          />
          <input name="color" defaultValue={group.color} required className={fieldClass} />
          <textarea
            name="description"
            defaultValue={group.description ?? ""}
            rows={2}
            className={fieldClass}
          />
          <ImageUploadField
            name="imageUrl"
            folder="group-images"
            label="Group image"
            defaultValue={group.imageUrl}
          />
          {!group.isHome && (
            <label className="font-body text-sm text-off-white/70">
              Join mode
              <select
                name="joinMode"
                defaultValue={group.joinMode}
                className={`${fieldClass} mt-1`}
              >
                <option value="INVITE_ONLY">Invite only</option>
                <option value="APPLY">Members can apply</option>
                <option value="CLOSED">Closed</option>
              </select>
            </label>
          )}
          <label className="flex items-center gap-2 font-body text-sm text-off-white/70">
            <input
              type="checkbox"
              name="grantsTikTaskAccess"
              defaultChecked={group.grantsTikTaskAccess}
              className="h-4 w-4 rounded border-off-white/30 bg-transparent accent-orange"
            />
            Members of this group can access TikTask
          </label>
          <button
            type="submit"
            className="self-start rounded-lg bg-cyan/90 px-4 py-2 font-body text-sm font-semibold text-charcoal"
          >
            Save settings
          </button>
        </form>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl tracking-wide text-off-white/80">Channels</h2>
        <p className="mt-1 font-body text-sm text-off-white/50">
          {group.isHome
            ? "Home channels stay role-gated. Members of Home see the main hub list."
            : "Members of this group can view these channels regardless of role (exception rooms)."}
        </p>
        <div className="glass mt-4 rounded-2xl p-6">
          <p className="mb-3 font-body text-sm font-medium text-off-white/70">New channel for this space</p>
          <CreateGroupChannelForm groupId={group.id} />
          <div className="my-6 border-t border-off-white/10" />
          <p className="mb-3 font-body text-sm font-medium text-off-white/70">
            Attach existing channels
          </p>
          <GroupChannelsForm
            groupId={group.id}
            allChannels={allChannels}
            selectedChannelIds={group.channels.map((c) => c.id)}
          />
        </div>
      </section>

      {!group.isHome && (
        <>
          <section className="mt-10">
            <h2 className="font-display text-2xl tracking-wide text-off-white/80">Invites</h2>
            <div className="glass mt-4 rounded-2xl p-6">
              <GroupInvitePanel groupId={group.id} />
            </div>
          </section>

          <section className="mt-10">
            <h2 className="font-display text-2xl tracking-wide text-off-white/80">
              Applications
            </h2>
            <div className="glass mt-4 rounded-2xl p-6">
              <GroupApplicationsPanel applications={pendingApps} />
            </div>
          </section>
        </>
      )}

      <section className="mt-10">
        <h2 className="font-display text-2xl tracking-wide text-off-white/80">Members</h2>
        <div className="glass mt-4 rounded-2xl p-6">
          <GroupMembersManager
            groupId={group.id}
            members={members}
            nonMembers={nonMembers}
            isHome={group.isHome}
          />
        </div>
      </section>
    </main>
  );
}
