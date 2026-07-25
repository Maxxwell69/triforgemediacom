import { prisma } from "@/lib/prisma";
import { createChannel } from "./actions";
import ChannelRow from "@/components/admin/ChannelRow";
import { ROLE_LABELS } from "@/lib/rbac";
import { roleOptions } from "@/lib/validations/channel";

export const dynamic = "force-dynamic";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60";

export default async function AdminChannelsPage() {
  const channels = await prisma.channel.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      groups: { select: { name: true } },
      _count: { select: { messages: true } },
    },
  });

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-5xl tracking-wide">
        CHANNEL <span className="text-gradient">MANAGEMENT</span>
      </h1>
      <p className="mt-2 font-body text-off-white/60">
        Create and edit chat channels. Attach a channel to a group from{" "}
        <span className="text-off-white/80">Groups</span> to make it an exception room.
      </p>

      <form
        key={channels.length}
        action={createChannel}
        className="glass mt-8 flex flex-col gap-3 rounded-2xl p-6"
      >
        <h2 className="font-display text-xl tracking-wide text-off-white/80">New channel</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
          <input name="name" required placeholder="e.g. general" className={fieldClass} />
          <select name="minRole" defaultValue="MEMBER" required className={`${fieldClass} sm:w-40`}>
            {roleOptions.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </div>
        <textarea
          name="description"
          rows={2}
          placeholder="Optional description"
          className={fieldClass}
        />
        <button
          type="submit"
          className="self-start rounded-lg bg-orange px-6 py-2 font-body font-semibold text-off-white shadow-glow transition hover:brightness-110"
        >
          Create channel
        </button>
      </form>

      <div className="mt-8 flex flex-col gap-2">
        {channels.length === 0 && (
          <p className="glass rounded-2xl p-8 text-center font-body text-off-white/50">
            No channels yet.
          </p>
        )}
        {channels.map((channel) => (
          <ChannelRow
            key={channel.id}
            channel={{
              id: channel.id,
              name: channel.name,
              description: channel.description,
              minRole: channel.minRole,
              messageCount: channel._count.messages,
              groupNames: channel.groups.map((g) => g.name),
            }}
          />
        ))}
      </div>
    </main>
  );
}
