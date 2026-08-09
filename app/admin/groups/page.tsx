import { prisma } from "@/lib/prisma";
import { createGroup } from "./actions";
import GroupRow from "@/components/admin/GroupRow";
import ImageUploadField from "@/components/ImageUploadField";

export const dynamic = "force-dynamic";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60";

export default async function AdminGroupsPage() {
  const groups = await prisma.group.findMany({
    orderBy: [{ isHome: "desc" }, { name: "asc" }],
    include: {
      _count: { select: { members: true, channels: true } },
    },
  });

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-5xl tracking-wide">
        GROUPS <span className="text-gradient">& SPACES</span>
      </h1>
      <p className="mt-2 font-body text-off-white/60">
        Home is the main hub. Other spaces support roles (manager / mod / member), invite links,
        and applications. Channels attached to non-Home groups become exception rooms.
      </p>

      <form
        key={groups.length}
        action={createGroup}
        className="glass mt-8 flex flex-col gap-3 rounded-2xl p-6"
      >
        <h2 className="font-display text-xl tracking-wide text-off-white/80">New group</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
          <input
            name="name"
            required
            placeholder="e.g. VIP Creators"
            className={fieldClass}
          />
          <input
            name="color"
            type="text"
            defaultValue="#FD4802"
            required
            className={`${fieldClass} sm:w-32`}
          />
        </div>
        <textarea
          name="description"
          rows={2}
          placeholder="Optional description"
          className={fieldClass}
        />
        <ImageUploadField name="imageUrl" folder="group-images" label="Group image" />
        <label className="font-body text-sm text-off-white/70">
          Join mode
          <select name="joinMode" defaultValue="INVITE_ONLY" className={`${fieldClass} mt-1`}>
            <option value="INVITE_ONLY">Invite only</option>
            <option value="APPLY">Members can apply</option>
            <option value="CLOSED">Closed</option>
          </select>
        </label>
        <label className="flex items-center gap-2 font-body text-sm text-off-white/70">
          <input
            type="checkbox"
            name="grantsTikTaskAccess"
            defaultChecked
            className="h-4 w-4 rounded border-off-white/30 bg-transparent accent-orange"
          />
          Members of this group can access TikTask
        </label>
        <label className="flex items-center gap-2 font-body text-sm text-off-white/70">
          <input
            type="checkbox"
            name="showInList"
            defaultChecked
            className="h-4 w-4 rounded border-off-white/30 bg-transparent accent-orange"
          />
          Show in group listings and the space switcher
        </label>
        <button
          type="submit"
          className="self-start rounded-lg bg-orange px-6 py-2 font-body font-semibold text-off-white shadow-glow transition hover:brightness-110"
        >
          Create group
        </button>
      </form>

      <div className="mt-8 flex flex-col gap-2">
        {groups.length === 0 && (
          <p className="glass rounded-2xl p-8 text-center font-body text-off-white/50">
            No groups yet.
          </p>
        )}
        {groups.map((group) => (
          <GroupRow
            key={group.id}
            group={{
              id: group.id,
              name: group.name,
              description: group.description,
              color: group.color,
              imageUrl: group.imageUrl,
              grantsTikTaskAccess: group.grantsTikTaskAccess,
              showInList: group.showInList,
              isHome: group.isHome,
              joinMode: group.joinMode,
              memberCount: group._count.members,
              channelCount: group._count.channels,
            }}
          />
        ))}
      </div>
    </main>
  );
}
